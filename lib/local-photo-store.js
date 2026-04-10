import {
  LOCAL_PHOTO_AI_STATUSES,
  LOCAL_PHOTO_DB_NAME,
  LOCAL_PHOTO_DB_VERSION,
  LOCAL_PHOTO_STORES,
  LOCAL_PHOTO_SYNC_STATUSES,
  PHOTO_STORE_INDEXES,
} from "@/lib/inventory-photo-constants";

const DB_UNAVAILABLE_ERRORS = Object.freeze({
  notBrowser: "IndexedDB is only available in a browser context.",
  unsupported: "IndexedDB is not available in this browser.",
  openFailed: "Unable to initialize local photo storage.",
});

let dbOpenPromise = null;

const isBrowser = () => typeof window !== "undefined" && typeof indexedDB !== "undefined";

const makeKey = (...parts) => parts.join("::");

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

const requestToPromise = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });

const transactionDone = (transaction) =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted."));
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed."));
  });

const ensureStoreIndexes = (photoStore) => {
  if (!photoStore.indexNames.contains(PHOTO_STORE_INDEXES.byRoom)) {
    photoStore.createIndex(PHOTO_STORE_INDEXES.byRoom, ["userId", "moveId", "roomId"], {
      unique: false,
    });
  }

  if (!photoStore.indexNames.contains(PHOTO_STORE_INDEXES.byMove)) {
    photoStore.createIndex(PHOTO_STORE_INDEXES.byMove, ["userId", "moveId"], { unique: false });
  }

  if (!photoStore.indexNames.contains(PHOTO_STORE_INDEXES.byUser)) {
    photoStore.createIndex(PHOTO_STORE_INDEXES.byUser, "userId", { unique: false });
  }

  if (!photoStore.indexNames.contains(PHOTO_STORE_INDEXES.byRoomCreatedAt)) {
    photoStore.createIndex(
      PHOTO_STORE_INDEXES.byRoomCreatedAt,
      ["userId", "moveId", "roomId", "createdAt"],
      { unique: false }
    );
  }
};

const openDb = () => {
  if (!isBrowser()) {
    throw new Error(
      typeof window === "undefined" ? DB_UNAVAILABLE_ERRORS.notBrowser : DB_UNAVAILABLE_ERRORS.unsupported
    );
  }

  const request = indexedDB.open(LOCAL_PHOTO_DB_NAME, LOCAL_PHOTO_DB_VERSION);

  request.onupgradeneeded = () => {
    const db = request.result;

    const photoStore = db.objectStoreNames.contains(LOCAL_PHOTO_STORES.photos)
      ? request.transaction.objectStore(LOCAL_PHOTO_STORES.photos)
      : db.createObjectStore(LOCAL_PHOTO_STORES.photos, {
          keyPath: "localPhotoId",
        });

    ensureStoreIndexes(photoStore);

    if (!db.objectStoreNames.contains(LOCAL_PHOTO_STORES.blobs)) {
      db.createObjectStore(LOCAL_PHOTO_STORES.blobs, { keyPath: "blobKey" });
    }
  };

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error(DB_UNAVAILABLE_ERRORS.openFailed));
    request.onblocked = () => reject(new Error("Local photo store open was blocked by another tab."));
  });
};

export const initLocalPhotoStore = async () => {
  if (!dbOpenPromise) {
    dbOpenPromise = openDb().catch((error) => {
      dbOpenPromise = null;
      throw error;
    });
  }

  return dbOpenPromise;
};

const withDb = async (work) => {
  try {
    const db = await initLocalPhotoStore();
    return await work(db);
  } catch (error) {
    console.warn("Local photo storage is unavailable.", error);
    return null;
  }
};

const normalizePhotoInput = ({
  localPhotoId,
  userId,
  moveId,
  roomId,
  fileName,
  mimeType,
  fileSizeBytes,
  width,
  height,
  createdAt,
  capturedAt,
  imageBlob,
  thumbnailBlob,
  aiStatus,
}) => {
  if (!userId || !moveId || !roomId) {
    throw new Error("savePhoto requires userId, moveId, and roomId.");
  }

  if (!(imageBlob instanceof Blob)) {
    throw new Error("savePhoto requires a valid imageBlob.");
  }

  const id = localPhotoId || createId();
  const imageBlobKey = makeKey(userId, moveId, roomId, id, "image");
  const thumbnailBlobKey = thumbnailBlob instanceof Blob ? makeKey(userId, moveId, roomId, id, "thumb") : null;

  return {
    localPhotoId: id,
    userId,
    moveId,
    roomId,
    fileName: String(fileName || "room-photo"),
    mimeType: String(mimeType || imageBlob.type || "application/octet-stream"),
    fileSizeBytes: Number.isFinite(Number(fileSizeBytes))
      ? Number(fileSizeBytes)
      : Number(imageBlob.size) || 0,
    width: Number.isFinite(Number(width)) ? Number(width) : null,
    height: Number.isFinite(Number(height)) ? Number(height) : null,
    createdAt: createdAt || new Date().toISOString(),
    capturedAt: capturedAt || null,
    localOnly: true,
    syncStatus: LOCAL_PHOTO_SYNC_STATUSES.LOCAL_ONLY,
    aiStatus: aiStatus || LOCAL_PHOTO_AI_STATUSES.NOT_STARTED,
    imageBlobKey,
    thumbnailBlobKey,
    imageBlob,
    thumbnailBlob: thumbnailBlob instanceof Blob ? thumbnailBlob : null,
  };
};

