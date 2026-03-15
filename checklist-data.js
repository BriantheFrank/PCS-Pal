export const CHECKLIST_STORAGE_KEY = "pcs-checklist";
export const INVENTORY_STORAGE_KEY = "pcs-move-inventory";
export const LOGISTICS_STORAGE_KEY = "pcs-move-logistics";

export const CHECKLIST_SYNC_MARKERS = Object.freeze({
  initialSyncPrefix: "pcs-sync-initialized:",
  backupPrefix: "pcs-sync-backup:",
});

const parseJson = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Unable to parse checklist state.", error);
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

export const hasChecklistData = (payload) =>
  Boolean(payload) && typeof payload === "object" && Object.keys(payload).length > 0;

export const loadChecklistState = (storage) => readJson(storage, CHECKLIST_STORAGE_KEY, {});

export const saveChecklistState = (storage, checklistState) => {
  writeJson(storage, CHECKLIST_STORAGE_KEY, checklistState || {});
};

export const serializeChecklistRows = (checklistState) =>
  Object.entries(checklistState || {}).map(([checklistKey, checked]) => ({
    checklist_key: checklistKey,
    checked: Boolean(checked),
  }));

export const fetchRemoteChecklist = async ({ supabase, userId }) => {
  const { data, error } = await supabase
    .from("user_checklist_state")
    .select("checklist_key, checked")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const payload = {};
  (data || []).forEach((row) => {
    payload[row.checklist_key] = Boolean(row.checked);
  });

  return payload;
};

export const pushChecklist = async ({ supabase, userId, checklistState }) => {
  const rows = serializeChecklistRows(checklistState);

  if (rows.length === 0) {
    const { error } = await supabase.from("user_checklist_state").delete().eq("user_id", userId);
    if (error) {
      throw error;
    }
    return;
  }

  const payload = rows.map((row) => ({ ...row, user_id: userId }));
  const { error } = await supabase
    .from("user_checklist_state")
    .upsert(payload, { onConflict: "user_id,checklist_key" });

  if (error) {
    throw error;
  }
};

export const getChecklistInitialSyncKey = (userId) =>
  `${CHECKLIST_SYNC_MARKERS.initialSyncPrefix}${userId}`;

export const getChecklistBackupKey = (userId) =>
  `${CHECKLIST_SYNC_MARKERS.backupPrefix}${userId}`;

export const collectChecklistCompatibilitySnapshot = (storage) => ({
  checklist: loadChecklistState(storage),
  inventory: readJson(storage, INVENTORY_STORAGE_KEY, { rooms: [] }),
  logistics: readJson(storage, LOGISTICS_STORAGE_KEY, null),
});

export const saveChecklistCompatibilityBackup = ({ storage, userId, snapshot }) => {
  writeJson(storage, getChecklistBackupKey(userId), {
    createdAt: new Date().toISOString(),
    snapshot,
  });
};

export const reconcileChecklistWithRemote = async ({ supabase, storage, userId }) => {
  const localChecklist = loadChecklistState(storage);
  const remoteChecklist = await fetchRemoteChecklist({ supabase, userId });
  const localHas = hasChecklistData(localChecklist);
  const remoteHas = hasChecklistData(remoteChecklist);

  let source = "local";
  let checklistState = localChecklist;
  let backedUpLocal = false;

  if (!remoteHas && localHas) {
    await pushChecklist({ supabase, userId, checklistState: localChecklist });
    source = "local-pushed";
  } else if (remoteHas) {
    if (JSON.stringify(localChecklist) !== JSON.stringify(remoteChecklist)) {
      if (localHas) {
        saveChecklistCompatibilityBackup({
          storage,
          userId,
          snapshot: collectChecklistCompatibilitySnapshot(storage),
        });
        backedUpLocal = true;
      }

      saveChecklistState(storage, remoteChecklist);
    }

    checklistState = remoteChecklist;
    source = "remote";
  }

  if (storage) {
    storage.setItem(getChecklistInitialSyncKey(userId), "1");
  }

  return {
    backedUpLocal,
    checklistState,
    source,
  };
};
