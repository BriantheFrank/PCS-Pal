const SUPABASE_BROWSER_CDN =
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const EMAIL_ONLY_AUTH = true;

const STORAGE_KEYS = {
  checklist: "pcs-checklist",
  inventory: "pcs-move-inventory",
  logistics: "pcs-move-logistics",
};

const SYNC_MARKERS = {
  initialSyncPrefix: "pcs-sync-initialized:",
  backupPrefix: "pcs-sync-backup:",
  reloadFlag: "pcs-sync-needs-reload-once",
};

const state = {
  supabase: null,
  session: null,
  user: null,
  pendingKeys: new Set(),
  syncTimer: null,
  storagePatched: false,
  suppressSync: false,
  handlingSession: false,
  logisticsHydrating: false,
  logisticsPersistenceBound: false,
  authEls: null,
};

const hasWindow = typeof window !== "undefined";

const parseJson = (value, fallback) => {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Unable to parse JSON value.", error);
    return fallback;
  }
};

const readStorage = (key, fallback = null) => {
  if (!hasWindow || !window.localStorage) {
    return fallback;
  }
  return parseJson(window.localStorage.getItem(key), fallback);
};

const writeStorage = (key, value) => {
  if (!hasWindow || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
};

const hasChecklistData = (payload) =>
  Boolean(payload) && typeof payload === "object" && Object.keys(payload).length > 0;

const hasInventoryData = (payload) =>
  Boolean(payload) &&
  typeof payload === "object" &&
  Array.isArray(payload.rooms) &&
  payload.rooms.length > 0;

const hasLogisticsData = (payload) => {
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

const hasDataForKey = (storageKey, payload) => {
  switch (storageKey) {
    case STORAGE_KEYS.checklist:
      return hasChecklistData(payload);
    case STORAGE_KEYS.inventory:
      return hasInventoryData(payload);
    case STORAGE_KEYS.logistics:
      return hasLogisticsData(payload);
    default:
      return false;
  }
};

const setStatus = (message, tone = "neutral") => {
  if (!state.authEls?.status) {
    return;
  }
  state.authEls.status.textContent = message;
  state.authEls.status.dataset.tone = tone;
};

const triggerFieldEvents = (field) => {
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
};

const collectSectionValues = (section) => {
  const values = {};
  const fields = Array.from(
    section.querySelectorAll("input[data-role], textarea[data-role], select[data-role]")
  );
  fields.forEach((field) => {
    if (field.closest(".itinerary-stop") || field.closest(".custom-event")) {
      return;
    }
    const role = field.dataset.role;
    if (!role) {
      return;
    }
    values[role] = field.value;
  });
  return values;
};

const collectGroupedValues = (elements) =>
  elements.map((element) => {
    const values = {};
    const fields = Array.from(
      element.querySelectorAll("input[data-role], textarea[data-role], select[data-role]")
    );
    fields.forEach((field) => {
      const role = field.dataset.role;
      if (!role) {
        return;
      }
      values[role] = field.value;
    });
    return values;
  });

const captureLogisticsState = () => {
  const sections = {};
  const sectionNodes = Array.from(
    document.querySelectorAll(".logistics-section[data-event-id]")
  );
  sectionNodes.forEach((section) => {
    const eventId = section.dataset.eventId;
    if (!eventId) {
      return;
    }
    sections[eventId] = collectSectionValues(section);
  });

  const itineraryStops = collectGroupedValues(
    Array.from(document.querySelectorAll("#itinerary-stops .itinerary-stop"))
  );
  const customEvents = collectGroupedValues(
    Array.from(document.querySelectorAll("#custom-events .custom-event"))
  );

  return {
    sections,
    itineraryStops,
    customEvents,
    updatedAt: new Date().toISOString(),
  };
};

const applyValuesToSection = (section, values) => {
  Object.entries(values || {}).forEach(([role, value]) => {
    const field = section.querySelector(`[data-role='${role}']`);
    if (!field) {
      return;
    }
    field.value = value || "";
    triggerFieldEvents(field);
  });
};

const syncGroupCount = (containerSelector, itemSelector, targetCount, addSelector, removeSelector) => {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return;
  }

  const addButton = document.querySelector(addSelector);
  if (!addButton) {
    return;
  }

  let existing = Array.from(container.querySelectorAll(itemSelector));
  while (existing.length < targetCount) {
    addButton.click();
    existing = Array.from(container.querySelectorAll(itemSelector));
  }

  while (existing.length > targetCount) {
    const last = existing[existing.length - 1];
    const removeButton = last.querySelector(removeSelector);
    if (!removeButton) {
      break;
    }
    removeButton.click();
    existing = Array.from(container.querySelectorAll(itemSelector));
  }
};

const applyGroupedValues = (containerSelector, itemSelector, groups) => {
  const items = Array.from(document.querySelectorAll(`${containerSelector} ${itemSelector}`));
  groups.forEach((values, index) => {
    const item = items[index];
    if (!item) {
      return;
    }
    Object.entries(values || {}).forEach(([role, value]) => {
      const field = item.querySelector(`[data-role='${role}']`);
      if (!field) {
        return;
      }
      field.value = value || "";
      triggerFieldEvents(field);
    });
  });
};

const saveLogisticsState = () => {
  if (state.logisticsHydrating) {
    return;
  }
  if (!document.querySelector(".logistics-layout")) {
    return;
  }
  writeStorage(STORAGE_KEYS.logistics, captureLogisticsState());
};

const setupLogisticsLocalPersistence = () => {
  if (!document.querySelector(".logistics-layout")) {
    return;
  }

  const localState = readStorage(STORAGE_KEYS.logistics, null);
  if (localState) {
    state.logisticsHydrating = true;

    const sections = Array.from(document.querySelectorAll(".logistics-section[data-event-id]"));
    sections.forEach((section) => {
      const eventId = section.dataset.eventId;
      if (!eventId) {
        return;
      }
      applyValuesToSection(section, localState.sections?.[eventId] || {});
    });

    const itineraryStops = Array.isArray(localState.itineraryStops)
      ? localState.itineraryStops
      : [];
    const customEvents = Array.isArray(localState.customEvents)
      ? localState.customEvents
      : [];

    syncGroupCount(
      "#itinerary-stops",
      ".itinerary-stop",
      itineraryStops.length,
      "#add-itinerary-stop",
      "[data-action='remove-stop']"
    );
    syncGroupCount(
      "#custom-events",
      ".custom-event",
      customEvents.length,
      "#add-custom-event",
      "[data-action='remove-custom']"
    );

    applyGroupedValues("#itinerary-stops", ".itinerary-stop", itineraryStops);
    applyGroupedValues("#custom-events", ".custom-event", customEvents);

    state.logisticsHydrating = false;
  }

  if (state.logisticsPersistenceBound) {
    return;
  }
  state.logisticsPersistenceBound = true;

  const scheduleSave = () => {
    window.setTimeout(saveLogisticsState, 0);
  };

  document.addEventListener("input", (event) => {
    if (event.target.closest(".logistics-layout")) {
      saveLogisticsState();
    }
  });
  document.addEventListener("change", (event) => {
    if (event.target.closest(".logistics-layout")) {
      saveLogisticsState();
    }
  });
  document.addEventListener("click", (event) => {
    if (
      event.target.closest("#add-itinerary-stop") ||
      event.target.closest("#add-custom-event") ||
      event.target.closest("[data-action='remove-stop']") ||
      event.target.closest("[data-action='remove-custom']")
    ) {
      scheduleSave();
    }
  });

  saveLogisticsState();
};

const getReloadGuardKey = (userId) => `${SYNC_MARKERS.reloadFlag}:${userId}`;
const getInitialSyncKey = (userId) => `${SYNC_MARKERS.initialSyncPrefix}${userId}`;
const getBackupKey = (userId) => `${SYNC_MARKERS.backupPrefix}${userId}`;

const saveLocalBackup = (userId, snapshot) => {
  const backupKey = getBackupKey(userId);
  const payload = {
    createdAt: new Date().toISOString(),
    snapshot,
  };
  writeStorage(backupKey, payload);
};

const collectLocalSnapshot = () => ({
  checklist: readStorage(STORAGE_KEYS.checklist, {}),
  inventory: readStorage(STORAGE_KEYS.inventory, { rooms: [] }),
  logistics: readStorage(STORAGE_KEYS.logistics, null),
});

const withSyncSuppressed = async (work) => {
  state.suppressSync = true;
  try {
    await work();
  } finally {
    state.suppressSync = false;
  }
};

const serializeChecklistRows = (checklistState) =>
  Object.entries(checklistState || {}).map(([checklistKey, checked]) => ({
    checklist_key: checklistKey,
    checked: Boolean(checked),
  }));

const fetchRemoteChecklist = async (userId) => {
  const { data, error } = await state.supabase
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

const fetchRemotePayloadRow = async (tableName, userId) => {
  const { data, error } = await state.supabase
    .from(tableName)
    .select("payload")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.payload || null;
};

const pushChecklist = async (userId) => {
  const checklistState = readStorage(STORAGE_KEYS.checklist, {});
  const rows = serializeChecklistRows(checklistState);

  if (rows.length === 0) {
    await state.supabase.from("user_checklist_state").delete().eq("user_id", userId);
    return;
  }

  const payload = rows.map((row) => ({ ...row, user_id: userId }));
  const { error } = await state.supabase
    .from("user_checklist_state")
    .upsert(payload, { onConflict: "user_id,checklist_key" });
  if (error) {
    throw error;
  }
};

const pushPayload = async (tableName, storageKey, userId) => {
  const payload = readStorage(storageKey, null);
  if (!payload) {
    return;
  }

  const { error } = await state.supabase.from(tableName).upsert(
    {
      user_id: userId,
      payload,
    },
    { onConflict: "user_id" }
  );
  if (error) {
    throw error;
  }
};

const pushStorageKeyToRemote = async (storageKey, userId) => {
  if (storageKey === STORAGE_KEYS.checklist) {
    await pushChecklist(userId);
    return;
  }
  if (storageKey === STORAGE_KEYS.inventory) {
    await pushPayload("user_inventory", STORAGE_KEYS.inventory, userId);
    return;
  }
  if (storageKey === STORAGE_KEYS.logistics) {
    await pushPayload("user_move_logistics", STORAGE_KEYS.logistics, userId);
  }
};

const patchLocalStorageForSync = () => {
  if (state.storagePatched || !window.localStorage) {
    return;
  }

  const trackedKeys = new Set(Object.values(STORAGE_KEYS));
  const storageProto = Object.getPrototypeOf(window.localStorage);
  const originalSetItem = storageProto?.setItem;
  const originalRemoveItem = storageProto?.removeItem;

  if (typeof originalSetItem !== "function" || typeof originalRemoveItem !== "function") {
    return;
  }

  state.storagePatched = true;

  storageProto.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (!state.suppressSync && this === window.localStorage && trackedKeys.has(key)) {
      scheduleRemoteSync(key);
    }
  };

  storageProto.removeItem = function (key) {
    originalRemoveItem.call(this, key);
    if (!state.suppressSync && this === window.localStorage && trackedKeys.has(key)) {
      scheduleRemoteSync(key);
    }
  };
};

const flushPendingSync = async () => {
  if (!state.user || !state.supabase || state.pendingKeys.size === 0) {
    return;
  }

  const pending = Array.from(state.pendingKeys);
  state.pendingKeys.clear();

  for (const key of pending) {
    try {
      await pushStorageKeyToRemote(key, state.user.id);
    } catch (error) {
      console.error(`Failed to sync ${key} to Supabase.`, error);
      setStatus("Sync failed. Working locally until retry.", "error");
    }
  }
};

const scheduleRemoteSync = (key) => {
  state.pendingKeys.add(key);
  if (state.syncTimer) {
    window.clearTimeout(state.syncTimer);
  }
  state.syncTimer = window.setTimeout(flushPendingSync, 600);
};

const maybeReloadForHydration = (userId) => {
  const reloadKey = getReloadGuardKey(userId);
  if (window.sessionStorage.getItem(reloadKey) === "1") {
    return;
  }
  window.sessionStorage.setItem(reloadKey, "1");
  window.location.reload();
};

const upsertProfile = async (user) => {
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null;
  const { error } = await state.supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email || null,
      full_name: fullName,
    },
    { onConflict: "id" }
  );
  if (error) {
    throw error;
  }
};

