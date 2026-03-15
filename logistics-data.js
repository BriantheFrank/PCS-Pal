import {
  CHECKLIST_SYNC_MARKERS,
  LOGISTICS_STORAGE_KEY,
  collectChecklistCompatibilitySnapshot,
  saveChecklistCompatibilityBackup,
} from "./checklist-data.js";

export { LOGISTICS_STORAGE_KEY };

const parseJson = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Unable to parse logistics state.", error);
    return fallback;
  }
};

const readJson = (storage, key, fallback) => {
  if (!storage) {
    return fallback;
  }

  return parseJson(storage.getItem(key), fallback);
};

const writeJson = (storage, key, value) => {
  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
};

const normalizeFieldValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
};

const normalizeFieldMap = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, normalizeFieldValue(value)])
  );
};

const normalizeGroupList = (groups) =>
  Array.isArray(groups) ? groups.map((group) => normalizeFieldMap(group)) : [];

export const normalizeLogisticsState = (payload) => {
  if (!payload || typeof payload !== "object") {
    return {
      sections: {},
      itineraryStops: [],
      customEvents: [],
      updatedAt: "",
    };
  }

  const sections =
    payload.sections && typeof payload.sections === "object" && !Array.isArray(payload.sections)
      ? Object.fromEntries(
          Object.entries(payload.sections).map(([sectionId, values]) => [
            sectionId,
            normalizeFieldMap(values),
          ])
        )
      : {};

  return {
    sections,
    itineraryStops: normalizeGroupList(payload.itineraryStops),
    customEvents: normalizeGroupList(payload.customEvents),
    updatedAt: typeof payload.updatedAt === "string" ? payload.updatedAt : "",
  };
};

export const hasLogisticsData = (payload) => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const hasSections =
    payload.sections && typeof payload.sections === "object"
      ? Object.values(payload.sections).some(
          (section) =>
            section &&
            typeof section === "object" &&
            Object.values(section).some((value) => String(value || "").trim() !== "")
        )
      : false;
  const hasStops = Array.isArray(payload.itineraryStops) && payload.itineraryStops.length > 0;
  const hasCustom = Array.isArray(payload.customEvents) && payload.customEvents.length > 0;

  return hasSections || hasStops || hasCustom;
};

export const loadLogisticsState = (storage) =>
  normalizeLogisticsState(readJson(storage, LOGISTICS_STORAGE_KEY, null));

export const saveLogisticsState = (storage, logisticsState) => {
  const normalized = normalizeLogisticsState(logisticsState);
  writeJson(storage, LOGISTICS_STORAGE_KEY, {
    ...normalized,
    updatedAt: normalized.updatedAt || new Date().toISOString(),
  });
};

export const fetchRemoteLogistics = async ({ supabase, userId }) => {
  const { data, error } = await supabase
    .from("user_move_logistics")
    .select("payload")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeLogisticsState(data?.payload || null);
};

export const pushLogistics = async ({ supabase, userId, logisticsState }) => {
  const payload = {
    ...normalizeLogisticsState(logisticsState),
    updatedAt:
      typeof logisticsState?.updatedAt === "string" && logisticsState.updatedAt
        ? logisticsState.updatedAt
        : new Date().toISOString(),
  };

  const { error } = await supabase.from("user_move_logistics").upsert(
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

const getLogisticsInitialSyncKey = (userId) =>
  `${CHECKLIST_SYNC_MARKERS.initialSyncPrefix}${userId}`;

export const reconcileLogisticsWithRemote = async ({ supabase, storage, userId }) => {
  const localLogistics = readJson(storage, LOGISTICS_STORAGE_KEY, null);
  const remoteLogistics = await fetchRemoteLogistics({ supabase, userId });
  const localHas = hasLogisticsData(localLogistics);
  const remoteHas = hasLogisticsData(remoteLogistics);

  let source = "local";
  let logisticsState = normalizeLogisticsState(localLogistics);
  let backedUpLocal = false;

  if (!remoteHas && localHas) {
    await pushLogistics({
      supabase,
      userId,
      logisticsState: localLogistics,
    });
    source = "local-pushed";
  } else if (remoteHas) {
    if (JSON.stringify(localLogistics) !== JSON.stringify(remoteLogistics)) {
      if (localHas) {
        saveChecklistCompatibilityBackup({
          storage,
          userId,
          snapshot: collectChecklistCompatibilitySnapshot(storage),
        });
        backedUpLocal = true;
      }

      saveLogisticsState(storage, remoteLogistics);
    }

    logisticsState = normalizeLogisticsState(remoteLogistics);
    source = "remote";
  }

  if (storage) {
    storage.setItem(getLogisticsInitialSyncKey(userId), "1");
  }

  return {
    backedUpLocal,
    logisticsState,
    source,
  };
};