export const savePhoto = async (input) =>
  withDb(async (db) => {
    const normalized = normalizePhotoInput(input || {});

    const transaction = db.transaction([LOCAL_PHOTO_STORES.photos, LOCAL_PHOTO_STORES.blobs], "readwrite");
    const photoStore = transaction.objectStore(LOCAL_PHOTO_STORES.photos);
    const blobStore = transaction.objectStore(LOCAL_PHOTO_STORES.blobs);

    blobStore.put({ blobKey: normalized.imageBlobKey, blob: normalized.imageBlob });

    if (normalized.thumbnailBlobKey && normalized.thumbnailBlob) {
      blobStore.put({ blobKey: normalized.thumbnailBlobKey, blob: normalized.thumbnailBlob });
    }

    photoStore.put({
      localPhotoId: normalized.localPhotoId,
      userId: normalized.userId,
      moveId: normalized.moveId,
      roomId: normalized.roomId,
      fileName: normalized.fileName,
      mimeType: normalized.mimeType,
      fileSizeBytes: normalized.fileSizeBytes,
      width: normalized.width,
      height: normalized.height,
      createdAt: normalized.createdAt,
      capturedAt: normalized.capturedAt,
      localOnly: true,
      syncStatus: normalized.syncStatus,
      aiStatus: normalized.aiStatus,
      imageBlobKey: normalized.imageBlobKey,
      thumbnailBlobKey: normalized.thumbnailBlobKey,
    });

    await transactionDone(transaction);

    return {
      localPhotoId: normalized.localPhotoId,
      userId: normalized.userId,
      moveId: normalized.moveId,
      roomId: normalized.roomId,
      fileName: normalized.fileName,
      mimeType: normalized.mimeType,
      fileSizeBytes: normalized.fileSizeBytes,
      width: normalized.width,
      height: normalized.height,
      createdAt: normalized.createdAt,
      capturedAt: normalized.capturedAt,
      localOnly: true,
      syncStatus: normalized.syncStatus,
      aiStatus: normalized.aiStatus,
      imageBlobKey: normalized.imageBlobKey,
      thumbnailBlobKey: normalized.thumbnailBlobKey,
    };
  });

export const getPhoto = async ({ userId, moveId, roomId, localPhotoId }) =>
  withDb(async (db) => {
    if (!localPhotoId) {
      return null;
    }

    const transaction = db.transaction([LOCAL_PHOTO_STORES.photos, LOCAL_PHOTO_STORES.blobs], "readonly");
    const photoStore = transaction.objectStore(LOCAL_PHOTO_STORES.photos);
    const blobStore = transaction.objectStore(LOCAL_PHOTO_STORES.blobs);

    const photo = await requestToPromise(photoStore.get(localPhotoId));
    if (!photo) {
      return null;
    }

    if (
      (userId && photo.userId !== userId) ||
      (moveId && photo.moveId !== moveId) ||
      (roomId && photo.roomId !== roomId)
    ) {
      return null;
    }

    const imageBlobResult = await requestToPromise(blobStore.get(photo.imageBlobKey));
    const thumbBlobResult = photo.thumbnailBlobKey
      ? await requestToPromise(blobStore.get(photo.thumbnailBlobKey))
      : null;

    return {
      ...photo,
      imageBlob: imageBlobResult?.blob || null,
      thumbnailBlob: thumbBlobResult?.blob || null,
    };
  });