const reconcileLocalAndRemote = async (user) => {
  const userId = user.id;

  const [remoteChecklist, remoteInventory, remoteLogistics] = await Promise.all([
    fetchRemoteChecklist(userId),
    fetchRemotePayloadRow("user_inventory", userId),
    fetchRemotePayloadRow("user_move_logistics", userId),
  ]);

  const local = collectLocalSnapshot();
  const remote = {
    checklist: remoteChecklist,
    inventory: remoteInventory,
    logistics: remoteLogistics,
  };

  const initialSyncKey = getInitialSyncKey(userId);
  const hasInitialSync = window.localStorage.getItem(initialSyncKey) === "1";
  let shouldReload = false;
  let backupNeeded = false;

  const decisions = [
    {
      storageKey: STORAGE_KEYS.checklist,
      localPayload: local.checklist,
      remotePayload: remote.checklist,
    },
    {
      storageKey: STORAGE_KEYS.inventory,
      localPayload: local.inventory,
      remotePayload: remote.inventory,
    },
    {
      storageKey: STORAGE_KEYS.logistics,
      localPayload: local.logistics,
      remotePayload: remote.logistics,
    },
  ];

  for (const decision of decisions) {
    const { storageKey, localPayload, remotePayload } = decision;
    const localHas = hasDataForKey(storageKey, localPayload);
    const remoteHas = hasDataForKey(storageKey, remotePayload);

    if (!remoteHas && localHas) {
      await pushStorageKeyToRemote(storageKey, userId);
      continue;
    }

    if (!remoteHas) {
      continue;
    }

    const samePayload = JSON.stringify(localPayload) === JSON.stringify(remotePayload);
    if (samePayload) {
      continue;
    }

    if (localHas) {
      backupNeeded = true;
    }

    await withSyncSuppressed(async () => {
      writeStorage(storageKey, remotePayload);
    });

    if (storageKey === STORAGE_KEYS.logistics) {
      setupLogisticsLocalPersistence();
    } else {
      shouldReload = true;
    }
  }

  if (!hasInitialSync) {
    window.localStorage.setItem(initialSyncKey, "1");
  }

  if (backupNeeded) {
    saveLocalBackup(userId, local);
  }

  if (shouldReload) {
    maybeReloadForHydration(userId);
  }
};

