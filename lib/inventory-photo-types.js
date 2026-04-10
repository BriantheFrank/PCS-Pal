import {
  EXTRACTION_JOB_STATUSES,
  LOCAL_PHOTO_AI_STATUSES,
  LOCAL_PHOTO_SYNC_STATUSES,
} from "@/lib/inventory-photo-constants";

/** @typedef {(typeof LOCAL_PHOTO_AI_STATUSES)[keyof typeof LOCAL_PHOTO_AI_STATUSES]} LocalPhotoAiStatus */
/** @typedef {(typeof LOCAL_PHOTO_SYNC_STATUSES)[keyof typeof LOCAL_PHOTO_SYNC_STATUSES]} LocalPhotoSyncStatus */
/** @typedef {(typeof EXTRACTION_JOB_STATUSES)[keyof typeof EXTRACTION_JOB_STATUSES]} ExtractionJobStatus */

/**
 * @typedef {Object} LocalRoomPhoto
 * @property {string} localPhotoId
 * @property {string} userId
 * @property {string} moveId
 * @property {string} roomId
 * @property {string} fileName
 * @property {string} mimeType
 * @property {number} fileSizeBytes
 * @property {number | null} width
 * @property {number | null} height
 * @property {string} createdAt ISO-8601 timestamp
 * @property {string | null} capturedAt ISO-8601 timestamp
 * @property {true} localOnly
 * @property {LocalPhotoSyncStatus} syncStatus
 * @property {LocalPhotoAiStatus} aiStatus
 * @property {string} imageBlobKey
 * @property {string | null} thumbnailBlobKey
 */

/**
 * @typedef {Object} PreparedImage
 * @property {string} localPhotoId
 * @property {string} mimeType
 * @property {number} width
 * @property {number} height
 * @property {number} fileSizeBytes
 * @property {Blob} blob
 * @property {Blob | undefined} thumbnailBlob
 */

/**
 * @typedef {Object} LocalRoomPhotoRecord
 * @property {LocalRoomPhoto} photo
 * @property {Blob} imageBlob
 * @property {Blob | null} thumbnailBlob
 */

export {};
