const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_JPEG_QUALITY = 0.78;
const DEFAULT_OUTPUT_MIME_TYPE = "image/jpeg";
const DEFAULT_THUMBNAIL_MAX_DIMENSION = 320;
const DEFAULT_THUMBNAIL_QUALITY = 0.65;

export const IMAGE_PREPROCESS_DEFAULTS = Object.freeze({
  maxDimension: DEFAULT_MAX_DIMENSION,
  quality: DEFAULT_JPEG_QUALITY,
  outputMimeType: DEFAULT_OUTPUT_MIME_TYPE,
  thumbnailMaxDimension: DEFAULT_THUMBNAIL_MAX_DIMENSION,
  thumbnailQuality: DEFAULT_THUMBNAIL_QUALITY,
});

const canUseBrowserImageApis = () =>
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  typeof HTMLCanvasElement !== "undefined";

const normalizePositiveNumber = (value, fallback) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback;
  }
  return numericValue;
};

const getScaledDimensions = ({ width, height, maxDimension }) => {
  const longestEdge = Math.max(width, height);
  if (!longestEdge || longestEdge <= maxDimension) {
    return {
      width,
      height,
      resized: false,
    };
  }

  const scale = maxDimension / longestEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    resized: true,
  };
};

const readBlobAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Failed to read blob."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });

const createImageElement = (objectUrl) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to decode image."));
    image.src = objectUrl;
  });