const buildAuthUI = () => {
  if (state.authEls) {
    return state.authEls;
  }

  const topBar = document.querySelector(".top-bar");
  if (!topBar) {
    return null;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "auth-panel";
  wrapper.innerHTML = `
    <details class="auth-details">
      <summary class="auth-summary">Account</summary>
      <div class="auth-card">
        <p class="auth-status" aria-live="polite"></p>
        <form class="auth-form" data-auth-form="signin">
          <label>
            Email
            <input type="email" name="email" autocomplete="email" required />
          </label>
          <label>
            Password
            <input type="password" name="password" autocomplete="current-password" required />
          </label>
          <button type="submit">Sign in</button>
        </form>
        <form class="auth-form" data-auth-form="signup">
          <label>
            Email
            <input type="email" name="email" autocomplete="email" required />
          </label>
          <label>
            Password
            <input type="password" name="password" autocomplete="new-password" minlength="8" required />
          </label>
          <button type="submit">Create account</button>
        </form>
        <button type="button" class="auth-google-button">Continue with Google</button>
        <button type="button" class="auth-signout-button" hidden>Sign out</button>
      </div>
    </details>
  `;

  topBar.appendChild(wrapper);

  const signinForm = wrapper.querySelector("[data-auth-form='signin']");
  const signupForm = wrapper.querySelector("[data-auth-form='signup']");
  const googleButton = wrapper.querySelector(".auth-google-button");
  const signoutButton = wrapper.querySelector(".auth-signout-button");
  const status = wrapper.querySelector(".auth-status");
  const details = wrapper.querySelector(".auth-details");

  state.authEls = {
    wrapper,
    signinForm,
    signupForm,
    googleButton,
    signoutButton,
    status,
    details,
  };

  return state.authEls;
};

const updateAuthUI = () => {
  const authEls = state.authEls;
  if (!authEls) {
    return;
  }

  const isSignedIn = Boolean(state.user);
  authEls.signinForm.hidden = isSignedIn;
  authEls.signupForm.hidden = isSignedIn;
  authEls.googleButton.hidden = EMAIL_ONLY_AUTH ? true : isSignedIn;
  authEls.signoutButton.hidden = !isSignedIn;

  if (isSignedIn) {
    setStatus(`Signed in as ${state.user.email || "account user"}.`, "success");
  } else {
    setStatus("Sign in to sync your checklist and inventory across devices.", "neutral");
  }
};

const parseAuthErrorFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const message = params.get("error_description") || hashParams.get("error_description");
  if (!message) {
    return "";
  }
  return decodeURIComponent(message.replace(/\+/g, " "));
};

