"use client";

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

const LOADING_MESSAGE = "Opening your checklist";
const REDIRECT_MESSAGE = "Sign in to track your progress.";
const LOCAL_ONLY_MESSAGE =
  "We could not load your saved move information right now. Please refresh and try again.";

const initialStatus = {
  message: "",
  tone: "neutral",
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

const buildInitialOpenState = (sections = []) =>
  Object.fromEntries(
    sections.flatMap((section) => section.items.map((item) => [item.id, false]))
  );

const isChecklistItemComplete = (item, checklistState) =>
  item.subtasks.length > 0 &&
  item.subtasks.every((subtask) => Boolean(checklistState[subtask.id]));

function ChecklistItem({ item, isOpen, checklistState, onToggleOpen, onToggleSubtask, canEdit }) {
  const isComplete = isChecklistItemComplete(item, checklistState);

  return (
    <div
      className={`checklist-item${isOpen ? " is-open" : ""}${isComplete ? " is-complete" : ""}`}
      data-item={item.id}
    >
      <div
        className="item-header"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={item.detailsId}
        onClick={(event) => {
          if (event.target.closest("a")) {
            return;
          }
          onToggleOpen(item.id);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }
          event.preventDefault();
          onToggleOpen(item.id);
        }}
      >
        <label className="item-parent">
          <input
            type="checkbox"
            data-id={item.parentId}
            data-role="parent"
            checked={isComplete}
            disabled
            readOnly
          />
          <span className="item-title">{item.title}</span>
        </label>
        <button
          className="accordion-toggle"
          type="button"
          aria-expanded={isOpen}
          aria-controls={item.detailsId}
          aria-label="Toggle details"
          onClick={(event) => {
            event.stopPropagation();
            onToggleOpen(item.id);
          }}
        >
          <span className="accordion-icon" aria-hidden="true">
            {"\u25BE"}
          </span>
        </button>
      </div>

      <div className="item-details item-help" id={item.detailsId} aria-hidden={String(!isOpen)}>
        {item.helpParagraphs.map((paragraph, index) => (
          <p key={`${item.id}-help-${index}`} dangerouslySetInnerHTML={{ __html: paragraph }} />
        ))}

        <ul className="sub-checklist">
          {item.subtasks.map((subtask) => (
            <li key={subtask.id}>
              <label>
                <input
                  type="checkbox"
                  data-id={subtask.id}
                  checked={Boolean(checklistState[subtask.id])}
                  disabled={!canEdit}
                  onChange={(event) => onToggleSubtask(subtask.id, event.target.checked)}
                />
                <span>{subtask.label}</span>
              </label>
            </li>
          ))}
        </ul>

        {item.tips.length ? (
          <ul className="item-tips">
            {item.tips.map((tip, index) => (
              <li key={`${item.id}-tip-${index}`} dangerouslySetInnerHTML={{ __html: tip }} />
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export function NativeChecklistPage({ pageData }) {
  const { status, user, errorMessage } = useNativeAuth();
  const checklistStateRef = useRef({});
  const syncTimerRef = useRef(null);
  const [checklistState, setChecklistState] = useState({});
  const [checklistReady, setChecklistReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState(initialStatus);
  const [openItems, setOpenItems] = useState(() => buildInitialOpenState(pageData.sections));

  useEffect(() => {
    checklistStateRef.current = checklistState;
  }, [checklistState]);

  useEffect(() => {
    if (status !== "ready" || !user || typeof window === "undefined") {
      if (status !== "ready") {
        setChecklistReady(false);
      }
      return undefined;
    }

    let active = true;
    const storage = window.localStorage;
    const localChecklist = loadChecklistState(storage);
    checklistStateRef.current = localChecklist;
    setChecklistState(localChecklist);
    setChecklistReady(false);

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
        setChecklistState(reconciliation.checklistState);
        setSyncStatus(initialStatus);
      } catch (error) {
        if (!active) {
          return;
        }

        setSyncStatus({
          message: error?.message || LOCAL_ONLY_MESSAGE,
          tone: "error",
        });
      } finally {
        if (active) {
          setChecklistReady(true);
        }
      }
    };

    void initializeChecklist();

    return () => {
      active = false;
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [status, user]);

  const scheduleRemoteSync = () => {
    if (!user || typeof window === "undefined") {
      return;
    }

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }

    setSyncStatus({
      message: "Saving your checklist changes...",
      tone: "neutral",
    });

    syncTimerRef.current = window.setTimeout(async () => {
      try {
        const supabase = await getBrowserSupabaseClient();
        await pushChecklist({
          supabase,
          userId: user.id,
          checklistState: checklistStateRef.current,
        });

        setSyncStatus({
          message: "Checklist saved.",
          tone: "success",
        });
      } catch (error) {
        setSyncStatus({
          message: error?.message || LOCAL_ONLY_MESSAGE,
          tone: "error",
        });
      }
    }, SYNC_DELAY_MS);
  };

  const updateChecklistValue = (checklistKey, checked) => {
    const nextChecklistState = {
      ...checklistStateRef.current,
      [checklistKey]: checked,
    };

    checklistStateRef.current = nextChecklistState;
    setChecklistState(nextChecklistState);

    if (typeof window !== "undefined") {
      saveChecklistState(window.localStorage, nextChecklistState);
    }

    scheduleRemoteSync();
  };

  const toggleChecklistItem = (itemId) => {
    setOpenItems((current) => ({
      ...current,
      [itemId]: !current[itemId],
    }));
  };

  if (status === "loading" || (status === "ready" && user && !checklistReady)) {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">PCS Checklist</p>
          <h2>Opening your checklist</h2>
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
          <h2>We could not load your checklist</h2>
          <p className="signup-page-status" data-tone="error" aria-live="polite">
            {errorMessage || LOCAL_ONLY_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

  const canEdit = Boolean(user);

  return (
    <main className="container">
      <div className="native-checklist-shell">
        {!canEdit ? (
          <p className="auth-status native-checklist-status" aria-live="polite">{REDIRECT_MESSAGE}</p>
        ) : null}
        {syncStatus.message ? (
          <p className="auth-status native-checklist-status" data-tone={syncStatus.tone} aria-live="polite">
            {syncStatus.message}
          </p>
        ) : null}

        <div className="checklist-layout">
          <div className="checklist-main">
            {pageData.sections.map((section) => (
              <details className="checklist-section" data-section={section.id} key={section.id} open>
                <summary>
                  <h2>{section.title}</h2>
                </summary>
                <div className="checklist-section-body">
                  <p className="checklist-intro">{section.intro}</p>
                  {section.items.map((item) => (
                    <ChecklistItem
                      item={item}
                      isOpen={Boolean(openItems[item.id])}
                      checklistState={checklistState}
                      key={item.id}
                      canEdit={canEdit}
                      onToggleOpen={toggleChecklistItem}
                      onToggleSubtask={updateChecklistValue}
                    />
                  ))}
                </div>
              </details>
            ))}
          </div>

          {pageData.sidebar?.items?.length ? (
            <aside className="checklist-sidebar">
              <div className="sidebar-card">
                <h2>{pageData.sidebar.title}</h2>
                <button type="button" className="label-action secondary" onClick={() => window.print()}>
                  Print this block
                </button>
                <ul className="sidebar-list">
                  {pageData.sidebar.items.map((item, index) => (
                    <li key={`sidebar-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </aside>
          ) : null}
        </div>
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
