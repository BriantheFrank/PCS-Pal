"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  loadChecklistState,
  pushChecklist,
  reconcileChecklistWithRemote,
  saveChecklistState,
} from "@/checklist-data";
import { useNativeAuth } from "@/components/auth/native-auth-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

const SYNC_DELAY_MS = 600;

const LOADING_MESSAGE = "Loading your checklist.";
const REDIRECT_MESSAGE = "Redirecting to sign in so you can open your checklist.";
const LOCAL_ONLY_MESSAGE =
  "Cloud checklist sync is unavailable right now. Progress will stay on this device.";

const areSubtasksComplete = (item) => {
  const subtasks = Array.from(item.querySelectorAll(".sub-checklist input[type='checkbox']"));
  if (!subtasks.length) {
    return false;
  }

  return subtasks.every((subtask) => subtask.checked);
};

const syncParentCheckboxState = (item) => {
  const parentCheckbox = item.querySelector("input[type='checkbox'][data-role='parent']");
  if (!parentCheckbox) {
    return;
  }

  const isComplete = areSubtasksComplete(item);
  parentCheckbox.checked = isComplete;
  item.classList.toggle("is-complete", isComplete);
};

const setAccordionState = (item, isOpen) => {
  const details = item.querySelector(".item-details");
  const header = item.querySelector(".item-header");
  const toggle = item.querySelector(".accordion-toggle");
  if (!details || !header || !toggle) {
    return;
  }

  item.classList.toggle("is-open", isOpen);
  details.setAttribute("aria-hidden", String(!isOpen));
  header.setAttribute("aria-expanded", String(isOpen));
  toggle.setAttribute("aria-expanded", String(isOpen));
};

const applyChecklistStateToDom = (root, checklistState) => {
  Array.from(root.querySelectorAll("input[type='checkbox'][data-id]")).forEach((checkbox) => {
    if (checkbox.dataset.role === "parent") {
      return;
    }

    checkbox.checked = Boolean(checklistState[checkbox.dataset.id]);
  });

  Array.from(root.querySelectorAll(".checklist-item")).forEach((item) => {
    syncParentCheckboxState(item);
    setAccordionState(item, item.classList.contains("is-open"));
  });
};

const getPossessiveFirstName = (displayName) => {
  const firstName = String(displayName || "")
    .split(/\s+/)
    .filter(Boolean)[0];

  if (!firstName) {
    return "";
  }

  return firstName.endsWith("s") ? `${firstName}'` : `${firstName}'s`;
};

export function NativeChecklistPage({ legacyChecklistHtml }) {
  const router = useRouter();
  const { status, user, errorMessage } = useNativeAuth();
  const contentRef = useRef(null);
  const checklistStateRef = useRef({});
  const syncTimerRef = useRef(null);
  const [syncStatus, setSyncStatus] = useState({
    message: "",
    tone: "neutral",
  });

  useEffect(() => {
    if (status === "ready" && !user) {
      router.replace("/sign-in?next=/checklist");
    }
  }, [router, status, user]);

  useEffect(() => {
    if (status !== "ready" || !user || !contentRef.current || typeof window === "undefined") {
      return undefined;
    }

    let active = true;
    const root = contentRef.current;
    const storage = window.localStorage;
    checklistStateRef.current = loadChecklistState(storage);
    applyChecklistStateToDom(root, checklistStateRef.current);

    const flushRemoteSync = async () => {
      try {
        const supabase = await getBrowserSupabaseClient();
        await pushChecklist({
          supabase,
          userId: user.id,
          checklistState: checklistStateRef.current,
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

    const initializeChecklist = async () => {
      try {
        const supabase = await getBrowserSupabaseClient();
        const reconciliation = await reconcileChecklistWithRemote({
          supabase,
          storage,
          userId: user.id,
        });

        if (!active) {
          return;
        }

        checklistStateRef.current = reconciliation.checklistState;
        applyChecklistStateToDom(root, reconciliation.checklistState);
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

    const handleClick = (event) => {
      const header = event.target.closest(".item-header");
      if (!header || !root.contains(header) || event.target.closest("a")) {
        return;
      }

      const item = header.closest(".checklist-item");
      if (!item) {
        return;
      }

      setAccordionState(item, !item.classList.contains("is-open"));
    };

    const handleKeyDown = (event) => {
      const header = event.target.closest(".item-header");
      if (!header || !root.contains(header)) {
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      const item = header.closest(".checklist-item");
      if (!item) {
        return;
      }

      setAccordionState(item, !item.classList.contains("is-open"));
    };

    const handleChange = (event) => {
      const checkbox = event.target;
      if (!(checkbox instanceof HTMLInputElement)) {
        return;
      }

      if (!checkbox.matches("input[type='checkbox'][data-id]") || checkbox.dataset.role === "parent") {
        return;
      }

      checklistStateRef.current = {
        ...checklistStateRef.current,
        [checkbox.dataset.id]: checkbox.checked,
      };
      saveChecklistState(storage, checklistStateRef.current);

      const item = checkbox.closest(".checklist-item");
      if (item) {
        syncParentCheckboxState(item);
      }

      scheduleRemoteSync();
    };

    root.addEventListener("click", handleClick);
    root.addEventListener("keydown", handleKeyDown);
    root.addEventListener("change", handleChange);

    void initializeChecklist();

    return () => {
      active = false;
      root.removeEventListener("click", handleClick);
      root.removeEventListener("keydown", handleKeyDown);
      root.removeEventListener("change", handleChange);
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [status, user]);

  if (status === "loading") {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">PCS Checklist</p>
          <h2>Loading your checklist</h2>
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
          <p className="eyebrow">PCS Checklist</p>
          <h2>Checklist access is unavailable</h2>
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
          <p className="eyebrow">PCS Checklist</p>
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
      <div className="native-checklist-shell">
        {syncStatus.message ? (
          <p className="auth-status native-checklist-status" data-tone={syncStatus.tone} aria-live="polite">
            {syncStatus.message}
          </p>
        ) : null}
        <div ref={contentRef} dangerouslySetInnerHTML={{ __html: legacyChecklistHtml }} />
      </div>
    </main>
  );
}

export function ChecklistHeading() {
  const { displayName } = useNativeAuth();
  const possessiveName = getPossessiveFirstName(displayName);
  const heading = possessiveName ? `${possessiveName} PCS Move Checklist` : "PCS Move Checklist";

  return <h1>{heading}</h1>;
}
