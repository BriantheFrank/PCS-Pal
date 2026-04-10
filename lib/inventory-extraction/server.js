import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";
import {
  INVENTORY_EXTRACTION_JSON_SCHEMA,
  isValidInventoryExtractionResponse,
  normalizeInventoryExtractionResponse,
} from "@/lib/inventory-extraction-schema";

const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 16 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 30000;

const normalizeText = (value) => String(value ?? "").trim();

const parseJsonSafely = (value, fallback = null) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const createHttpError = (message, status = 500, details = null) => {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
};

const getRequiredEnv = (name) => {
  const value = normalizeText(process.env[name]);
  if (!value) {
    throw createHttpError(`${name} is not configured on the server.`, 500);
  }
  return value;
};

const resolveAuthenticatedUser = async ({ request, admin }) => {
  const authorizationHeader = String(request.headers.get("authorization") || "");
  if (!authorizationHeader.toLowerCase().startsWith("bearer ")) {
    throw createHttpError("Sign in is required before extracting inventory from photos.", 401);
  }

  const accessToken = authorizationHeader.slice(7).trim();
  if (!accessToken) {
    throw createHttpError("Sign in is required before extracting inventory from photos.", 401);
  }

  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data?.user) {
    throw createHttpError("Your sign-in session is invalid. Please sign in again.", 401);
  }

  return data.user;
};

const extractBase64Payload = (dataUrl) => {
  const normalized = normalizeText(dataUrl);
  const match = normalized.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([a-z0-9+/=\s]+)$/i);

  if (!match) {
    throw createHttpError(
      "Each selected photo must be a data URL using JPEG, PNG, or WebP.",
      400
    );
  }

  return {
    mimeType: match[1].toLowerCase(),
    base64Data: match[2].replace(/\s+/g, ""),
  };
};

const estimateDecodedBytes = (base64Value) => Math.floor((base64Value.length * 3) / 4);

const normalizePhotoInput = (photo, index) => {
  const localPhotoId = normalizeText(photo?.localPhotoId);
  if (!localPhotoId) {
    throw createHttpError(`Photo ${index + 1} is missing localPhotoId.`, 400);
  }

  const { mimeType, base64Data } = extractBase64Payload(photo?.dataUrl);
  const decodedBytes = estimateDecodedBytes(base64Data);
  if (decodedBytes > MAX_IMAGE_BYTES) {
    throw createHttpError(
      `Photo ${index + 1} exceeds the ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))}MB limit.`,
      413
    );
  }

  return {
    localPhotoId,
    mimeType,
    base64Data,
    decodedBytes,
    width: Number.isFinite(Number(photo?.width)) ? Number(photo.width) : null,
    height: Number.isFinite(Number(photo?.height)) ? Number(photo.height) : null,
    fileName: normalizeText(photo?.fileName) || `room-photo-${index + 1}`,
  };
};

const validatePayload = (payload) => {
  const moveId = normalizeText(payload?.moveId);
  const roomId = normalizeText(payload?.roomId);
  const roomName = normalizeText(payload?.roomName);

  if (!moveId) {
    throw createHttpError("moveId is required.", 400);
  }

  if (!roomId) {
    throw createHttpError("roomId is required.", 400);
  }

  const photos = Array.isArray(payload?.photos) ? payload.photos : [];

  if (!photos.length) {
    throw createHttpError("Select at least one photo before running extraction.", 400);
  }

  if (photos.length > MAX_IMAGES) {
    throw createHttpError(`You can extract from up to ${MAX_IMAGES} photos at once.`, 400);
  }

  const normalizedPhotos = photos.map(normalizePhotoInput);
  const totalBytes = normalizedPhotos.reduce((total, photo) => total + photo.decodedBytes, 0);

  if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
    throw createHttpError(
      `Selected photos exceed the ${Math.round(MAX_TOTAL_IMAGE_BYTES / (1024 * 1024))}MB batch limit.`,
      413
    );
  }

  return {
    moveId,
    roomId,
    roomName,
    roomContext: normalizeText(payload?.roomContext),
    normalizedPhotos,
    totalBytes,
  };
};

const verifyMoveAndRoomOwnership = async ({ admin, userId, moveId, roomId }) => {
  const { data: move, error: moveError } = await admin
    .from("moves")
    .select("id, user_id")
    .eq("id", moveId)
    .eq("user_id", userId)
    .maybeSingle();

  if (moveError) {
    throw createHttpError(`Unable to verify move ownership: ${moveError.message}`, 500);
  }

  if (!move) {
    throw createHttpError("Move not found for this account.", 404);
  }

  const { data: inventoryRow, error: inventoryError } = await admin
    .from("user_inventory")
    .select("payload")
    .eq("user_id", userId)
    .maybeSingle();

  if (inventoryError) {
    throw createHttpError(`Unable to verify room ownership: ${inventoryError.message}`, 500);
  }

  const rooms = Array.isArray(inventoryRow?.payload?.rooms) ? inventoryRow.payload.rooms : [];
  const room = rooms.find((candidate) => normalizeText(candidate?.id) === roomId);

  if (!room) {
    throw createHttpError("Room not found in this account inventory.", 404);
  }

  return {
    roomNameFromInventory: normalizeText(room.name),
  };
};

const resolveModelConfig = () => ({
  apiKey: getRequiredEnv("OPENAI_API_KEY"),
  model: normalizeText(process.env.OPENAI_MODEL) || "gpt-4.1-mini",
  baseUrl: normalizeText(process.env.OPENAI_BASE_URL) || "https://api.openai.com/v1",
});