const initializeAuthEvents = () => {
  const authEls = state.authEls;
  if (!authEls) {
    return;
  }

  authEls.signinForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.supabase) {
      return;
    }

    const formData = new FormData(authEls.signinForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    setStatus("Signing in...", "neutral");
    const { error } = await state.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message, "error");
      return;
    }

    authEls.signinForm.reset();
    if (authEls.details) {
      authEls.details.open = false;
    }
  });

  authEls.signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.supabase) {
      return;
    }

    const formData = new FormData(authEls.signupForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    setStatus("Creating account...", "neutral");
    const { error } = await state.supabase.auth.signUp({ email, password });
    if (error) {
      setStatus(error.message, "error");
      return;
    }

    setStatus("Account created. Check your email to confirm, then sign in.", "success");
    authEls.signupForm.reset();
  });

  if (!EMAIL_ONLY_AUTH) {
    authEls.googleButton.addEventListener("click", async () => {
      if (!state.supabase) {
        return;
      }

      setStatus("Redirecting to Google...", "neutral");
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const { error } = await state.supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        setStatus(error.message, "error");
      }
    });
  }

  authEls.signoutButton.addEventListener("click", async () => {
    if (!state.supabase) {
      return;
    }

    const { error } = await state.supabase.auth.signOut();
    if (error) {
      setStatus(error.message, "error");
      return;
    }

    setStatus("Signed out. Local mode remains available.", "neutral");
  });
};

