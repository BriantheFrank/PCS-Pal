"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  loadLogisticsState,
  pushLogistics,
  reconcileLogisticsWithRemote,
  saveLogisticsState,
} from "@/logistics-data";
import { useNativeAuth } from "@/components/auth/native-auth-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

const SYNC_DELAY_MS = 600;

const LOADING_MESSAGE = "Loading your move logistics.";
const REDIRECT_MESSAGE = "Redirecting to sign in so you can open your logistics workspace.";
const LOCAL_ONLY_MESSAGE =
  "Cloud logistics sync is unavailable right now. Progress will stay on this device.";

const getPossessiveFirstName = (displayName) => {
  const firstName = String(displayName || "")
    .split(/\s+/)
    .filter(Boolean)[0];

  if (!firstName) {
    return "";
  }

  return firstName.endsWith("s") ? `${firstName}'` : `${firstName}'s`;
};

const triggerFieldEvents = (field) => {
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
};

const collectSectionValues = (root, section) => {
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

const captureLogisticsState = (root) => {
  const sections = {};
  const sectionNodes = Array.from(root.querySelectorAll(".logistics-section[data-event-id]"));
  sectionNodes.forEach((section) => {
    const eventId = section.dataset.eventId;
    if (!eventId) {
      return;
    }
    sections[eventId] = collectSectionValues(root, section);
  });

  return {
    sections,
    itineraryStops: collectGroupedValues(
      Array.from(root.querySelectorAll("#itinerary-stops .itinerary-stop"))
    ),
    customEvents: collectGroupedValues(
      Array.from(root.querySelectorAll("#custom-events .custom-event"))
    ),
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

const syncGroupCount = (root, containerSelector, itemSelector, targetCount, addSelector, removeSelector) => {
  const container = root.querySelector(containerSelector);
  if (!container) {
    return;
  }

  const addButton = root.querySelector(addSelector);
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

const applyGroupedValues = (root, containerSelector, itemSelector, groups) => {
  const items = Array.from(root.querySelectorAll(`${containerSelector} ${itemSelector}`));

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

const hydrateLogisticsState = (root, logisticsState, hydratingRef) => {
  hydratingRef.current = true;

  const sections = Array.from(root.querySelectorAll(".logistics-section[data-event-id]"));
  sections.forEach((section) => {
    const eventId = section.dataset.eventId;
    if (!eventId) {
      return;
    }

    applyValuesToSection(section, logisticsState?.sections?.[eventId] || {});
  });

  const itineraryStops = Array.isArray(logisticsState?.itineraryStops)
    ? logisticsState.itineraryStops
    : [];
  const customEvents = Array.isArray(logisticsState?.customEvents)
    ? logisticsState.customEvents
    : [];

  syncGroupCount(
    root,
    "#itinerary-stops",
    ".itinerary-stop",
    itineraryStops.length,
    "#add-itinerary-stop",
    "[data-action='remove-stop']"
  );
  syncGroupCount(
    root,
    "#custom-events",
    ".custom-event",
    customEvents.length,
    "#add-custom-event",
    "[data-action='remove-custom']"
  );

  applyGroupedValues(root, "#itinerary-stops", ".itinerary-stop", itineraryStops);
  applyGroupedValues(root, "#custom-events", ".custom-event", customEvents);
  hydratingRef.current = false;
};

const loadLegacyLogisticsScript = () =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `/script.js?native-logistics=${Date.now()}`;
    script.async = true;
    script.dataset.nativeLogisticsRuntime = "true";
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error("Unable to load the legacy logistics runtime."));
    document.body.appendChild(script);
  });

export function NativeLogisticsPage({ legacyLogisticsHtml, googleMapsApiKey = "" }) {
  const router = useRouter();
  const { status, user, displayName, errorMessage } = useNativeAuth();
  const contentRef = useRef(null);
  const syncTimerRef = useRef(null);
  const hydratingRef = useRef(false);
  const logisticsStateRef = useRef(loadLogisticsState(null));
  const scriptRef = useRef(null);
  const [syncStatus, setSyncStatus] = useState({
    message: "",
    tone: "neutral",
  });

  useEffect(() => {
    if (status === "ready" && !user) {
      router.replace("/sign-in?next=/logistics");
    }
  }, [router, status, user]);

  useEffect(() => {
    if (status !== "ready" || !user || !contentRef.current || typeof window === "undefined") {
      return undefined;
    }

    let active = true;
    let removePersistenceListeners = () => {};
    const root = contentRef.current;
    const storage = window.localStorage;
    let supabaseClient = null;

    const flushRemoteSync = async () => {
      if (!user) {
        return;
      }

      try {
        supabaseClient = supabaseClient || (await getBrowserSupabaseClient());
        await pushLogistics({
          supabase: supabaseClient,
          userId: user.id,
          logisticsState: logisticsStateRef.current,
        });

        if (!active) {
          return;
        }

        setSyncStatus((current) =>
          current.tone === "error"
            ? {
                message: "",
                tone: "neutral",
              }
            : current
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setSyncStatus({
          message: error?.message || LOCAL_ONLY_MESSAGE,
          tone: "error",
        });
      }
    };

    const scheduleRemoteSync = () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }

      syncTimerRef.current = window.setTimeout(() => {
        void flushRemoteSync();
      }, SYNC_DELAY_MS);
    };

    const persistState = (syncRemote) => {
      if (hydratingRef.current) {
        return;
      }

      const nextState = captureLogisticsState(root);
      logisticsStateRef.current = nextState;
      saveLogisticsState(storage, nextState);
      if (syncRemote) {
        scheduleRemoteSync();
      }
    };

    const initialize = async () => {
      let logisticsState = loadLogisticsState(storage);

      try {
        supabaseClient = await getBrowserSupabaseClient();
        const reconciliation = await reconcileLogisticsWithRemote({
          supabase: supabaseClient,
          storage,
          userId: user.id,
        });

        if (!active) {
          return;
        }

        logisticsState = reconciliation.logisticsState;
      } catch (error) {
        if (!active) {
          return;
        }

        setSyncStatus({
          message: error?.message || LOCAL_ONLY_MESSAGE,
          tone: "error",
        });
      }

      logisticsStateRef.current = logisticsState;
      if (googleMapsApiKey) {
        window.GOOGLE_MAPS_API_KEY = googleMapsApiKey;
      }

      try {
        scriptRef.current = await loadLegacyLogisticsScript();
      } catch (error) {
        if (!active) {
          return;
        }

        setSyncStatus({
          message: error?.message || "Unable to load the logistics workspace right now.",
          tone: "error",
        });
        return;
      }

      if (!active) {
        return;
      }

      hydrateLogisticsState(root, logisticsState, hydratingRef);
      persistState(false);

      const handleInput = (event) => {
        if (root.contains(event.target)) {
          persistState(true);
        }
      };
      const handleChange = (event) => {
        if (root.contains(event.target)) {
          persistState(true);
        }
      };
      const handleClick = (event) => {
        if (
          event.target.closest("#add-itinerary-stop") ||
          event.target.closest("#add-custom-event") ||
          event.target.closest("[data-action='remove-stop']") ||
          event.target.closest("[data-action='remove-custom']") ||
          event.target.closest("[data-action='move-stop-up']") ||
          event.target.closest("[data-action='move-stop-down']") ||
          event.target.closest("[data-action='clear-event']")
        ) {
          window.setTimeout(() => persistState(true), 0);
        }
      };

      root.addEventListener("input", handleInput);
      root.addEventListener("change", handleChange);
      root.addEventListener("click", handleClick);
      removePersistenceListeners = () => {
        root.removeEventListener("input", handleInput);
        root.removeEventListener("change", handleChange);
        root.removeEventListener("click", handleClick);
      };
    };

    void initialize();

    return () => {
      active = false;
      removePersistenceListeners();
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
      if (scriptRef.current?.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
      scriptRef.current = null;
    };
  }, [googleMapsApiKey, status, user]);

  if (status === "loading") {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">Move Logistics</p>
          <h2>Loading your logistics workspace</h2>
          <p className="signup-page-status" aria-live="polite">
            {LOADING_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">Move Logistics</p>
          <h2>Logistics access is unavailable</h2>
          <p className="signup-page-status" data-tone="error" aria-live="polite">
            {errorMessage || LOCAL_ONLY_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">Move Logistics</p>
          <h2>Redirecting to sign in</h2>
          <p className="signup-page-status" aria-live="polite">
            {REDIRECT_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="native-logistics-shell">
        {syncStatus.message ? (
          <p className="auth-status native-logistics-status" data-tone={syncStatus.tone} aria-live="polite">
            {syncStatus.message}
          </p>
        ) : null}
        <div ref={contentRef} dangerouslySetInnerHTML={{ __html: legacyLogisticsHtml }} />
      </div>
    </main>
  );
}

export function LogisticsHeading() {
  const { displayName } = useNativeAuth();
  const possessiveName = getPossessiveFirstName(displayName);
  const heading = possessiveName ? `${possessiveName} Move Logistics` : "Move Logistics";

  return <h1>{heading}</h1>;
}
