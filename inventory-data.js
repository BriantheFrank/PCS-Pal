import {
  CHECKLIST_SYNC_MARKERS,
  INVENTORY_STORAGE_KEY,
  collectChecklistCompatibilitySnapshot,
  saveChecklistCompatibilityBackup,
} from "./checklist-data.js";

export { INVENTORY_STORAGE_KEY };

export const CATEGORY_DEFINITIONS = Object.freeze([
  { label: "Moving Box", defaultWeight: 40 },
  { label: "Couch / Sofa", defaultWeight: 250 },
  { label: "Chair", defaultWeight: 40 },
  { label: "Bed", defaultWeight: 175 },
  { label: "Dresser", defaultWeight: 150 },
  { label: "Table", defaultWeight: 200 },
  { label: "Appliance", defaultWeight: 300 },
  { label: "Miscellaneous", defaultWeight: 40 },
]);

const EMPTY_INVENTORY = Object.freeze({
  rooms: [],
  totalWeight: 0,
});

const parseJson = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Unable to parse inventory state.", error);
    return fallback;
  }
};

const readJson = (storage, key, fallback) => {
  if (!storage) {
    return fallback;
  }

  return parseJson(storage.getItem(key), fallback);
};

const normalizeText = (value) => String(value ?? "").trim();