const buildPromptText = ({ roomName, roomContext }) => {
  const contextLine = roomContext ? `Room context: ${roomContext}` : "Room context: none provided.";

  return [
    "You are a conservative household inventory extraction assistant for military PCS moves.",
    "Return valid JSON only.",
    "Only include items directly visible in one or more provided photos.",
    "Do not infer closed container contents.",
    "Use cautious quantities and weight estimates in pounds.",
    "Set fragile/high-value only when visually justified.",
    "If uncertain, keep confidence low and add a needs_review entry.",
    `Room name: ${roomName || "Unknown room"}`,
    contextLine,
  ].join("\n");
};

const buildChatCompletionBody = ({ model, roomName, roomContext, photos }) => ({
  model,
  temperature: 0.2,
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "inventory_extraction",
      strict: true,
      schema: INVENTORY_EXTRACTION_JSON_SCHEMA,
    },
  },
  messages: [
    {
      role: "system",
      content:
        "Return structured JSON inventory extraction output for the user's room photos. No markdown and no prose outside JSON.",
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: buildPromptText({ roomName, roomContext }),
        },
        ...photos.map((photo) => ({
          type: "image_url",
          image_url: {
            url: `data:${photo.mimeType};base64,${photo.base64Data}`,
          },
        })),
      ],
    },
  ],
});

const runModelExtraction = async ({ modelConfig, roomName, roomContext, photos }) => {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${modelConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${modelConfig.apiKey}`,
      },
      body: JSON.stringify(
        buildChatCompletionBody({
          model: modelConfig.model,
          roomName,
          roomContext,
          photos,
        })
      ),
      signal: abortController.signal,
      cache: "no-store",
    });

    const bodyText = await response.text();
    const jsonBody = parseJsonSafely(bodyText, null);

    if (!response.ok) {
      throw createHttpError("The AI extraction provider returned an error.", 502, {
        providerStatus: response.status,
        providerBody: jsonBody || bodyText.slice(0, 600),
      });
    }

    const content = jsonBody?.choices?.[0]?.message?.content;
    const parsedContent = typeof content === "string" ? parseJsonSafely(content, null) : content;

    if (!parsedContent || !isValidInventoryExtractionResponse(parsedContent)) {
      throw createHttpError("The AI response was malformed and could not be validated.", 502, {
        providerBody: jsonBody,
      });
    }

    return {
      providerResponseId: normalizeText(jsonBody?.id),
      parsedContent,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createHttpError("Timed out while waiting for AI extraction.", 504);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const maybeInsertExtractionJob = async ({
  admin,
  userId,
  moveId,
  roomId,
  model,
  photoCount,
  payloadBytes,
}) => {
  const { data, error } = await admin
    .from("inventory_extraction_jobs")
    .insert({
      user_id: userId,
      move_id: moveId,
      room_id: roomId,
      model,
      status: "processing",
      requested_photo_count: photoCount,
      payload_size_bytes: payloadBytes,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("Unable to persist extraction job metadata.", error);
    return null;
  }

  return data?.id || null;
};

const completeExtractionJob = async ({ admin, jobId, status, summary, errorCode }) => {
  if (!jobId) {
    return;
  }

  const { error } = await admin
    .from("inventory_extraction_jobs")
    .update({
      status,
      completed_at: new Date().toISOString(),
      summary_jsonb: summary || null,
      error_code: errorCode || null,
    })
    .eq("id", jobId);

  if (error) {
    console.warn("Unable to update extraction job metadata.", error);
  }
};

export const extractInventoryFromPhotos = async ({ request, payload }) => {
  const admin = getSupabaseAdminClient();
  const user = await resolveAuthenticatedUser({ request, admin });
  const validated = validatePayload(payload);

  const ownership = await verifyMoveAndRoomOwnership({
    admin,
    userId: user.id,
    moveId: validated.moveId,
    roomId: validated.roomId,
  });

  const roomName = validated.roomName || ownership.roomNameFromInventory || "";
  const modelConfig = resolveModelConfig();

  const jobId = await maybeInsertExtractionJob({
    admin,
    userId: user.id,
    moveId: validated.moveId,
    roomId: validated.roomId,
    model: modelConfig.model,
    photoCount: validated.normalizedPhotos.length,
    payloadBytes: validated.totalBytes,
  });

  try {
    const result = await runModelExtraction({
      modelConfig,
      roomName,
      roomContext: validated.roomContext,
      photos: validated.normalizedPhotos,
    });

    const normalized = normalizeInventoryExtractionResponse(result.parsedContent);

    await completeExtractionJob({
      admin,
      jobId,
      status: "succeeded",
      summary: {
        room_name: normalized.room_name,
        item_count: normalized.items.length,
        needs_review_count: normalized.needs_review.length,
        local_photo_ids: validated.normalizedPhotos.map((photo) => photo.localPhotoId),
      },
    });

    return {
      extractionJobId: jobId,
      providerResponseId: result.providerResponseId,
      roomId: validated.roomId,
      moveId: validated.moveId,
      localPhotoIds: validated.normalizedPhotos.map((photo) => photo.localPhotoId),
      result: normalized,
      meta: {
        model: modelConfig.model,
        photoCount: validated.normalizedPhotos.length,
      },
    };
  } catch (error) {
    await completeExtractionJob({
      admin,
      jobId,
      status: "failed",
      errorCode: error?.status ? `http_${error.status}` : "unknown",
      summary: {
        message: normalizeText(error?.message) || "unknown_error",
      },
    });

    throw error;
  }
};