export const getPhotosByRoom = async ({ userId, moveId, roomId, includeBlobs = false }) =>
  withDb(async (db) => {
    if (!userId || !moveId || !roomId) {
      return [];
    }

    const transaction = db.transaction([LOCAL_PHOTO_STORES.photos, LOCAL_PHOTO_STORES.blobs], "readonly");
    const photoStore = transaction.objectStore(LOCAL_PHOTO_STORES.photos);
    const index = photoStore.index(PHOTO_STORE_INDEXES.byRoom);
    const photos = await requestToPromise(index.getAll([userId, moveId, roomId]));

    photos.sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));

    if (!includeBlobs) {
      return photos;
    }

    const blobStore = transaction.objectStore(LOCAL_PHOTO_STORES.blobs);
    const withBlobs = await Promise.all(
      photos.map(async (photo) => {
        const imageBlobResult = await requestToPromise(blobStore.get(photo.imageBlobKey));
        const thumbBlobResult = photo.thumbnailBlobKey
          ? await requestToPromise(blobStore.get(photo.thumbnailBlobKey))
          : null;

        return {
          ...photo,
          imageBlob: imageBlobResult?.blob || null,
          thumbnailBlob: thumbBlobResult?.blob || null,
        };
      })
    );

    return withBlobs;
  });

export const updatePhotoStatus = async ({
  localPhotoId,
  aiStatus,
  syncStatus,
  thumbnailBlob,
  thumbnailBlobKey,
}) =>
  withDb(async (db) => {
    if (!localPhotoId) {
      return null;
    }

    const transaction = db.transaction([LOCAL_PHOTO_STORES.photos, LOCAL_PHOTO_STORES.blobs], "readwrite");
    const photoStore = transaction.objectStore(LOCAL_PHOTO_STORES.photos);
    const blobStore = transaction.objectStore(LOCAL_PHOTO_STORES.blobs);

    const existing = await requestToPromise(photoStore.get(localPhotoId));
    if (!existing) {
      return null;
    }

    const nextRecord = {
      ...existing,
      aiStatus: aiStatus || existing.aiStatus,
      syncStatus: syncStatus || existing.syncStatus,
    };

    if (thumbnailBlob instanceof Blob) {
      const nextThumbKey = thumbnailBlobKey || existing.thumbnailBlobKey || `${existing.imageBlobKey}::thumb`;
      blobStore.put({ blobKey: nextThumbKey, blob: thumbnailBlob });
      nextRecord.thumbnailBlobKey = nextThumbKey;
    }

    photoStore.put(nextRecord);
    await transactionDone(transaction);

    return nextRecord;
  });

export const deletePhoto = async ({ localPhotoId }) =>
  withDb(async (db) => {
    if (!localPhotoId) {
      return false;
    }

    const transaction = db.transaction([LOCAL_PHOTO_STORES.photos, LOCAL_PHOTO_STORES.blobs], "readwrite");
    const photoStore = transaction.objectStore(LOCAL_PHOTO_STORES.photos);
    const blobStore = transaction.objectStore(LOCAL_PHOTO_STORES.blobs);

    const existing = await requestToPromise(photoStore.get(localPhotoId));
    if (!existing) {
      return false;
    }

    photoStore.delete(localPhotoId);
    if (existing.imageBlobKey) {
      blobStore.delete(existing.imageBlobKey);
    }
    if (existing.thumbnailBlobKey) {
      blobStore.delete(existing.thumbnailBlobKey);
    }

    await transactionDone(transaction);
    return true;
  });

export const clearRoomPhotos = async ({ userId, moveId, roomId }) =>
  withDb(async (db) => {
    const photos = await getPhotosByRoom({ userId, moveId, roomId, includeBlobs: false });
    if (!Array.isArray(photos) || photos.length === 0) {
      return 0;
    }

    const transaction = db.transaction([LOCAL_PHOTO_STORES.photos, LOCAL_PHOTO_STORES.blobs], "readwrite");
    const photoStore = transaction.objectStore(LOCAL_PHOTO_STORES.photos);
    const blobStore = transaction.objectStore(LOCAL_PHOTO_STORES.blobs);

    for (const photo of photos) {
      photoStore.delete(photo.localPhotoId);
      if (photo.imageBlobKey) {
        blobStore.delete(photo.imageBlobKey);
      }
      if (photo.thumbnailBlobKey) {
        blobStore.delete(photo.thumbnailBlobKey);
      }
    }

    await transactionDone(transaction);
    return photos.length;
  });

export const countPhotosByRoom = async ({ userId, moveId, roomId }) =>
  withDb(async (db) => {
    if (!userId || !moveId || !roomId) {
      return 0;
    }

    const transaction = db.transaction(LOCAL_PHOTO_STORES.photos, "readonly");
    const photoStore = transaction.objectStore(LOCAL_PHOTO_STORES.photos);
    const index = photoStore.index(PHOTO_STORE_INDEXES.byRoom);
    const count = await requestToPromise(index.count([userId, moveId, roomId]));

    return Number(count) || 0;
  });