const createInventoryRoomId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `room-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getCategoryDefinition = (categoryLabel) =>
  CATEGORY_DEFINITIONS.find((category) => category.label === categoryLabel) ||
  CATEGORY_DEFINITIONS[CATEGORY_DEFINITIONS.length - 1];

export const inferCategoryFromLabel = (label) => {
  const normalizedLabel = normalizeText(label).toLowerCase();
  if (normalizedLabel.includes("box")) {
    return "Moving Box";
  }
  if (normalizedLabel.includes("sofa") || normalizedLabel.includes("couch")) {
    return "Couch / Sofa";
  }
  if (normalizedLabel.includes("bed")) {
    return "Bed";
  }
  if (normalizedLabel.includes("dresser")) {
    return "Dresser";
  }
  if (normalizedLabel.includes("table")) {
    return "Table";
  }
  if (
    normalizedLabel.includes("fridge") ||
    normalizedLabel.includes("refrigerator") ||
    normalizedLabel.includes("appliance")
  ) {
    return "Appliance";
  }
  if (normalizedLabel.includes("chair")) {
    return "Chair";
  }
  return "Miscellaneous";
};

export const coerceWeight = (weight, fallbackWeight) => {
  const numericWeight = Number(weight);
  if (Number.isFinite(numericWeight) && numericWeight > 0) {
    return numericWeight;
  }
  return fallbackWeight;
};

export const sanitizeInventoryLabelSize = (value, fallback, min, max) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(numericValue)));
};

export const buildInventoryLabelSettingsSnapshot = (room, item) => {
  const defaults = {
    title: normalizeText(item?.label),
    room: normalizeText(room?.name),
    weight: `${coerceWeight(item?.weight, 0)} lbs`,
    notes: normalizeText(item?.notes),
    titleSize: 26,
    bodySize: 18,
  };
  const savedSettings = item?.labelSettings || {};

  return {
    title:
      typeof savedSettings.title === "string" ? savedSettings.title : defaults.title,
    room:
      typeof savedSettings.room === "string" ? savedSettings.room : defaults.room,
    weight:
      typeof savedSettings.weight === "string" ? savedSettings.weight : defaults.weight,
    notes:
      typeof savedSettings.notes === "string" ? savedSettings.notes : defaults.notes,
    titleSize: sanitizeInventoryLabelSize(savedSettings.titleSize, defaults.titleSize, 18, 36),
    bodySize: sanitizeInventoryLabelSize(savedSettings.bodySize, defaults.bodySize, 14, 28),
  };
};

const normalizeInventoryItem = (item, roomName) => {
  const label = normalizeText(item?.label);
  const category = item?.category
    ? getCategoryDefinition(item.category).label
    : inferCategoryFromLabel(label);
  const normalizedItem = {
    label,
    category,
    notes: typeof item?.notes === "string" ? item.notes : "",
    weight: coerceWeight(item?.weight, getCategoryDefinition(category).defaultWeight),
    includeInEstimate:
      typeof item?.includeInEstimate === "boolean" ? item.includeInEstimate : true,
    quantity: Math.max(1, Number.parseInt(item?.quantity ?? 1, 10) || 1),
    isFragile: typeof item?.isFragile === "boolean" ? item.isFragile : false,
    isHighValue: typeof item?.isHighValue === "boolean" ? item.isHighValue : false,
  };

  if (item?.labelSettings && typeof item.labelSettings === "object") {
    normalizedItem.labelSettings = buildInventoryLabelSettingsSnapshot(
      { name: roomName },
      { ...normalizedItem, labelSettings: item.labelSettings }
    );
  }

  if (typeof item?.editMode === "string" && item.editMode) {
    normalizedItem.editMode = item.editMode;
  }

  if (typeof item?.source === "string" && item.source.trim()) {
    normalizedItem.source = item.source.trim();
  }

  if (item?.sourceContext && typeof item.sourceContext === "object") {
    normalizedItem.sourceContext = {
      extractionJobId: normalizeText(item.sourceContext.extractionJobId),
      roomId: normalizeText(item.sourceContext.roomId),
      localPhotoIds: Array.isArray(item.sourceContext.localPhotoIds)
        ? item.sourceContext.localPhotoIds.map((value) => normalizeText(value)).filter(Boolean)
        : [],
      reviewedAt: normalizeText(item.sourceContext.reviewedAt),
    };
  }

  return normalizedItem;
};

const normalizeInventoryRoom = (room) => {
  const name = normalizeText(room?.name);
  const items = Array.isArray(room?.items)
    ? room.items.map((item) => normalizeInventoryItem(item, name))
    : [];
  const roomWeight = Math.round(
    items.reduce(
      (total, item) => total + (item.includeInEstimate ? item.weight : 0),
      0
    )
  );

  const normalizedRoom = {
    id: normalizeText(room?.id) || createInventoryRoomId(),
    name,
    items,
    roomWeight,
  };

  if (typeof room?.editMode === "string" && room.editMode) {
    normalizedRoom.editMode = room.editMode;
  }

  return normalizedRoom;
};

export const normalizeInventoryState = (payload) => {
  const rooms = Array.isArray(payload?.rooms)
    ? payload.rooms.map((room) => normalizeInventoryRoom(room))
    : [];
  const totalWeight = Math.round(
    rooms.reduce((total, room) => total + room.roomWeight, 0)
  );

  return {
    rooms,
    totalWeight,
  };
};

export const serializeInventoryState = (inventoryState) =>
  JSON.stringify(normalizeInventoryState(inventoryState), (key, value) =>
    key === "editMode" ? undefined : value
  );

export const loadInventoryState = (storage) =>
  normalizeInventoryState(readJson(storage, INVENTORY_STORAGE_KEY, EMPTY_INVENTORY));

export const saveInventoryState = (storage, inventoryState) => {
  if (!storage) {
    return;
  }

  storage.setItem(INVENTORY_STORAGE_KEY, serializeInventoryState(inventoryState));
};

export const hasInventoryData = (payload) =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray(payload.rooms) &&
  payload.rooms.length > 0;

export const buildNewInventoryRoom = ({ name }) => ({
  id: createInventoryRoomId(),
  name: normalizeText(name),
  items: [],
});

export const buildNewInventoryItem = ({ label, category, notes }) => {
  const normalizedLabel = normalizeText(label);
  const nextCategory = getCategoryDefinition(category || inferCategoryFromLabel(normalizedLabel));

  return {
    label: normalizedLabel,
    category: nextCategory.label,
    notes: normalizeText(notes),
    weight: nextCategory.defaultWeight,
    includeInEstimate: true,
    quantity: 1,
    isFragile: false,
    isHighValue: false,
  };
};

export const fetchRemoteInventory = async ({ supabase, userId }) => {
  const { data, error } = await supabase
    .from("user_inventory")
    .select("payload")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.payload || null;
};

export const pushInventory = async ({ supabase, userId, inventoryState }) => {
  const payload = JSON.parse(serializeInventoryState(inventoryState));
  const { error } = await supabase.from("user_inventory").upsert(
    {
      user_id: userId,
      payload,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw error;
  }

  return payload;
};

const getInventoryInitialSyncKey = (userId) =>
  `${CHECKLIST_SYNC_MARKERS.initialSyncPrefix}${userId}`;

export const reconcileInventoryWithRemote = async ({ supabase, storage, userId }) => {
  const localInventory = readJson(storage, INVENTORY_STORAGE_KEY, EMPTY_INVENTORY);
  const remoteInventory = await fetchRemoteInventory({ supabase, userId });
  const localHas = hasInventoryData(localInventory);
  const remoteHas = hasInventoryData(remoteInventory);

  let source = "local";
  let inventoryState = normalizeInventoryState(localInventory);
  let backedUpLocal = false;

  if (!remoteHas && localHas) {
    await pushInventory({
      supabase,
      userId,
      inventoryState: localInventory,
    });
    source = "local-pushed";
  } else if (remoteHas) {
    if (JSON.stringify(localInventory) !== JSON.stringify(remoteInventory)) {
      if (localHas) {
        saveChecklistCompatibilityBackup({
          storage,
          userId,
          snapshot: collectChecklistCompatibilitySnapshot(storage),
        });
        backedUpLocal = true;
      }

      saveInventoryState(storage, remoteInventory);
    }

    inventoryState = normalizeInventoryState(remoteInventory);
    source = "remote";
  }

  if (storage) {
    storage.setItem(getInventoryInitialSyncKey(userId), "1");
  }

  return {
    backedUpLocal,
    inventoryState,
    source,
  };
};
