/**
 * Free-tier room photos are local-only: originals stay in the user's browser/device.
 * Later AI-extracted inventory text can sync, but original image binaries must not upload in this phase.
 */
export const LOCAL_PHOTO_DB_NAME = "pcs-pal-local-photos";
export const LOCAL_PHOTO_DB_VERSION = 1;

export const LOCAL_PHOTO_STORES = Object.freeze({
  photos: "room_photos",
  blobs: "photo_blobs",
});

export const LOCAL_PHOTO_AI_STATUSES = Object.freeze({
  NOT_STARTED: "not_started",
  QUEUED: "queued",
  PROCESSING: "processing",
  DONE: "done",
  FAILED: "failed",
});

export const LOCAL_PHOTO_SYNC_STATUSES = Object.freeze({
  LOCAL_ONLY: "local_only",
});

export const EXTRACTION_JOB_STATUSES = Object.freeze({
  PENDING: "pending",
  QUEUED: "queued",
  PREPARING_IMAGE: "preparing_image",
  PROCESSING: "processing",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELLED: "cancelled",
});

export const PHOTO_STORE_INDEXES = Object.freeze({
  byRoom: "by_room",
  byMove: "by_move",
  byUser: "by_user",
  byRoomCreatedAt: "by_room_created_at",
});