const initSupabaseClient = async () => {
  const configResponse = await fetch("/api/public-config", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!configResponse.ok) {
    throw new Error("Cloud configuration is unavailable.");
  }

  const config = await configResponse.json();
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("Supabase URL or anon key is missing.");
  }

  const { createClient } = await import(SUPABASE_BROWSER_CDN);
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

const handleSession = async (session) => {
  state.session = session;
  state.user = session?.user || null;
  updateAuthUI();

  if (!state.user || !state.supabase) {
    return;
  }

  if (state.handlingSession) {
    return;
  }

  state.handlingSession = true;
  try {
    await upsertProfile(state.user);
    await reconcileLocalAndRemote(state.user);
    await flushPendingSync();
    setStatus(`Signed in as ${state.user.email || "account user"}.`, "success");
  } catch (error) {
    console.error("Failed during session setup.", error);
    setStatus("Sign-in succeeded, but cloud sync setup failed.", "error");
  } finally {
    state.handlingSession = false;
  }
};

const initialize = async () => {
  buildAuthUI();
  setupLogisticsLocalPersistence();

  const authError = parseAuthErrorFromUrl();
  if (authError) {
    setStatus(authError, "error");
  }

  try {
    state.supabase = await initSupabaseClient();
  } catch (error) {
    console.warn("Supabase client not available.", error);
    setStatus("Cloud sign-in is unavailable right now. Local mode is still active.", "error");
    return;
  }

  patchLocalStorageForSync();
  initializeAuthEvents();

  const {
    data: { session },
  } = await state.supabase.auth.getSession();
  await handleSession(session);

  state.supabase.auth.onAuthStateChange(async (_event, nextSession) => {
    await handleSession(nextSession);
  });
};

if (hasWindow) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initialize().catch((error) => {
        console.error("Auth module failed to initialize.", error);
      });
    });
  } else {
    initialize().catch((error) => {
      console.error("Auth module failed to initialize.", error);
    });
  }
}
