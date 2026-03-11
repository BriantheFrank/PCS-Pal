import {
  BASE_OPTIONS,
  HOUSEHOLD_SIZE_OPTIONS,
  HOUSING_INTENT_OPTIONS,
  MOVE_STAGE_OPTIONS,
  ORIGIN_REGION_OPTIONS,
  buildOptionsMarkup,
  formatMonthForInput,
  getBaseIdFromPath,
  getBaseName,
  getDomainFromUrl,
  getPageContext,
  getPlacementDisclosure,
  getServiceCategoryLabel,
  normalizeMonthInput,
  sanitizeOutboundUrl,
} from "./pcs-reference-data.js";

const SUPABASE_BROWSER_CDN =
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

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
  profile: null,
  moveProfile: null,
  pendingKeys: new Set(),
  syncTimer: null,
  storagePatched: false,
  suppressSync: false,
  handlingSession: false,
  logisticsHydrating: false,
  logisticsPersistenceBound: false,
  googleAuthEnabled: false,
  landingInteractionsBound: false,
  analyticsTrackingBound: false,
  siteChromeBound: false,
  mobileDisclosureWatcherBound: false,
  pageViewKey: "",
  authEls: null,
};

const DESTINATION_BASE_OPTIONS = buildOptionsMarkup(BASE_OPTIONS, "Not sure yet");
const ORIGIN_REGION_OPTIONS_MARKUP = buildOptionsMarkup(ORIGIN_REGION_OPTIONS, "Choose a region");
const MOVE_STAGE_OPTIONS_MARKUP = buildOptionsMarkup(MOVE_STAGE_OPTIONS, "Choose the current stage");
const HOUSING_INTENT_OPTIONS_MARKUP = buildOptionsMarkup(
  HOUSING_INTENT_OPTIONS,
  "Choose a housing plan"
);
const HOUSEHOLD_SIZE_OPTIONS_MARKUP = buildOptionsMarkup(
  HOUSEHOLD_SIZE_OPTIONS,
  "Choose a household size"
);

const hasWindow = typeof window !== "undefined";
const MOBILE_LAYOUT_QUERY = "(max-width: 860px)";

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

const parseBoolean = (value) => String(value).toLowerCase() === "true";

const isLandingPath = (pathname) => pathname === "/" || pathname.endsWith("/index.html");

const isCreateAccountPath = (pathname) => pathname.endsWith("/create-account.html");

const isPublicPath = (pathname) => isLandingPath(pathname) || isCreateAccountPath(pathname);

const redirectToLanding = () => {
  window.location.replace(new URL("/index.html", window.location.origin).toString());
};

const toTitleCase = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");

const normalizeFullName = (value) => {
  const normalized = toTitleCase(value);
  return normalized || "";
};

const getProfileFullName = () =>
  normalizeFullName(
    state.profile?.full_name ||
      state.user?.user_metadata?.full_name ||
      state.user?.user_metadata?.name ||
      ""
  );

const getFallbackName = () => {
  const email = state.user?.email || state.profile?.email || "";
  const localPart = email.split("@")[0] || "";
  return localPart ? toTitleCase(localPart.replace(/[._-]+/g, " ")) : "";
};

const getDisplayName = () => getProfileFullName() || getFallbackName() || "PCS Planner";

const getFirstName = () => getDisplayName().split(/\s+/)[0] || "Planner";

const getPossessiveFirstName = () => {
  const firstName = getFirstName();
  return firstName.endsWith("s") ? `${firstName}'` : `${firstName}'s`;
};

const applyPersonalization = () => {
  const replacements = {
    "{fullName}": getDisplayName(),
    "{firstName}": getFirstName(),
    "{possessiveFirstName}": getPossessiveFirstName(),
  };

  Array.from(document.querySelectorAll("[data-personalize-template]")).forEach((element) => {
    if (!element.dataset.defaultText) {
      element.dataset.defaultText = element.textContent.trim();
    }

    if (!state.user) {
      element.textContent = element.dataset.defaultText;
      return;
    }

    let resolved = element.dataset.personalizeTemplate || element.dataset.defaultText;
    Object.entries(replacements).forEach(([token, value]) => {
      resolved = resolved.replaceAll(token, value);
    });
    element.textContent = resolved;
  });
};

const getDefaultHouseholdProfile = () => ({
  household_size_bucket: "",
});

const getDefaultMoveProfile = () => ({
  destination_base_id: "",
  origin_region: "",
  move_month: "",
  move_stage: "planning",
  housing_intent: "",
  lodging_needed: false,
  vehicle_shipment_needed: false,
  pets_flag: false,
  school_age_flag: false,
  spouse_employment_flag: false,
});

const getHouseholdProfile = () => ({
  ...getDefaultHouseholdProfile(),
  ...(state.profile?.household_profile_coarse || {}),
});

const getMoveProfile = () => ({
  ...getDefaultMoveProfile(),
  ...(state.moveProfile || {}),
});

const coerceBoolean = (value) => Boolean(value);

const coercePlainValue = (value) => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => coercePlainValue(entry))
      .filter((entry) => entry !== null && entry !== undefined);
  }
  return null;
};

