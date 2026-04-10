import { NextResponse } from "next/server";

import { EXTRACTION_LIMITS } from "@/lib/inventory-extraction-constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 6;
const rateLimitStore = globalThis.__pcsPalExtractionRateLimit || new Map();
if (!globalThis.__pcsPalExtractionRateLimit) {
  globalThis.__pcsPalExtractionRateLimit = rateLimitStore;
}

const CATEGORY_BY_TOKEN = [
  { token: "tv", category: "Electronics" },
  { token: "monitor", category: "Electronics" },
  { token: "book", category: "Books" },
  { token: "chair", category: "Furniture" },
  { token: "table", category: "Furniture" },
  { token: "clothes", category: "Clothing" },
  { token: "shoe", category: "Clothing" },
  { token: "toy", category: "Kids Items" },
  { token: "kitchen", category: "Kitchen" },
  { token: "dish", category: "Kitchen" },
];

const getClientIp = (request) =>
  String(request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown")
    .split(",")[0]
    .trim();

const enforceRateLimit = ({ request, roomId }) => {
  const ip = getClientIp(request);
  const key = `${ip}:${roomId || "no-room"}`;
  const now = Date.now();

  const existing = rateLimitStore.get(key) || [];
  const fresh = existing.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (fresh.length >= MAX_REQUESTS_PER_WINDOW) {
    const error = new Error("Too many extraction attempts. Please wait a minute and retry.");
    error.status = 429;
    throw error;
  }

  fresh.push(now);
  rateLimitStore.set(key, fresh);
};

const cleanName = (value) =>
  String(value || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toLabelFromFileName = (fileName, roomName) => {
  const normalized = cleanName(fileName);
  if (!normalized) {
    return `${roomName || "Room"} item`;
  }

  return normalized
    .split(" ")
    .slice(0, 6)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
};

const inferCategory = (fileName) => {
  const lower = String(fileName || "").toLowerCase();
  const match = CATEGORY_BY_TOKEN.find((entry) => lower.includes(entry.token));
  return match?.category || "Miscellaneous";
};

const validatePayload = (payload) => {
  const roomId = String(payload?.roomId || "").trim();
  const roomName = String(payload?.roomName || "").trim();
  const photos = Array.isArray(payload?.photos) ? payload.photos : [];

  if (!roomId) {
    const error = new Error("Missing room context for extraction.");
    error.status = 400;
    throw error;
  }

  if (!photos.length) {
    const error = new Error("Add at least one prepared photo before extraction.");
    error.status = 400;
    throw error;
  }

  if (photos.length > EXTRACTION_LIMITS.maxPhotosPerRun) {
    const error = new Error(`Run limit exceeded. You can extract up to ${EXTRACTION_LIMITS.maxPhotosPerRun} photos at once.`);
    error.status = 400;
    throw error;
  }

  const normalized = photos.map((photo, index) => {
    const byteSize = Number(photo?.byteSize) || 0;
    if (!byteSize || byteSize > EXTRACTION_LIMITS.maxPreparedBytesPerPhoto) {
      const error = new Error(`Prepared photo ${index + 1} exceeded size limits.`);
      error.status = 400;
      throw error;
    }

    return {
      localPhotoId: String(photo?.localPhotoId || `photo-${index + 1}`),
      fileName: String(photo?.fileName || `photo-${index + 1}.jpg`),
      width: Number(photo?.width) || 0,
      height: Number(photo?.height) || 0,
      byteSize,
    };
  });

  const totalBytes = normalized.reduce((sum, photo) => sum + photo.byteSize, 0);
  if (totalBytes > EXTRACTION_LIMITS.maxPreparedBytesPerRun) {
    const error = new Error("Prepared payload is too large for one extraction run.");
    error.status = 400;
    throw error;
  }

  return {
    roomId,
    roomName,
    photos: normalized,
  };
};

const buildSuggestions = ({ roomName, photos }) => {
  const uniqueLabels = new Set();
  const items = [];

  photos.forEach((photo, index) => {
    const label = toLabelFromFileName(photo.fileName, roomName);
    if (uniqueLabels.has(label.toLowerCase())) {
      return;
    }

    uniqueLabels.add(label.toLowerCase());
    items.push({
      id: photo.localPhotoId || `item-${index + 1}`,
      label,
      category: inferCategory(photo.fileName),
      notes: `Estimated from room photo ${index + 1}. Review before final save.`,
      confidence: 0.45,
    });
  });

  return items.slice(0, EXTRACTION_LIMITS.maxSuggestedItemsPerRun);
};

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Extraction request must be valid JSON." }, { status: 400 });
  }

  try {
    const validated = validatePayload(payload);
    enforceRateLimit({ request, roomId: validated.roomId });

    const items = buildSuggestions(validated);

    return NextResponse.json(
      {
        items,
        meta: {
          runPhotoCount: validated.photos.length,
          generatedItemCount: items.length,
          localOnly: true,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error?.message || "Unable to process extraction.",
      },
      {
        status: error?.status || 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
