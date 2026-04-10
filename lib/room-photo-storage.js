import { countPhotosByRoom, deletePhoto, getPhoto, getPhotosByRoom, savePhoto } from "@/lib/local-photo-store";
import {
  deleteRoomPhoto as deleteLegacyRoomPhoto,
  getMoveScopeKey,
  listRoomPhotos as listLegacyRoomPhotos,
  MAX_ROOM_PHOTOS,
  saveRoomPhotos as saveLegacyRoomPhotos,
} from "@/lib/local-room-photo-storage";

const MAX_FILE_BYTES = 8_000_000;

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image preview."));
    reader.readAsDataURL(blob);
  });

const readImageDimensions = (dataUrl) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.width || 0, height: image.height || 0 });
    image.onerror = () => reject(new Error("Could not inspect image dimensions."));
    image.src = dataUrl;
  });

const createThumbnailBlob = async (blob) => {
  const originalDataUrl = await blobToDataUrl(blob);
  const { width, height } = await readImageDimensions(originalDataUrl);

  const ratio = Math.min(320 / (width || 1), 320 / (height || 1), 1);
  if (ratio >= 1 || !width || !height) {
    return { thumbnailBlob: blob, width, height };
  }

  const image = new Image();
  const imageLoaded = new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("Could not load image for thumbnail."));
  });
  image.src = originalDataUrl;
  await imageLoaded;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  const context = canvas.getContext("2d");
  if (!context) {
    return { thumbnailBlob: blob, width, height };
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const thumbnailBlob = await new Promise((resolve) =>
    canvas.toBlob((nextBlob) => resolve(nextBlob || blob), "image/jpeg", 0.84)
  );

  return { thumbnailBlob, width, height };
};

const normalizeEntry = async (entry) => {
  const detail = await getPhoto({ localPhotoId: entry.localPhotoId });
  const originalDataUrl = detail?.imageBlob ? await blobToDataUrl(detail.imageBlob) : "";
  const thumbnailDataUrl = detail?.thumbnailBlob ? await blobToDataUrl(detail.thumbnailBlob) : originalDataUrl;

  return {
    id: entry.localPhotoId,
    fileName: entry.fileName,
    createdAt: entry.createdAt,
    status: "saved-local",
    originalDataUrl,
    thumbnailDataUrl,
  };
};

const makeFingerprint = ({ name, size, lastModified }) => `${name}-${size}-${lastModified}`;

export const listRoomPhotos = async ({ userId, moveProfile, roomId }) => {
  const moveId = getMoveScopeKey({ userId, moveProfile });
  const entries = await getPhotosByRoom({ userId, moveId, roomId, includeBlobs: false });

  if (Array.isArray(entries)) {
    const hydrated = await Promise.all(entries.map((entry) => normalizeEntry(entry)));
    hydrated.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return hydrated;
  }

  if (typeof window === "undefined") {
    return [];
  }

  return listLegacyRoomPhotos({
    storage: window.localStorage,
    userId,
    moveScopeKey: moveId,
    roomId,
  });
};

export const saveRoomPhotos = async ({ files, userId, moveProfile, roomId, roomName }) => {
  const moveId = getMoveScopeKey({ userId, moveProfile });

  const existingCount = await countPhotosByRoom({ userId, moveId, roomId });
  if (typeof existingCount !== "number") {
    return saveLegacyRoomPhotos({
      storage: window.localStorage,
      files,
      userId,
      moveScopeKey: moveId,
      roomId,
      roomName,
    });
  }

  if (existingCount >= MAX_ROOM_PHOTOS) {
    throw new Error(`This room already has ${MAX_ROOM_PHOTOS} photos saved on this device. Remove one to add more.`);
  }

  const existing = await getPhotosByRoom({ userId, moveId, roomId, includeBlobs: false });
  const seenFingerprints = new Set(
    (existing || []).map((entry) => makeFingerprint({
      name: entry.fileName,
      size: entry.fileSizeBytes,
      lastModified: entry.capturedAt || entry.createdAt,
    }))
  );

  const additions = [];
  let skippedOversized = 0;

  for (const file of Array.isArray(files) ? files.slice(0, MAX_ROOM_PHOTOS - existingCount) : []) {
    if (Number(file?.size) > MAX_FILE_BYTES) {
      skippedOversized += 1;
      continue;
    }

    const fingerprint = makeFingerprint(file);
    if (seenFingerprints.has(fingerprint)) {
      continue;
    }

    const { thumbnailBlob, width, height } = await createThumbnailBlob(file);
    const record = await savePhoto({
      userId,
      moveId,
      roomId,
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      width,
      height,
      imageBlob: file,
      thumbnailBlob,
      capturedAt: new Date(file.lastModified || Date.now()).toISOString(),
    });

    if (record) {
      additions.push(record.localPhotoId);
      seenFingerprints.add(fingerprint);
    }
  }

  return {
    addedCount: additions.length,
    skippedOversized,
    skippedDuplicates: additions.length < (Array.isArray(files) ? files.length - skippedOversized : 0),
    reachedRoomLimit: existingCount + additions.length >= MAX_ROOM_PHOTOS,
  };
};

export const deleteRoomPhoto = async ({ userId, moveProfile, roomId, photoId }) => {
  const moveId = getMoveScopeKey({ userId, moveProfile });
  const deleted = await deletePhoto({ localPhotoId: photoId });

  if (deleted === null) {
    return deleteLegacyRoomPhoto({
      storage: window.localStorage,
      userId,
      moveScopeKey: moveId,
      roomId,
      photoId,
    });
  }

  return deleted;
};

export { MAX_ROOM_PHOTOS };