const sanitizeMetadata = (metadata) => {
  const entries = Object.entries(metadata || {}).flatMap(([key, value]) => {
    if (!key) {
      return [];
    }
    const normalized = coercePlainValue(value);
    if (normalized === null || normalized === undefined || normalized === "") {
      return [];
    }
    return [[key, normalized]];
  });

  return Object.fromEntries(entries);
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

const isMobileLayout = () =>
  hasWindow && window.matchMedia(MOBILE_LAYOUT_QUERY).matches;

const setMobileNavigationState = (isOpen) => {
  const siteNav = document.querySelector(".site-nav");
  const toggle = document.querySelector(".site-nav-toggle");
  if (!siteNav || !toggle) {
    return;
  }

  if (!isMobileLayout()) {
    siteNav.removeAttribute("data-mobile-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menu";
    return;
  }

  siteNav.dataset.mobileOpen = String(isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.textContent = isOpen ? "Close" : "Menu";
};

const closeMobileNavigation = () => {
  setMobileNavigationState(false);
};

const closeAuthPanel = () => {
  if (!state.authEls?.details) {
    return;
  }
  state.authEls.details.open = false;
};

const openAuthPanel = () => {
  closeMobileNavigation();
  if (!state.authEls?.details) {
    return;
  }
  state.authEls.details.open = true;
  if (state.user) {
    state.authEls.profileNameInput?.focus();
    return;
  }

  const emailField =
    state.authEls.signinForm?.querySelector("input[name='email']") ||
    state.authEls.signupForm?.querySelector("input[name='email']");
  emailField?.focus();
};

const initializeAdaptiveDisclosures = () => {
  const disclosures = Array.from(
    document.querySelectorAll(".mobile-disclosure[data-mobile-collapse='true']")
  );
  if (!disclosures.length) {
    return;
  }

  const shouldCollapse = isMobileLayout();
  disclosures.forEach((disclosure) => {
    if (disclosure.dataset.mobileDisclosureInitialized === "true") {
      return;
    }
    disclosure.dataset.mobileDisclosureInitialized = "true";
    if (shouldCollapse) {
      disclosure.removeAttribute("open");
    }
  });

  if (state.mobileDisclosureWatcherBound) {
    return;
  }

  const mediaQuery = window.matchMedia(MOBILE_LAYOUT_QUERY);
  const handleChange = (event) => {
    if (event.matches) {
      return;
    }
    disclosures.forEach((disclosure) => {
      disclosure.setAttribute("open", "");
    });
  };

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleChange);
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(handleChange);
  }
  state.mobileDisclosureWatcherBound = true;
};

const initializeSiteChrome = () => {
  const topBar = document.querySelector(".top-bar");
  const siteNav = topBar?.querySelector(".site-nav");
  if (!topBar || !siteNav) {
    initializeAdaptiveDisclosures();
    return;
  }

  if (!siteNav.id) {
    siteNav.id = "site-primary-nav";
  }

  if (!topBar.querySelector(".site-nav-toggle")) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "site-nav-toggle";
    toggle.setAttribute("aria-controls", siteNav.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menu";
    topBar.insertBefore(toggle, siteNav);

    toggle.addEventListener("click", () => {
      const isOpen = siteNav.dataset.mobileOpen === "true";
      setMobileNavigationState(!isOpen);
    });
  }

  if (!state.siteChromeBound) {
    document.addEventListener("click", (event) => {
      if (!isMobileLayout()) {
        return;
      }
      if (event.target.closest(".top-bar")) {
        return;
      }
      closeMobileNavigation();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }
      closeMobileNavigation();
    });

    Array.from(document.querySelectorAll(".site-nav a")).forEach((link) => {
      link.addEventListener("click", () => {
        closeMobileNavigation();
      });
    });

    const mediaQuery = window.matchMedia(MOBILE_LAYOUT_QUERY);
    const handleChange = () => {
      closeMobileNavigation();
    };
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleChange);
    }

    state.siteChromeBound = true;
  }

  setMobileNavigationState(false);
  initializeAdaptiveDisclosures();
};

const updateLandingNavigation = () => {
  const protectedLinks = Array.from(document.querySelectorAll(".site-nav [data-protected-link]"));
  protectedLinks.forEach((link) => {
    const target = link.dataset.protectedLink;
    if (!target) {
      return;
    }
    link.classList.toggle("is-disabled", !state.user);
    link.setAttribute("aria-disabled", String(!state.user));
    link.setAttribute("href", state.user ? target : "#");
  });
};

const updateLandingWorkspace = () => {
  const launcher = document.querySelector("#workspace-launcher");
  const openAuthButton = document.querySelector("#open-auth-panel-button");
  if (launcher) {
    launcher.hidden = !state.user;
  }
  if (openAuthButton) {
    openAuthButton.hidden = Boolean(state.user);
  }
  updateLandingNavigation();
  applyPersonalization();
};

const setSignupPageStatus = (message, tone = "neutral") => {
  const status = document.querySelector("[data-signup-page-status]");
  if (!status) {
    return;
  }
  status.textContent = message;
  status.dataset.tone = tone;
};

const signUpWithEmail = async ({ fullName, email, password }) =>
  state.supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || null,
        name: fullName || null,
      },
    },
  });

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
  const fullName = normalizeFullName(
    user.user_metadata?.full_name || user.user_metadata?.name || ""
  );
  const { error } = await state.supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email || null,
      full_name: fullName || null,
    },
    { onConflict: "id" }
  );
  if (error) {
    throw error;
  }
};

const fetchProfile = async (userId) => {
  const { data, error } = await state.supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
};

