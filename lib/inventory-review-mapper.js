import {
  buildNewInventoryItem,
  getCategoryDefinition,
  inferCategoryFromLabel,
} from "@/inventory-data";

export const INVENTORY_REVIEW_DRAFT_STORAGE_KEY = "pcspal-inventory-review-drafts-v1";

const normalizeText = (value) => String(value ?? "").trim();

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return fallback;
};

export const createReviewItemId = () =>
  `review-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const mapExtractedItemToReviewDraft = (rawItem, index = 0) => {
  const label = normalizeText(rawItem?.label || rawItem?.name || rawItem?.item || `Detected item ${index + 1}`);
  const categoryLabel = normalizeText(rawItem?.category || inferCategoryFromLabel(label));
  const category = getCategoryDefinition(categoryLabel).label;
  const quantity = Math.max(1, Number.parseInt(rawItem?.quantity ?? 1, 10) || 1);
  const weightValue = Number(rawItem?.weight ?? rawItem?.estimatedWeight);

  return {
    reviewId: normalizeText(rawItem?.reviewId) || createReviewItemId(),
    label,
    category,
    quantity,
    weight: Number.isFinite(weightValue) && weightValue > 0 ? Math.round(weightValue) : getCategoryDefinition(category).defaultWeight,
    isFragile: parseBoolean(rawItem?.isFragile || rawItem?.fragile),
    isHighValue: parseBoolean(rawItem?.isHighValue || rawItem?.highValue),
    notes: normalizeText(rawItem?.notes),
    deleted: false,
  };
};

export const normalizeReviewDraftPayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const roomId = normalizeText(payload.roomId);
  if (!roomId) {
    return null;
  }

  const extractedItems = Array.isArray(payload.items) ? payload.items : [];
  const items = extractedItems.map((item, index) => mapExtractedItemToReviewDraft(item, index));

  return {
    roomId,
    extractionJobId: normalizeText(payload.extractionJobId),
    source: "ai_photo_extraction",
    localPhotoIds: Array.isArray(payload.localPhotoIds)
      ? payload.localPhotoIds.map((id) => normalizeText(id)).filter(Boolean)
      : [],
    createdAt: normalizeText(payload.createdAt) || new Date().toISOString(),
    status: "pending_review",
    items,
  };
};

export const loadReviewDrafts = (storage) => {
  if (!storage) {
    return {};
  }

  try {
    const parsed = JSON.parse(storage.getItem(INVENTORY_REVIEW_DRAFT_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.warn("Unable to parse extraction review drafts.", error);
    return {};
  }
};

export const saveReviewDrafts = (storage, drafts) => {
  if (!storage) {
    return;
  }

  storage.setItem(INVENTORY_REVIEW_DRAFT_STORAGE_KEY, JSON.stringify(drafts || {}));
};

export const toInventoryItemsFromReviewDraft = (reviewDraft) => {
  const items = Array.isArray(reviewDraft?.items) ? reviewDraft.items : [];

  return items
    .filter((item) => !item.deleted)
    .map((item) => {
      const baseItem = buildNewInventoryItem({
        label: item.label,
        category: item.category,
        notes: item.notes,
      });

      return {
        ...baseItem,
        weight: Number(item.weight) || baseItem.weight,
        quantity: Math.max(1, Number(item.quantity) || 1),
        isFragile: Boolean(item.isFragile),
        isHighValue: Boolean(item.isHighValue),
        source: "ai_photo_extraction",
        sourceContext: {
          extractionJobId: normalizeText(reviewDraft?.extractionJobId),
          roomId: normalizeText(reviewDraft?.roomId),
          localPhotoIds: Array.isArray(reviewDraft?.localPhotoIds)
            ? reviewDraft.localPhotoIds.filter(Boolean)
            : [],
          reviewedAt: new Date().toISOString(),
        },
      };
    });
};
