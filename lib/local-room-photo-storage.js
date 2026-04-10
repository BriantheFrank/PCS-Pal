const LOCAL_ROOM_PHOTO_STORAGE_KEY = "pcspal-local-room-photos-v1";
const THUMBNAIL_MAX_EDGE = 320;
export const MAX_ROOM_PHOTOS = 24;
const MAX_FILE_BYTES = 8_000_000;

const normalizeText = (value) => String(value ?? "").trim();

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `room-photo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const safeParse = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Unable to parse room photo storage payload.", error);
    return fallback;
  }
};

const readStore = (storage) => {
  const parsed = safeParse(storage.getItem(LOCAL_ROOM_PHOTO_STORAGE_KEY), { entries: [] });
  return {
    entries: toArray(parsed?.entries),
  };
};

const writeStore = (storage, payload) => {
  storage.setItem(LOCAL_ROOM_PHOTO_STORAGE_KEY, JSON.stringify(payload));
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });

const readImageDimensions = (dataUrl) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.width || 0, height: image.height || 0, image });
    };
    image.onerror = () => reject(new Error("Could not load the selected image."));
    image.src = dataUrl;
  });

const buildThumbnail = async (dataUrl) => {
  const { width, height, image } = await readImageDimensions(dataUrl);
  if (!width || !height) {
    return { thumbnailDataUrl: dataUrl, width, height };
  }

  const ratio = Math.min(THUMBNAIL_MAX_EDGE / width, THUMBNAIL_MAX_EDGE / height, 1);
  const targetWidth = Math.max(1, Math.round(width * ratio));
  const targetHeight = Math.max(1, Math.round(height * ratio));

  if (ratio >= 1) {
    return { thumbnailDataUrl: dataUrl, width, height };
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return { thumbnailDataUrl: dataUrl, width, height };
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  return {
    thumbnailDataUrl: canvas.toDataURL("image/jpeg", 0.84),
    width,
    height,
  };
};

const makeFingerprint = ({ name, size, lastModified }) => `${name}-${size}-${lastModified}`;

export const getMoveScopeKey = ({ userId, moveProfile }) => {
  const destination = normalizeText(moveProfile?.destination_base_id);
  const moveMonth = normalizeText(moveProfile?.move_month);
  const moveStage = normalizeText(moveProfile?.move_stage);
  const userScope = normalizeText(userId) || "anonymous";

  return [userScope, destination || "no-destination", moveMonth || "no-month", moveStage || "planning"].join(":");
};

export const listRoomPhotos = ({ storage, userId, moveScopeKey, roomId }) => {
  if (!storage || !userId || !moveScopeKey || !roomId) {
    return [];
  }

  return readStore(storage).entries
    .filter((entry) => entry.userId === userId && entry.moveScopeKey === moveScopeKey && entry.roomId === roomId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
};

export const saveRoomPhotos = async ({ storage, files, userId, moveScopeKey, roomId, roomName }) => {
  if (!storage) {
    throw new Error("Local storage is not available in this browser.");
  }
  if (!userId || !moveScopeKey || !roomId) {
    throw new Error("Missing room context. Refresh and try again.");
  }

  const currentStore = readStore(storage);
  const currentEntries = toArray(currentStore.entries);
  const targetEntries = currentEntries.filter(
    (entry) => entry.userId === userId && entry.moveScopeKey === moveScopeKey && entry.roomId === roomId
  );
  const seenFingerprints = new Set(targetEntries.map((entry) => entry.fileFingerprint));
  const remainingSlots = Math.max(0, MAX_ROOM_PHOTOS - targetEntries.length);

  if (!remainingSlots) {
    throw new Error(`This room already has ${MAX_ROOM_PHOTOS} photos saved on this device. Remove one to add more.`);
  }

  const additions = [];
  let skippedOversized = 0;
  const incomingFiles = toArray(files).slice(0, remainingSlots);
  for (const file of incomingFiles) {
    if (Number(file?.size) > MAX_FILE_BYTES) {
      skippedOversized += 1;
      continue;
    }
    const fingerprint = makeFingerprint(file);
    if (seenFingerprints.has(fingerprint)) {
      continue;
    }

    const dataUrl = await fileToDataUrl(file);
    const { thumbnailDataUrl, width, height } = await buildThumbnail(dataUrl);
    additions.push({
      id: createId(),
      userId,
      moveScopeKey,
      roomId,
      roomName,
      status: "saved-local",
      fileName: normalizeText(file.name) || "room-photo.jpg",
      mimeType: normalizeText(file.type) || "image/jpeg",
      size: Number(file.size) || 0,
      fileFingerprint: fingerprint,
      originalDataUrl: dataUrl,
      thumbnailDataUrl,
      width,
      height,
      createdAt: new Date().toISOString(),
    });
    seenFingerprints.add(fingerprint);
  }

  if (!additions.length) {
    return { addedCount: 0, skippedDuplicates: true };
  }

  const nextStore = {
    entries: [...additions, ...currentEntries],
  };

  try {
    writeStore(storage, nextStore);
  } catch (error) {
    console.error("Unable to persist room photos locally.", error);
    throw new Error(
      "Your device could not save these photos locally. Try fewer photos or clear browser storage and retry."
    );
  }

  return {
    addedCount: additions.length,
    skippedDuplicates: additions.length + skippedOversized !== incomingFiles.length,
    skippedOversized,
    reachedRoomLimit: toArray(files).length > remainingSlots,
  };
};

export const deleteRoomPhoto = ({ storage, userId, moveScopeKey, roomId, photoId }) => {
  if (!storage) {
    throw new Error("Local storage is not available in this browser.");
  }

  const currentStore = readStore(storage);
  const nextEntries = toArray(currentStore.entries).filter(
    (entry) =>
      !(entry.userId === userId && entry.moveScopeKey === moveScopeKey && entry.roomId === roomId && entry.id === photoId)
  );

  writeStore(storage, { entries: nextEntries });
};