const saveProfile = async (fullNameInput) => {
  const fullName = normalizeFullName(fullNameInput);
  const authUpdate = await state.supabase.auth.updateUser({
    data: {
      full_name: fullName || null,
      name: fullName || null,
    },
  });

  if (authUpdate.error) {
    throw authUpdate.error;
  }

  const { error } = await state.supabase.from("profiles").upsert(
    {
      id: state.user.id,
      email: state.user.email || null,
      full_name: fullName || null,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }

  state.profile = {
    ...(state.profile || {}),
    id: state.user.id,
    email: state.user.email || null,
    full_name: fullName || null,
  };
};

const savePrivacySettings = async ({
  analyticsConsent,
  marketingConsent,
  dataSaleOptOut,
  householdSizeBucket,
}) => {
  const nextHouseholdProfile = {
    ...getHouseholdProfile(),
    household_size_bucket: householdSizeBucket || "",
  };

  const { error } = await state.supabase.from("profiles").upsert(
    {
      id: state.user.id,
      email: state.user.email || null,
      full_name: getProfileFullName() || null,
      analytics_consent: analyticsConsent,
      marketing_consent: marketingConsent,
      data_sale_opt_out: dataSaleOptOut,
      household_profile_coarse: nextHouseholdProfile,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }

  state.profile = {
    ...(state.profile || {}),
    id: state.user.id,
    email: state.user.email || null,
    analytics_consent: analyticsConsent,
    marketing_consent: marketingConsent,
    data_sale_opt_out: dataSaleOptOut,
    household_profile_coarse: nextHouseholdProfile,
  };
};

const fetchMoveProfile = async (userId) => {
  const { data, error } = await state.supabase
    .from("moves")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
};

const saveMoveProfile = async (moveProfileInput) => {
  const payload = {
    user_id: state.user.id,
    destination_base_id: moveProfileInput.destination_base_id || null,
    origin_region: moveProfileInput.origin_region || null,
    move_month: normalizeMonthInput(moveProfileInput.move_month),
    move_stage: moveProfileInput.move_stage || "planning",
    housing_intent: moveProfileInput.housing_intent || null,
    lodging_needed: coerceBoolean(moveProfileInput.lodging_needed),
    vehicle_shipment_needed: coerceBoolean(moveProfileInput.vehicle_shipment_needed),
    pets_flag: coerceBoolean(moveProfileInput.pets_flag),
    school_age_flag: coerceBoolean(moveProfileInput.school_age_flag),
    spouse_employment_flag: coerceBoolean(moveProfileInput.spouse_employment_flag),
  };

  const { data, error } = await state.supabase
    .from("moves")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  state.moveProfile = data || null;
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

const getProviderLabel = () => {
  const provider = state.user?.app_metadata?.provider || "email";
  return provider === "google" ? "Google account" : "Email account";
};

const canTrackAnalytics = () =>
  Boolean(state.supabase && state.user && state.profile?.analytics_consent);

const trackEvent = async ({ eventType, baseId = "", serviceCategory = "", metadata = {} }) => {
  if (!canTrackAnalytics()) {
    return;
  }

  const { error } = await state.supabase.from("events").insert({
    event_type: eventType,
    base_id: baseId || null,
    service_category: serviceCategory || null,
    metadata_jsonb: sanitizeMetadata(metadata),
  });

  if (error) {
    console.warn("Unable to log analytics event.", error);
  }
};

const trackResourceClick = async ({
  baseId = "",
  category = "",
  partnerId = "",
  targetUrl = "",
}) => {
  if (!canTrackAnalytics()) {
    return;
  }

  const { error } = await state.supabase.from("resource_clicks").insert({
    base_id: baseId || null,
    category: category || null,
    partner_id: partnerId || null,
    target_url: sanitizeOutboundUrl(targetUrl) || null,
  });

  if (error) {
    console.warn("Unable to log resource click.", error);
  }
};

const maybeTrackPageView = async () => {
  if (!canTrackAnalytics()) {
    state.pageViewKey = "";
    return;
  }

  const pageContext = getPageContext();
  const trackingKey = `${state.user.id}:${window.location.pathname}`;
  if (state.pageViewKey === trackingKey) {
    return;
  }

  state.pageViewKey = trackingKey;
  await trackEvent({
    eventType: "page_view",
    baseId:
      pageContext.baseId || getMoveProfile().destination_base_id || "",
    serviceCategory: pageContext.serviceCategory || "",
    metadata: {
      page_kind: pageContext.pageKind,
      page_slug: pageContext.pageSlug,
      content_category: pageContext.contentCategory,
      page_move_stage: pageContext.suggestedMoveStage,
    },
  });
};

const initializeAnalyticsTracking = () => {
  if (state.analyticsTrackingBound) {
    return;
  }

  state.analyticsTrackingBound = true;

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) {
      return;
    }

    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }

    let resolvedUrl;
    try {
      resolvedUrl = new URL(href, window.location.origin);
    } catch (error) {
      return;
    }

    const isExternal = resolvedUrl.origin !== window.location.origin;
    const shouldTrackAsResource = link.dataset.trackResource === "true" || isExternal;
    if (!shouldTrackAsResource) {
      return;
    }

    const pageContext = getPageContext();
    const resourceCategory = link.dataset.resourceCategory || pageContext.serviceCategory || "";
    const baseId =
      link.dataset.baseId ||
      pageContext.baseId ||
      getMoveProfile().destination_base_id ||
      "";
    const partnerId = link.dataset.partnerId || "";
    const resourceKind =
      link.dataset.resourceKind || (partnerId ? "partner" : isExternal ? "external" : "internal");

    void trackResourceClick({
      baseId,
      category: resourceCategory,
      partnerId,
      targetUrl: resolvedUrl.toString(),
    });

    void trackEvent({
      eventType: partnerId ? "partner_referral_clicked" : "resource_clicked",
      baseId,
      serviceCategory: resourceCategory,
      metadata: {
        page_slug: pageContext.pageSlug,
        content_category: pageContext.contentCategory,
        resource_kind: resourceKind,
        link_label: (link.dataset.resourceLabel || link.textContent || "").trim().slice(0, 120),
        target_domain: getDomainFromUrl(resolvedUrl.toString()),
        placement_kind: link.dataset.placementKind || "",
      },
    });
  });
};

