const ITEM_CATEGORIES = Object.freeze([
  "moving_box",
  "furniture",
  "appliance",
  "electronics",
  "kitchenware",
  "clothing",
  "decor",
  "tools",
  "books_media",
  "baby_kids",
  "fitness",
  "office",
  "outdoor",
  "pet_supplies",
  "miscellaneous",
]);

const VALUE_BANDS = Object.freeze(["unknown", "low", "medium", "high"]);

export const INVENTORY_EXTRACTION_JSON_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: ["room_name", "summary", "items", "needs_review"],
  properties: {
    room_name: { type: "string" },
    summary: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "category",
          "quantity",
          "estimated_weight_lb",
          "fragile",
          "value_band",
          "confidence",
        ],
        properties: {
          name: { type: "string" },
          category: { type: "string", enum: ITEM_CATEGORIES },
          quantity: { type: "integer", minimum: 1, maximum: 50 },
          estimated_weight_lb: { type: "number", minimum: 0, maximum: 500 },
          fragile: { type: "boolean" },
          high_value: { type: "boolean" },
          value_band: { type: "string", enum: VALUE_BANDS },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          evidence: { type: "string" },
        },
      },
    },
    needs_review: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["issue", "detail"],
        properties: {
          issue: { type: "string" },
          detail: { type: "string" },
          related_item_name: { type: "string" },
        },
      },
    },
  },
});

const normalizeText = (value) => String(value ?? "").trim();

const clamp = (value, { min, max, fallback }) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return fallback;
};

const normalizeCategory = (value) => {
  const normalized = normalizeText(value).toLowerCase();
  return ITEM_CATEGORIES.includes(normalized) ? normalized : "miscellaneous";
};

const normalizeValueBand = (value, highValueFlag) => {
  const normalized = normalizeText(value).toLowerCase();
  if (VALUE_BANDS.includes(normalized)) {
    return normalized;
  }

  return highValueFlag ? "high" : "unknown";
};

const normalizeItem = (item) => {
  const name = normalizeText(item?.name);
  if (!name) {
    return null;
  }

  const highValue = toBoolean(item?.high_value, false);

  return {
    name,
    category: normalizeCategory(item?.category),
    quantity: Math.round(clamp(item?.quantity, { min: 1, max: 50, fallback: 1 })),
    estimated_weight_lb: Number(clamp(item?.estimated_weight_lb, { min: 0, max: 500, fallback: 0 }).toFixed(1)),
    fragile: toBoolean(item?.fragile, false),
    high_value: highValue,
    value_band: normalizeValueBand(item?.value_band, highValue),
    confidence: Number(clamp(item?.confidence, { min: 0, max: 1, fallback: 0.35 }).toFixed(2)),
    evidence: normalizeText(item?.evidence),
  };
};

const normalizeNeedsReviewEntry = (entry) => {
  const issue = normalizeText(entry?.issue);
  const detail = normalizeText(entry?.detail);

  if (!issue || !detail) {
    return null;
  }

  return {
    issue,
    detail,
    related_item_name: normalizeText(entry?.related_item_name),
  };
};

export const normalizeInventoryExtractionResponse = (payload) => ({
  room_name: normalizeText(payload?.room_name),
  summary: normalizeText(payload?.summary),
  items: (Array.isArray(payload?.items) ? payload.items : [])
    .map(normalizeItem)
    .filter(Boolean),
  needs_review: (Array.isArray(payload?.needs_review) ? payload.needs_review : [])
    .map(normalizeNeedsReviewEntry)
    .filter(Boolean),
});

export const isValidInventoryExtractionResponse = (payload) => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  if (!normalizeText(payload.room_name) || !normalizeText(payload.summary)) {
    return false;
  }

  if (!Array.isArray(payload.items) || !Array.isArray(payload.needs_review)) {
    return false;
  }

  return payload.items.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    if (!normalizeText(item.name)) {
      return false;
    }

    if (!ITEM_CATEGORIES.includes(normalizeCategory(item.category))) {
      return false;
    }

    const quantity = Number(item.quantity);
    const weight = Number(item.estimated_weight_lb);
    const confidence = Number(item.confidence);

    return (
      Number.isFinite(quantity) &&
      quantity >= 1 &&
      quantity <= 50 &&
      Number.isFinite(weight) &&
      weight >= 0 &&
      weight <= 500 &&
      Number.isFinite(confidence) &&
      confidence >= 0 &&
      confidence <= 1
    );
  });
};