const decodeImage = async (blob) => {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob, {
        imageOrientation: "from-image",
      });
    } catch {
      // Fallback to Image element if createImageBitmap is not fully supported.
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    return await createImageElement(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const drawToCanvas = ({ source, width, height }) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    alpha: false,
    desynchronized: true,
  });

  if (!context) {
    throw new Error("Unable to create canvas context.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  return canvas;
};

const canvasToBlob = (canvas, mimeType, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to encode image blob from canvas."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });

const toSafeFileName = (fileName) => {
  const baseName = String(fileName || "prepared-image")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return baseName || "prepared-image";
};

const getExtensionForMimeType = (mimeType) => {
  if (mimeType === "image/webp") {
    return "webp";
  }
  if (mimeType === "image/png") {
    return "png";
  }
  return "jpg";
};

const toPreparedFileName = (fileName, mimeType) =>
  `${toSafeFileName(fileName)}-prepared.${getExtensionForMimeType(mimeType)}`;

/**
 * @typedef {Object} PreparedImage
 * @property {string} localPhotoId
 * @property {string} roomId
 * @property {string} mimeType
 * @property {Blob} blob
 * @property {number} width
 * @property {number} height
 * @property {number} byteSize
 * @property {string} fileName
 * @property {number} originalByteSize
 * @property {boolean} resized
 */

/**
 * @typedef {Object} PreparedImageError
 * @property {string} localPhotoId
 * @property {string} roomId
 * @property {string} code
 * @property {string} message
 * @property {unknown} [cause]
 */

/**
 * @typedef {Object} LocalRoomPhoto
 * @property {string} localPhotoId
 * @property {string} roomId
 * @property {Blob | File} fileOrBlob
 * @property {string} [fileName]
 */

/**
 * @param {Blob | File} fileOrBlob
 * @param {{
 * localPhotoId?: string,
 * roomId?: string,
 * fileName?: string,
 * maxDimension?: number,
 * quality?: number,
 * outputMimeType?: string,
 * }} [options]
 * @returns {Promise<PreparedImage>}
 */
export const prepareImageForInference = async (fileOrBlob, options = {}) => {
  if (!canUseBrowserImageApis()) {
    throw new Error("Image preprocessing is only available in browser contexts.");
  }

  if (!(fileOrBlob instanceof Blob)) {
    throw new Error("prepareImageForInference expects a Blob or File input.");
  }

  const maxDimension = normalizePositiveNumber(
    options.maxDimension,
    IMAGE_PREPROCESS_DEFAULTS.maxDimension
  );
  const quality = Math.min(1, Math.max(0.1, Number(options.quality ?? IMAGE_PREPROCESS_DEFAULTS.quality)));
  const outputMimeType =
    typeof options.outputMimeType === "string" && options.outputMimeType.startsWith("image/")
      ? options.outputMimeType
      : IMAGE_PREPROCESS_DEFAULTS.outputMimeType;

  const decoded = await decodeImage(fileOrBlob);

  try {
    const sourceWidth = Number(decoded.width) || 0;
    const sourceHeight = Number(decoded.height) || 0;

    if (!sourceWidth || !sourceHeight) {
      throw new Error("Decoded image dimensions were invalid.");
    }

    const nextDimensions = getScaledDimensions({
      width: sourceWidth,
      height: sourceHeight,
      maxDimension,
    });

    const canvas = drawToCanvas({
      source: decoded,
      width: nextDimensions.width,
      height: nextDimensions.height,
    });

    const preparedBlob = await canvasToBlob(canvas, outputMimeType, quality);
    const originalFileName =
      typeof options.fileName === "string" && options.fileName
        ? options.fileName
        : typeof fileOrBlob.name === "string"
          ? fileOrBlob.name
          : "prepared-image";

    return {
      localPhotoId: String(options.localPhotoId || ""),
      roomId: String(options.roomId || ""),
      mimeType: preparedBlob.type || outputMimeType,
      blob: preparedBlob,
      width: nextDimensions.width,
      height: nextDimensions.height,
      byteSize: preparedBlob.size,
      fileName: toPreparedFileName(originalFileName, preparedBlob.type || outputMimeType),
      originalByteSize: fileOrBlob.size,
      resized: nextDimensions.resized,
    };
  } finally {
    if (decoded && typeof decoded.close === "function") {
      decoded.close();
    }
  }
};

/**
 * @param {Array<LocalRoomPhoto>} photos
 * @param {{
 * maxDimension?: number,
 * quality?: number,
 * outputMimeType?: string,
 * }} [options]
 */
export const prepareRoomPhotosForInference = async (photos, options = {}) => {
  const inputList = Array.isArray(photos) ? photos : [];
  const prepared = [];
  const errors = [];

  await Promise.all(
    inputList.map(async (photo) => {
      try {
        const preparedPhoto = await prepareImageForInference(photo.fileOrBlob, {
          localPhotoId: photo.localPhotoId,
          roomId: photo.roomId,
          fileName: photo.fileName,
          ...options,
        });

        prepared.push(preparedPhoto);
      } catch (error) {
        errors.push({
          localPhotoId: String(photo?.localPhotoId || ""),
          roomId: String(photo?.roomId || ""),
          code: "image_prepare_failed",
          message:
            error instanceof Error && error.message
              ? error.message
              : "Image preprocessing failed.",
          cause: error,
        });
      }
    })
  );

  return {
    prepared,
    errors,
    totalInputCount: inputList.length,
    successCount: prepared.length,
    failureCount: errors.length,
  };
};

export const createThumbnail = async (fileOrBlob, options = {}) =>
  prepareImageForInference(fileOrBlob, {
    ...options,
    maxDimension: normalizePositiveNumber(
      options.maxDimension,
      IMAGE_PREPROCESS_DEFAULTS.thumbnailMaxDimension
    ),
    quality: Number(options.quality ?? IMAGE_PREPROCESS_DEFAULTS.thumbnailQuality),
  });

export const preparedImageToBase64 = async (preparedImage) => {
  if (!preparedImage || !(preparedImage.blob instanceof Blob)) {
    throw new Error("preparedImageToBase64 expects a PreparedImage with a blob field.");
  }

  return readBlobAsDataUrl(preparedImage.blob);
};

export const estimatePreparedBatchByteSize = (preparedImages) => {
  if (!Array.isArray(preparedImages)) {
    return 0;
  }

  return preparedImages.reduce((total, image) => {
    const byteSize = Number(image?.byteSize ?? image?.blob?.size ?? 0);
    return total + (Number.isFinite(byteSize) ? byteSize : 0);
  }, 0);
};

export const isPreparedBatchOversized = (preparedImages, maxBytes) => {
  const threshold = normalizePositiveNumber(maxBytes, 0);
  if (!threshold) {
    return false;
  }

  return estimatePreparedBatchByteSize(preparedImages) > threshold;
};