const loadPartnerPlacements = async (baseId) => {
  if (!state.supabase || !state.user || !baseId) {
    return [];
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await state.supabase
    .from("partner_placements")
    .select(
      "id, base_id, service_category, placement_kind, placement_label, cta_label, priority, active, starts_at, ends_at, partner:partners!inner(id, display_name, partner_category, referral_url, website_url, disclosure_label, lead_enabled, active)"
    )
    .eq("active", true)
    .lte("starts_at", nowIso)
    .or(`base_id.eq.${baseId},base_id.is.null`)
    .order("priority", { ascending: true });

  if (error) {
    console.warn("Unable to load partner placements.", error);
    return [];
  }

  return (data || []).filter((placement) => {
    if (!placement?.partner?.active) {
      return false;
    }
    if (!placement.ends_at) {
      return true;
    }
    return new Date(placement.ends_at).getTime() >= Date.now();
  });
};

const buildLeadPayload = ({ partnerId, serviceCategory, contactEmail, moveMonth, baseId }) => {
  const currentMove = getMoveProfile();
  const payload = sanitizeMetadata({
    contact_email: contactEmail,
    preferred_contact_method: "email",
    destination_base_id: baseId || currentMove.destination_base_id,
    move_month: normalizeMonthInput(moveMonth || currentMove.move_month),
    service_category: serviceCategory || "",
    housing_intent: currentMove.housing_intent || "",
    lodging_needed: currentMove.lodging_needed || null,
    vehicle_shipment_needed: currentMove.vehicle_shipment_needed || null,
    pets_flag: currentMove.pets_flag || null,
    school_age_flag: currentMove.school_age_flag || null,
    spouse_employment_flag: currentMove.spouse_employment_flag || null,
  });

  return {
    user_id: state.user.id,
    partner_id: partnerId,
    consent_timestamp: new Date().toISOString(),
    lead_payload_minimized: payload,
  };
};

const submitPartnerLead = async ({ partnerId, serviceCategory, contactEmail, moveMonth, baseId }) => {
  if (!state.supabase || !state.user) {
    throw new Error("Sign in before requesting a partner intro.");
  }

  const { error } = await state.supabase.from("partner_leads").insert(
    buildLeadPayload({
      partnerId,
      serviceCategory,
      contactEmail,
      moveMonth,
      baseId,
    })
  );

  if (error) {
    throw error;
  }
};

const buildPartnerLeadForm = (placement, baseId) => {
  if (!placement?.partner?.lead_enabled) {
    return null;
  }

  const details = document.createElement("details");
  details.className = "partner-lead-details";

  const summary = document.createElement("summary");
  summary.textContent = "Request a vetted intro";
  details.appendChild(summary);

  const form = document.createElement("form");
  form.className = "partner-lead-form";

  const emailLabel = document.createElement("label");
  emailLabel.textContent = "Best email";
  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.name = "contact_email";
  emailInput.required = true;
  emailInput.value = state.user?.email || state.profile?.email || "";
  emailLabel.appendChild(emailInput);
  form.appendChild(emailLabel);

  const monthLabel = document.createElement("label");
  monthLabel.textContent = "Move month (optional)";
  const monthInput = document.createElement("input");
  monthInput.type = "month";
  monthInput.name = "move_month";
  monthInput.value = formatMonthForInput(getMoveProfile().move_month);
  monthLabel.appendChild(monthInput);
  form.appendChild(monthLabel);

  const consentLabel = document.createElement("label");
  consentLabel.className = "account-checkbox account-checkbox--single";
  const consentInput = document.createElement("input");
  consentInput.type = "checkbox";
  consentInput.name = "lead_consent";
  consentInput.required = true;
  const consentCopy = document.createElement("span");
  consentCopy.textContent = `I want PCS Pal to share this request with ${placement.partner.display_name}.`;
  consentLabel.appendChild(consentInput);
  consentLabel.appendChild(consentCopy);
  form.appendChild(consentLabel);

  const status = document.createElement("p");
  status.className = "partner-lead-status";
  status.textContent = "Only the minimum contact and coarse move details are sent when you request an intro.";
  form.appendChild(status);

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Submit intro request";
  form.appendChild(submitButton);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.dataset.tone = "neutral";
    status.textContent = "Submitting request...";

    try {
      await submitPartnerLead({
        partnerId: placement.partner.id,
        serviceCategory: placement.service_category || placement.partner.partner_category,
        contactEmail: emailInput.value.trim(),
        moveMonth: monthInput.value,
        baseId,
      });
      await trackEvent({
        eventType: "partner_intro_requested",
        baseId,
        serviceCategory: placement.service_category || placement.partner.partner_category || "",
        metadata: {
          partner_id: placement.partner.id,
          placement_kind: placement.placement_kind,
          content_category: "partner_placement",
        },
      });
      status.dataset.tone = "success";
      status.textContent = "Intro request submitted. PCS Pal only stores the minimum lead details needed for this handoff.";
      form.reset();
      emailInput.value = state.user?.email || state.profile?.email || "";
      monthInput.value = formatMonthForInput(getMoveProfile().move_month);
    } catch (error) {
      console.error("Unable to submit partner lead.", error);
      status.dataset.tone = "error";
      status.textContent =
        error.message || "Unable to submit this request right now. Your planner data is unchanged.";
    }
  });

  details.appendChild(form);
  return details;
};

const createPartnerPlacementCard = (placement, baseId) => {
  const card = document.createElement("article");
  card.className = "base-card partner-placement-card";

  const badge = document.createElement("span");
  badge.className = "placement-badge";
  badge.textContent = placement.placement_label || getPlacementDisclosure(placement.placement_kind);
  card.appendChild(badge);

  const heading = document.createElement("h3");
  heading.textContent = placement.partner.display_name;
  card.appendChild(heading);

  const body = document.createElement("p");
  body.className = "base-resource-copy";
  body.textContent = `${placement.partner.disclosure_label || getPlacementDisclosure(placement.placement_kind)} for ${getBaseName(baseId)} families looking for ${getServiceCategoryLabel(
    placement.service_category || placement.partner.partner_category
  ).toLowerCase()}.`;
  card.appendChild(body);

  const disclosure = document.createElement("p");
  disclosure.className = "partner-card-disclosure";
  disclosure.textContent = "Partner cards are clearly labeled and separate from neutral installation resources.";
  card.appendChild(disclosure);

  const actions = document.createElement("div");
  actions.className = "base-link-stack";

  const outboundLink = document.createElement("a");
  outboundLink.className = "card-link";
  outboundLink.href = placement.partner.referral_url || placement.partner.website_url || "#";
  outboundLink.target = "_blank";
  outboundLink.rel = "noopener noreferrer";
  outboundLink.textContent = placement.cta_label || "Visit partner";
  outboundLink.dataset.trackResource = "true";
  outboundLink.dataset.partnerId = placement.partner.id;
  outboundLink.dataset.baseId = baseId;
  outboundLink.dataset.resourceCategory =
    placement.service_category || placement.partner.partner_category || "";
  outboundLink.dataset.resourceKind = "partner";
  outboundLink.dataset.placementKind = placement.placement_kind;
  outboundLink.dataset.resourceLabel = `${placement.partner.display_name} ${placement.cta_label || "Visit partner"}`;
  actions.appendChild(outboundLink);

  const leadForm = buildPartnerLeadForm(placement, baseId);
  if (leadForm) {
    actions.appendChild(leadForm);
  }

  card.appendChild(actions);
  return card;
};

const clearPartnerPlacementSlot = () => {
  const slot = document.querySelector("[data-sponsored-placements='true']");
  if (!slot) {
    return;
  }
  slot.hidden = true;
  slot.innerHTML = "";
  slot.dataset.renderKey = "";
};

const renderPartnerPlacements = async () => {
  const slot = document.querySelector("[data-sponsored-placements='true']");
  if (!slot) {
    return;
  }

  const baseId = slot.dataset.baseId || getBaseIdFromPath(window.location.pathname);
  if (!baseId) {
    clearPartnerPlacementSlot();
    return;
  }

  const placements = await loadPartnerPlacements(baseId);
  if (!placements.length) {
    clearPartnerPlacementSlot();
    return;
  }

  const renderKey = placements.map((placement) => placement.id).join("|");
  if (slot.dataset.renderKey === renderKey) {
    return;
  }

  slot.dataset.renderKey = renderKey;
  slot.hidden = false;
  slot.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Sponsored PCS Services";
  slot.appendChild(heading);

  const intro = document.createElement("p");
  intro.className = "base-enhancement-intro";
  intro.textContent =
    "These partner placements are clearly labeled, base-aware when configured, and only generate a lead when you explicitly request one.";
  slot.appendChild(intro);

  const grid = document.createElement("div");
  grid.className = "base-grid";
  placements.forEach((placement) => {
    grid.appendChild(createPartnerPlacementCard(placement, baseId));
  });
  slot.appendChild(grid);

  if (canTrackAnalytics()) {
    placements.forEach((placement) => {
      void trackEvent({
        eventType: "partner_placement_viewed",
        baseId,
        serviceCategory: placement.service_category || placement.partner.partner_category || "",
        metadata: {
          partner_id: placement.partner.id,
          placement_kind: placement.placement_kind,
          content_category: "partner_placement",
        },
      });
    });
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
        <section class="account-summary" hidden>
          <h3>Account Details</h3>
          <dl class="account-meta">
            <div>
              <dt>Name</dt>
              <dd data-account-name>Not set</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd data-account-email></dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd data-account-access>Email account</dd>
            </div>
            <div>
              <dt>Billing</dt>
              <dd>Not enabled yet</dd>
            </div>
          </dl>
          <form class="profile-form" data-profile-form="identity">
            <label>
              Full name
              <input
                type="text"
                name="full_name"
                autocomplete="name"
                placeholder="Add your name"
              />
            </label>
            <button type="submit">Save profile</button>
          </form>
          <section class="account-settings-block">
            <h3>Privacy Settings</h3>
            <p class="account-copy">
              Help PCS Pal improve with opt-in, privacy-conscious analytics. Quote or introduction
              requests are only sent when you explicitly ask us to connect you.
            </p>
            <form class="profile-form preference-form" data-profile-form="preferences">
              <label class="account-checkbox">
                <input type="checkbox" name="analytics_consent" />
                <span>Help PCS Pal improve with privacy-conscious usage analytics.</span>
              </label>
              <label class="account-checkbox">
                <input type="checkbox" name="marketing_consent" />
                <span>Receive occasional PCS Pal updates and partner offers.</span>
              </label>
              <label class="account-checkbox">
                <input type="checkbox" name="data_sale_opt_out" checked />
                <span>Do not allow sharing or sale beyond services I explicitly request.</span>
              </label>
              <label>
                Household size
                <select name="household_size_bucket">
                  ${HOUSEHOLD_SIZE_OPTIONS_MARKUP}
                </select>
              </label>
              <button type="submit">Save privacy settings</button>
            </form>
          </section>
          <section class="account-settings-block">
            <h3>Move Profile</h3>
            <p class="account-copy">
              Save only the coarse move details needed for planning, partner referrals, and aggregate trend reporting.
            </p>
            <form class="profile-form move-profile-form" data-profile-form="move">
              <label>
                Destination base
                <select name="destination_base_id">
                  ${DESTINATION_BASE_OPTIONS}
                </select>
              </label>
              <label>
                Origin region
                <select name="origin_region">
                  ${ORIGIN_REGION_OPTIONS_MARKUP}
                </select>
              </label>
              <label>
                Move month
                <input type="month" name="move_month" />
              </label>
              <label>
                Current move stage
                <select name="move_stage">
                  ${MOVE_STAGE_OPTIONS_MARKUP}
                </select>
              </label>
              <label>
                Housing plan
                <select name="housing_intent">
                  ${HOUSING_INTENT_OPTIONS_MARKUP}
                </select>
              </label>
              <div class="account-checkbox-grid">
                <label class="account-checkbox">
                  <input type="checkbox" name="lodging_needed" />
                  <span>Temporary lodging likely needed</span>
                </label>
                <label class="account-checkbox">
                  <input type="checkbox" name="vehicle_shipment_needed" />
                  <span>Vehicle shipment likely needed</span>
                </label>
                <label class="account-checkbox">
                  <input type="checkbox" name="pets_flag" />
                  <span>Moving with pets</span>
                </label>
                <label class="account-checkbox">
                  <input type="checkbox" name="school_age_flag" />
                  <span>School-age children in household</span>
                </label>
                <label class="account-checkbox">
                  <input type="checkbox" name="spouse_employment_flag" />
                  <span>Spouse employment support may be needed</span>
                </label>
              </div>
              <button type="submit">Save move profile</button>
            </form>
          </section>
        </section>
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
        <a class="auth-create-account-link" href="create-account.html">Create account</a>
        <button type="button" class="auth-google-button">Continue with Google</button>
        <button type="button" class="auth-signout-button" hidden>Sign out</button>
      </div>
    </details>
  `;

  topBar.appendChild(wrapper);

  const signinForm = wrapper.querySelector("[data-auth-form='signin']");
  const signupForm = wrapper.querySelector("[data-auth-form='signup']");
  const createAccountLink = wrapper.querySelector(".auth-create-account-link");
  const googleButton = wrapper.querySelector(".auth-google-button");
  const signoutButton = wrapper.querySelector(".auth-signout-button");
  const status = wrapper.querySelector(".auth-status");
  const details = wrapper.querySelector(".auth-details");
  const accountSummary = wrapper.querySelector(".account-summary");
  const accountName = wrapper.querySelector("[data-account-name]");
  const accountEmail = wrapper.querySelector("[data-account-email]");
  const accountAccess = wrapper.querySelector("[data-account-access]");
  const profileForm = wrapper.querySelector("[data-profile-form='identity']");
  const profileNameInput = wrapper.querySelector(
    "[data-profile-form='identity'] input[name='full_name']"
  );
  const preferenceForm = wrapper.querySelector("[data-profile-form='preferences']");
  const moveProfileForm = wrapper.querySelector("[data-profile-form='move']");

  state.authEls = {
    wrapper,
    signinForm,
    signupForm,
    createAccountLink,
    googleButton,
    signoutButton,
    status,
    details,
    accountSummary,
    accountName,
    accountEmail,
    accountAccess,
    profileForm,
    profileNameInput,
    preferenceForm,
    moveProfileForm,
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
  if (authEls.signupForm) {
    authEls.signupForm.hidden = true;
  }
  if (authEls.createAccountLink) {
    authEls.createAccountLink.hidden = isSignedIn || isCreateAccountPath(window.location.pathname);
  }
  authEls.googleButton.hidden = !state.googleAuthEnabled || isSignedIn;
  authEls.signoutButton.hidden = !isSignedIn;
  authEls.accountSummary.hidden = !isSignedIn;

  if (isSignedIn) {
    const moveProfile = getMoveProfile();
    const householdProfile = getHouseholdProfile();
    authEls.accountName.textContent = getDisplayName();
    authEls.accountEmail.textContent = state.user.email || state.profile?.email || "";
    authEls.accountAccess.textContent = getProviderLabel();
    authEls.profileNameInput.value = getProfileFullName();
    authEls.preferenceForm.elements.analytics_consent.checked = Boolean(
      state.profile?.analytics_consent
    );
    authEls.preferenceForm.elements.marketing_consent.checked = Boolean(
      state.profile?.marketing_consent
    );
    authEls.preferenceForm.elements.data_sale_opt_out.checked =
      state.profile?.data_sale_opt_out !== false;
    authEls.preferenceForm.elements.household_size_bucket.value =
      householdProfile.household_size_bucket || "";
    authEls.moveProfileForm.elements.destination_base_id.value =
      moveProfile.destination_base_id || "";
    authEls.moveProfileForm.elements.origin_region.value = moveProfile.origin_region || "";
    authEls.moveProfileForm.elements.move_month.value = formatMonthForInput(moveProfile.move_month);
    authEls.moveProfileForm.elements.move_stage.value = moveProfile.move_stage || "planning";
    authEls.moveProfileForm.elements.housing_intent.value = moveProfile.housing_intent || "";
    authEls.moveProfileForm.elements.lodging_needed.checked = Boolean(moveProfile.lodging_needed);
    authEls.moveProfileForm.elements.vehicle_shipment_needed.checked = Boolean(
      moveProfile.vehicle_shipment_needed
    );
    authEls.moveProfileForm.elements.pets_flag.checked = Boolean(moveProfile.pets_flag);
    authEls.moveProfileForm.elements.school_age_flag.checked = Boolean(moveProfile.school_age_flag);
    authEls.moveProfileForm.elements.spouse_employment_flag.checked = Boolean(
      moveProfile.spouse_employment_flag
    );
    setStatus(`Signed in as ${getDisplayName()}.`, "success");
    authEls.signinForm.reset();
    authEls.signupForm?.reset();
  } else {
    authEls.accountName.textContent = "Not set";
    authEls.accountEmail.textContent = "";
    authEls.accountAccess.textContent = "Email account";
    authEls.profileNameInput.value = "";
    authEls.preferenceForm.reset();
    authEls.moveProfileForm.reset();
    authEls.preferenceForm.elements.data_sale_opt_out.checked = true;
    setStatus(
      state.googleAuthEnabled
        ? "Sign in to sync your checklist and inventory across devices."
        : "Sign in with email to sync your checklist and inventory across devices.",
      "neutral"
    );
  }

  applyPersonalization();
};

const enforceRouteAccess = () => {
  if (!hasWindow) {
    return;
  }

  const publicRoute = isPublicPath(window.location.pathname);
  if (!state.user && !publicRoute) {
    redirectToLanding();
    return;
  }

  if (state.user && isCreateAccountPath(window.location.pathname)) {
    redirectToLanding();
    return;
  }

  updateLandingWorkspace();
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
    closeAuthPanel();
  });

  if (state.googleAuthEnabled) {
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

    setStatus("Signing out...", "neutral");
    const { error } = await state.supabase.auth.signOut();
    if (error) {
      setStatus(error.message, "error");
      return;
    }

    closeAuthPanel();
    setStatus("Signed out. Local mode remains available.", "neutral");
  });

  authEls.profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.supabase || !state.user) {
      return;
    }

    const nextFullName = authEls.profileNameInput.value;
    setStatus("Saving account details...", "neutral");
    try {
      await saveProfile(nextFullName);
      if (state.user?.user_metadata) {
        state.user = {
          ...state.user,
          user_metadata: {
            ...state.user.user_metadata,
            full_name: normalizeFullName(nextFullName) || null,
            name: normalizeFullName(nextFullName) || null,
          },
        };
      }
      closeAuthPanel();
      setStatus("Account details updated.", "success");
    } catch (error) {
      console.error("Failed to save account profile.", error);
      setStatus(error.message || "Unable to update account details.", "error");
      return;
    }

    try {
      updateAuthUI();
      updateLandingWorkspace();
    } catch (error) {
      console.error("Account profile saved, but follow-up UI refresh failed.", error);
    }
  });

  authEls.preferenceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.supabase || !state.user) {
      return;
    }

    setStatus("Saving privacy settings...", "neutral");
    try {
      await savePrivacySettings({
        analyticsConsent: authEls.preferenceForm.elements.analytics_consent.checked,
        marketingConsent: authEls.preferenceForm.elements.marketing_consent.checked,
        dataSaleOptOut: authEls.preferenceForm.elements.data_sale_opt_out.checked,
        householdSizeBucket: authEls.preferenceForm.elements.household_size_bucket.value,
      });
      await trackEvent({
        eventType: "privacy_preferences_updated",
        metadata: {
          analytics_consent: authEls.preferenceForm.elements.analytics_consent.checked,
          marketing_consent: authEls.preferenceForm.elements.marketing_consent.checked,
          data_sale_opt_out: authEls.preferenceForm.elements.data_sale_opt_out.checked,
          content_category: "account",
        },
      });
      updateAuthUI();
      await maybeTrackPageView();
      setStatus("Privacy settings updated.", "success");
    } catch (error) {
      console.error("Failed to save privacy settings.", error);
      setStatus(
        error.message || "Unable to update privacy settings right now.",
        "error"
      );
    }
  });

  authEls.moveProfileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.supabase || !state.user) {
      return;
    }

    const nextMoveProfile = {
      destination_base_id: authEls.moveProfileForm.elements.destination_base_id.value,
      origin_region: authEls.moveProfileForm.elements.origin_region.value,
      move_month: authEls.moveProfileForm.elements.move_month.value,
      move_stage: authEls.moveProfileForm.elements.move_stage.value,
      housing_intent: authEls.moveProfileForm.elements.housing_intent.value,
      lodging_needed: authEls.moveProfileForm.elements.lodging_needed.checked,
      vehicle_shipment_needed:
        authEls.moveProfileForm.elements.vehicle_shipment_needed.checked,
      pets_flag: authEls.moveProfileForm.elements.pets_flag.checked,
      school_age_flag: authEls.moveProfileForm.elements.school_age_flag.checked,
      spouse_employment_flag:
        authEls.moveProfileForm.elements.spouse_employment_flag.checked,
    };

    setStatus("Saving move profile...", "neutral");
    try {
      await saveMoveProfile(nextMoveProfile);
      closeAuthPanel();
      setStatus("Move profile updated.", "success");
    } catch (error) {
      console.error("Failed to save move profile.", error);
      setStatus(error.message || "Unable to update the move profile right now.", "error");
      return;
    }

    try {
      await trackEvent({
        eventType: "move_profile_updated",
        baseId: nextMoveProfile.destination_base_id,
        metadata: {
          move_stage: nextMoveProfile.move_stage,
          housing_intent: nextMoveProfile.housing_intent,
          lodging_needed: nextMoveProfile.lodging_needed,
          vehicle_shipment_needed: nextMoveProfile.vehicle_shipment_needed,
          school_age_flag: nextMoveProfile.school_age_flag,
          spouse_employment_flag: nextMoveProfile.spouse_employment_flag,
          content_category: "account",
        },
      });
      updateAuthUI();
      await renderPartnerPlacements();
    } catch (error) {
      console.error("Move profile saved, but follow-up UI refresh failed.", error);
    }
  });

  document.querySelector("#open-auth-panel-button")?.addEventListener("click", () => {
    openAuthPanel();
  });

  if (!state.landingInteractionsBound) {
    document.addEventListener("click", (event) => {
      const disabledLink = event.target.closest(".site-nav a.is-disabled[data-protected-link]");
      if (!disabledLink) {
        return;
      }
      event.preventDefault();
      openAuthPanel();
    });
    state.landingInteractionsBound = true;
  }
};

const initializeSignupPageEvents = () => {
  const signupForm = document.querySelector("[data-signup-page-form]");
  if (!signupForm) {
    return;
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.supabase) {
      setSignupPageStatus("Cloud sign-up is unavailable right now.", "error");
      return;
    }

    const formData = new FormData(signupForm);
    const fullName = normalizeFullName(String(formData.get("full_name") || ""));
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    setSignupPageStatus("Creating account...", "neutral");
    const { data, error } = await signUpWithEmail({
      fullName,
      email,
      password,
    });

    if (error) {
      setSignupPageStatus(error.message, "error");
      return;
    }

    signupForm.reset();

    if (data.session) {
      setSignupPageStatus("Account created and signed in. Redirecting to your workspace...", "success");
      window.location.replace(new URL("/index.html", window.location.origin).toString());
      return;
    }

    const signinEmailField = state.authEls?.signinForm?.querySelector("input[name='email']");
    if (signinEmailField) {
      signinEmailField.value = email;
    }

    setSignupPageStatus(
      "Account created. Check your email to confirm, then return to the landing page to sign in.",
      "success"
    );
  });
};

const loadRuntimeConfig = async () => {
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

  return config;
};

const initSupabaseClient = async (config) => {
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
  if (!state.user) {
    state.profile = null;
    state.moveProfile = null;
    state.pageViewKey = "";
    clearPartnerPlacementSlot();
  }
  updateAuthUI();
  enforceRouteAccess();

  if (!state.user || !state.supabase) {
    return;
  }

  if (state.handlingSession) {
    return;
  }

  state.handlingSession = true;
  try {
    await upsertProfile(state.user);
    state.profile = await fetchProfile(state.user.id);
    await reconcileLocalAndRemote(state.user);
    await flushPendingSync();
    updateAuthUI();
    updateLandingWorkspace();
    setStatus(`Signed in as ${getDisplayName()}.`, "success");
  } catch (error) {
    console.error("Failed during session setup.", error);
    setStatus("Sign-in succeeded, but cloud sync setup failed.", "error");
  } finally {
    try {
      state.moveProfile = await fetchMoveProfile(state.user.id);
    } catch (moveError) {
      state.moveProfile = null;
      console.warn("Move profile features are not available yet.", moveError);
    }

    updateAuthUI();
    try {
      await maybeTrackPageView();
      await renderPartnerPlacements();
    } catch (featureError) {
      console.warn("Optional analytics or partner features are not available yet.", featureError);
    }
    updateLandingWorkspace();
    state.handlingSession = false;
  }
};

const initialize = async () => {
  buildAuthUI();
  initializeSiteChrome();
  setupLogisticsLocalPersistence();
  updateLandingNavigation();
  applyPersonalization();
  initializeAnalyticsTracking();

  const authError = parseAuthErrorFromUrl();
  if (authError) {
    setStatus(authError, "error");
  }

  try {
    const runtimeConfig = await loadRuntimeConfig();
    state.googleAuthEnabled = parseBoolean(runtimeConfig.googleAuthEnabled);
    state.supabase = await initSupabaseClient(runtimeConfig);
  } catch (error) {
    console.warn("Supabase client not available.", error);
    if (!isPublicPath(window.location.pathname)) {
      redirectToLanding();
      return;
    }
    setStatus("Cloud sign-in is unavailable right now. Local mode is still active.", "error");
    setSignupPageStatus("Cloud sign-up is unavailable right now. Please try again later.", "error");
    return;
  }

  patchLocalStorageForSync();
  initializeAuthEvents();
  initializeSignupPageEvents();

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
