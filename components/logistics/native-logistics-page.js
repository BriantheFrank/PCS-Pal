"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";
import {
  loadLogisticsState,
  normalizeLogisticsState,
  pushLogistics,
  reconcileLogisticsWithRemote,
  saveLogisticsState,
} from "@/logistics-data";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

const SYNC_DELAY_MS = 600;

const LOADING_MESSAGE = "Loading your plans";
const REDIRECT_MESSAGE = "Opening sign-in";
const LOCAL_ONLY_MESSAGE =
  "We could not load your saved move information right now. Please refresh and try again.";
const ERROR_MESSAGE = "We could not load this section right now. Please refresh and try again. If the problem continues, use the contact page to let us know.";

const initialStatus = {
  message: "",
  tone: "neutral",
};

const CONTACT_FIELDS = [
  { key: "contact-name", label: "Name", type: "text" },
  { key: "contact-company", label: "Company (if applicable)", type: "text" },
  { key: "contact-phone", label: "Phone number", type: "tel" },
  { key: "contact-email", label: "Email address", type: "email" },
];

const STANDARD_EVENT_FIELDS = [
  { key: "location", label: "Location", type: "text" },
  { key: "date", label: "Date", type: "date" },
  { key: "time", label: "Time", type: "time" },
  { key: "notes", label: "Notes (optional)", type: "textarea", rows: 2 },
];

const PACKERS_EVENT_FIELDS = [
  { key: "location", label: "Location", type: "text" },
  { key: "packers-start-date", label: "Start date", type: "date" },
  { key: "packers-end-date", label: "End date", type: "date" },
  { key: "notes", label: "Notes (optional)", type: "textarea", rows: 2 },
];

const EVENT_SECTIONS = [
  {
    id: "move-consult",
    title: "Move Consult",
    intro:
      "Record the consultation that kicks off your move planning and sets expectations for the timeline.",
    groups: [
      { title: "Contact Information", fields: CONTACT_FIELDS },
      { title: "Event Details", fields: STANDARD_EVENT_FIELDS },
    ],
    calendarHint: "Add a date and time to place this event on the master timeline.",
  },
  {
    id: "packers",
    title: "Packers",
    intro:
      "Use this section to track the team packing your household items and confirm their arrival window.",
    groups: [
      { title: "Contact Information", fields: CONTACT_FIELDS },
      { title: "Event Details", fields: PACKERS_EVENT_FIELDS },
    ],
    calendarHint:
      "Choose a start date and optional end date to place this event on the master timeline.",
  },
  {
    id: "load-truck",
    title: "Load Truck",
    intro:
      "Capture the date and arrival time for the truck or crew loading your household items.",
    groups: [
      { title: "Contact Information", fields: CONTACT_FIELDS },
      { title: "Event Details", fields: STANDARD_EVENT_FIELDS },
    ],
    calendarHint: "Add a date and time to place this event on the master timeline.",
  },
  {
    id: "household-goods-delivery",
    title: "Household Goods Delivery at Destination",
    intro:
      "Track delivery at your destination and keep the receiving contact details in one place.",
    groups: [
      { title: "Contact Information", fields: CONTACT_FIELDS },
      { title: "Event Details", fields: STANDARD_EVENT_FIELDS },
    ],
    calendarHint: "Add a date and time to place this event on the master timeline.",
  },
];

const cloneLogisticsState = (logisticsState) => {
  if (typeof structuredClone === "function") {
    return structuredClone(logisticsState);
  }

  return JSON.parse(JSON.stringify(logisticsState || {}));
};

const stampLogisticsState = (logisticsState) =>
  normalizeLogisticsState({
    ...cloneLogisticsState(logisticsState),
    updatedAt: new Date().toISOString(),
  });

const normalizeText = (value) => String(value ?? "").trim();

const getPossessiveFirstName = (displayName) => {
  const firstName = String(displayName || "")
    .split(/\s+/)
    .filter(Boolean)[0];

  if (!firstName) {
    return "";
  }

  return firstName.endsWith("s") ? `${firstName}'` : `${firstName}'s`;
};

const formatDateLabel = (value) => {
  const dateValue = normalizeText(value);
  if (!dateValue) {
    return "";
  }

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatTimeLabel = (value) => {
  const timeValue = normalizeText(value);
  if (!timeValue) {
    return "All day";
  }

  const date = new Date(`2000-01-01T${timeValue}`);
  if (Number.isNaN(date.getTime())) {
    return timeValue;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatDateTimeLabel = (dateValue, timeValue) => {
  const formattedDate = formatDateLabel(dateValue);
  if (!formattedDate) {
    return "Not scheduled yet";
  }

  const normalizedTime = normalizeText(timeValue);
  if (!normalizedTime) {
    return `${formattedDate} - All day`;
  }

  return `${formattedDate} - ${formatTimeLabel(normalizedTime)}`;
};

const formatRangeLabel = (startDateValue, endDateValue) => {
  const startDate = formatDateLabel(startDateValue);
  const endDate = formatDateLabel(endDateValue);

  if (startDate && endDate && startDate !== endDate) {
    return `${startDate} - ${endDate}`;
  }

  return startDate || endDate || "Not scheduled yet";
};

const getSortValue = (dateValue, timeValue = "") => {
  const normalizedDate = normalizeText(dateValue);
  if (!normalizedDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  const normalizedTime = normalizeText(timeValue) || "00:00";
  const timestamp = new Date(`${normalizedDate}T${normalizedTime}`).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

const buildPackersSummary = (sectionState) => {
  const startDate = normalizeText(sectionState["packers-start-date"]);
  const endDate = normalizeText(sectionState["packers-end-date"]);

  if (startDate && endDate && startDate !== endDate) {
    return `Packers scheduled from ${formatDateLabel(startDate)} through ${formatDateLabel(endDate)}.`;
  }

  if (startDate) {
    return `Packers scheduled on ${formatDateLabel(startDate)}.`;
  }

  return "Choose a start date to place this event on the master timeline.";
};

const buildTimelineEntries = (logisticsState) => {
  const entries = [];

  EVENT_SECTIONS.forEach((section) => {
    const sectionState = logisticsState.sections?.[section.id] || {};

    if (section.id === "packers") {
      const startDate = normalizeText(sectionState["packers-start-date"]);
      if (startDate) {
        entries.push({
          key: `section-${section.id}`,
          title: section.title,
          when: formatRangeLabel(startDate, sectionState["packers-end-date"]),
          meta: normalizeText(sectionState.location) || "Location not set",
          notes: normalizeText(sectionState.notes),
          sortValue: getSortValue(startDate),
        });
      }
      return;
    }

    const dateValue = normalizeText(sectionState.date);
    if (!dateValue) {
      return;
    }

    entries.push({
      key: `section-${section.id}`,
      title: section.title,
      when: formatDateTimeLabel(sectionState.date, sectionState.time),
      meta: normalizeText(sectionState.location) || "Location not set",
      notes: normalizeText(sectionState.notes),
      sortValue: getSortValue(sectionState.date, sectionState.time),
    });
  });

  const itinerarySection = logisticsState.sections?.["family-itinerary"] || {};
  if (normalizeText(itinerarySection["itinerary-start-date"])) {
    entries.push({
      key: "itinerary-start",
      title: "Family departure",
      when: formatRangeLabel(itinerarySection["itinerary-start-date"]),
      meta: normalizeText(itinerarySection["itinerary-start-location"]) || "Departure location not set",
      notes: "Trip begins",
      sortValue: getSortValue(itinerarySection["itinerary-start-date"]),
    });
  }

  (logisticsState.itineraryStops || []).forEach((stop, index) => {
    const stopDate = normalizeText(stop["stop-date"]);
    if (!stopDate) {
      return;
    }

    entries.push({
      key: stop.id || `stop-${index}`,
      title: `Overnight stop ${index + 1}`,
      when: formatRangeLabel(stopDate),
      meta: normalizeText(stop["stop-city"]) || "Stop location not set",
      notes: normalizeText(stop["stop-lodging"]),
      sortValue: getSortValue(stopDate),
    });
  });

  if (normalizeText(itinerarySection["itinerary-end-date"])) {
    entries.push({
      key: "itinerary-end",
      title: "Family arrival",
      when: formatRangeLabel(itinerarySection["itinerary-end-date"]),
      meta: normalizeText(itinerarySection["itinerary-end-location"]) || "Arrival location not set",
      notes: "Trip ends",
      sortValue: getSortValue(itinerarySection["itinerary-end-date"]),
    });
  }

  (logisticsState.customEvents || []).forEach((event, index) => {
    const startDate = normalizeText(event["custom-start-date"]);
    if (!startDate) {
      return;
    }

    entries.push({
      key: event.id || `custom-${index}`,
      title: normalizeText(event["custom-title"]) || "Custom event",
      when: formatRangeLabel(startDate, event["custom-end-date"]),
      meta: normalizeText(event["custom-address"]) || "Location not set",
      notes: normalizeText(event["custom-notes"]),
      sortValue: getSortValue(startDate),
    });
  });

  return entries.sort((left, right) => left.sortValue - right.sortValue);
};

const buildGoogleMapsDirectionsHref = (itinerarySection, itineraryStops) => {
  const origin = normalizeText(itinerarySection["itinerary-start-location"]);
  const destination = normalizeText(itinerarySection["itinerary-end-location"]);

  if (!origin || !destination) {
    return "";
  }

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
  });

  const waypoints = (itineraryStops || [])
    .map((stop) => normalizeText(stop["stop-city"]))
    .filter(Boolean)
    .join("|");

  if (waypoints) {
    params.set("waypoints", waypoints);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

const makeItemId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const toDateKey = (value) => {
  const dateValue = normalizeText(value);
  if (!dateValue) {
    return "";
  }

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const expandDateKeys = (startValue, endValue) => {
  const startKey = toDateKey(startValue);
  if (!startKey) {
    return [];
  }

  const endKey = toDateKey(endValue) || startKey;
  const start = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${endKey}T00:00:00`);
  const last = end.getTime() >= start.getTime() ? end : start;

  const keys = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= last.getTime()) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    keys.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
};

const buildCalendarEvents = (logisticsState) => {
  const events = [];

  EVENT_SECTIONS.forEach((section) => {
    const sectionState = logisticsState.sections?.[section.id] || {};
    if (section.id === "packers") {
      expandDateKeys(sectionState["packers-start-date"], sectionState["packers-end-date"]).forEach((dateKey) => {
        events.push({
          key: `${section.id}-${dateKey}`,
          dateKey,
          title: section.title,
        });
      });
      return;
    }

    const dateKey = toDateKey(sectionState.date);
    if (!dateKey) {
      return;
    }

    events.push({
      key: `${section.id}-${dateKey}`,
      dateKey,
      title: section.title,
    });
  });

  const itinerarySection = logisticsState.sections?.["family-itinerary"] || {};
  const itineraryStart = toDateKey(itinerarySection["itinerary-start-date"]);
  if (itineraryStart) {
    events.push({ key: `itinerary-start-${itineraryStart}`, dateKey: itineraryStart, title: "Family departure" });
  }

  const itineraryEnd = toDateKey(itinerarySection["itinerary-end-date"]);
  if (itineraryEnd) {
    events.push({ key: `itinerary-end-${itineraryEnd}`, dateKey: itineraryEnd, title: "Family arrival" });
  }

  (logisticsState.itineraryStops || []).forEach((stop, index) => {
    const dateKey = toDateKey(stop["stop-date"]);
    if (!dateKey) {
      return;
    }

    events.push({
      key: `${stop.id || `stop-${index}`}-${dateKey}`,
      dateKey,
      title: `Overnight stop ${index + 1}`,
    });
  });

  (logisticsState.customEvents || []).forEach((event, index) => {
    expandDateKeys(event["custom-start-date"], event["custom-end-date"]).forEach((dateKey) => {
      events.push({
        key: `${event.id || `custom-${index}`}-${dateKey}`,
        dateKey,
        title: normalizeText(event["custom-title"]) || "Custom event",
      });
    });
  });

  return events;
};

const buildCalendarMonthDays = (monthStartDate) => {
  const monthStart = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, offset) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return {
      date,
      dateKey: `${year}-${month}-${day}`,
      inMonth: date.getMonth() === monthStart.getMonth(),
    };
  });
};

function LogisticsField({ field, value, onChange }) {
  if (field.type === "textarea") {
    return (
      <label className="logistics-field">
        {field.label}
        <textarea rows={field.rows || 2} value={value} onChange={(event) => onChange(event.target.value)}></textarea>
      </label>
    );
  }

  return (
    <label className="logistics-field">
      {field.label}
      <input type={field.type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function LogisticsHeading() {
  const { displayName } = useNativeAuth();
  const possessiveName = getPossessiveFirstName(displayName);
  const heading = possessiveName ? `${possessiveName} Move Logistics` : "Move Logistics";

  return <h1>{heading}</h1>;
}

export function NativeLogisticsPage() {
  const router = useRouter();
  const { status, user, errorMessage } = useNativeAuth();
  const [logisticsState, setLogisticsState] = useState(() => normalizeLogisticsState({}));
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState(initialStatus);
  const [visibleMonthStart, setVisibleMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const logisticsRef = useRef(logisticsState);
  const syncTimerRef = useRef(null);

  useEffect(() => {
    logisticsRef.current = logisticsState;
  }, [logisticsState]);

  useEffect(() => {
    if (status === "ready" && !user) {
      router.replace("/sign-in?next=/logistics");
    }
  }, [router, status, user]);

  useEffect(() => {
    if (status !== "ready" || !user || typeof window === "undefined") {
      if (status !== "ready") {
        setWorkspaceReady(false);
      }
      return undefined;
    }

    let active = true;
    const storage = window.localStorage;
    const localState = loadLogisticsState(storage);
    logisticsRef.current = localState;
    setLogisticsState(localState);
    setWorkspaceReady(false);

    const initialize = async () => {
      try {
        const supabase = await getBrowserSupabaseClient();
        const reconciliation = await reconcileLogisticsWithRemote({
          supabase,
          storage,
          userId: user.id,
        });

        if (!active) {
          return;
        }

        logisticsRef.current = reconciliation.logisticsState;
        setLogisticsState(reconciliation.logisticsState);
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
          setWorkspaceReady(true);
        }
      }
    };

    void initialize();

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
      message: "Saving changes and syncing logistics to your account...",
      tone: "neutral",
    });

    syncTimerRef.current = window.setTimeout(async () => {
      try {
        const supabase = await getBrowserSupabaseClient();
        await pushLogistics({
          supabase,
          userId: user.id,
          logisticsState: logisticsRef.current,
        });
        setSyncStatus({
          message: "Logistics synced.",
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

  const commitLogistics = (nextState) => {
    const normalizedState = stampLogisticsState(nextState);
    logisticsRef.current = normalizedState;
    setLogisticsState(normalizedState);

    if (typeof window !== "undefined") {
      saveLogisticsState(window.localStorage, normalizedState);
    }

    scheduleRemoteSync();
  };

  const updateSectionField = (sectionId, fieldKey, value) => {
    const nextState = cloneLogisticsState(logisticsRef.current);
    nextState.sections = nextState.sections || {};
    nextState.sections[sectionId] = {
      ...(nextState.sections[sectionId] || {}),
      [fieldKey]: value,
    };
    commitLogistics(nextState);
  };

  const clearSectionCalendar = (sectionId) => {
    const nextState = cloneLogisticsState(logisticsRef.current);
    nextState.sections = nextState.sections || {};
    const nextSection = {
      ...(nextState.sections[sectionId] || {}),
    };

    if (sectionId === "packers") {
      nextSection["packers-start-date"] = "";
      nextSection["packers-end-date"] = "";
    } else {
      nextSection.date = "";
      nextSection.time = "";
    }

    nextState.sections[sectionId] = nextSection;
    commitLogistics(nextState);
  };

  const addItineraryStop = () => {
    const nextState = cloneLogisticsState(logisticsRef.current);
    nextState.itineraryStops = Array.isArray(nextState.itineraryStops) ? nextState.itineraryStops : [];
    nextState.itineraryStops.push({
      id: makeItemId("stop"),
      "stop-city": "",
      "stop-date": "",
      "stop-lodging": "",
      "stop-address": "",
      "stop-phone": "",
    });
    commitLogistics(nextState);
  };

  const updateItineraryStop = (stopIndex, fieldKey, value) => {
    const nextState = cloneLogisticsState(logisticsRef.current);
    nextState.itineraryStops = Array.isArray(nextState.itineraryStops) ? nextState.itineraryStops : [];
    nextState.itineraryStops[stopIndex] = {
      ...(nextState.itineraryStops[stopIndex] || {}),
      [fieldKey]: value,
    };
    commitLogistics(nextState);
  };

  const moveItineraryStop = (stopIndex, direction) => {
    const nextState = cloneLogisticsState(logisticsRef.current);
    nextState.itineraryStops = Array.isArray(nextState.itineraryStops) ? nextState.itineraryStops : [];
    const targetIndex = stopIndex + direction;

    if (targetIndex < 0 || targetIndex >= nextState.itineraryStops.length) {
      return;
    }

    const nextStops = [...nextState.itineraryStops];
    const [stop] = nextStops.splice(stopIndex, 1);
    nextStops.splice(targetIndex, 0, stop);
    nextState.itineraryStops = nextStops;
    commitLogistics(nextState);
  };

  const removeItineraryStop = (stopIndex) => {
    const nextState = cloneLogisticsState(logisticsRef.current);
    nextState.itineraryStops = (nextState.itineraryStops || []).filter((_, index) => index !== stopIndex);
    commitLogistics(nextState);
  };

  const addCustomEvent = () => {
    const nextState = cloneLogisticsState(logisticsRef.current);
    nextState.customEvents = Array.isArray(nextState.customEvents) ? nextState.customEvents : [];
    nextState.customEvents.push({
      id: makeItemId("custom"),
      "custom-title": "",
      "custom-start-date": "",
      "custom-end-date": "",
      "custom-address": "",
      "custom-phone": "",
      "custom-contact": "",
      "custom-notes": "",
    });
    commitLogistics(nextState);
  };

  const updateCustomEvent = (eventIndex, fieldKey, value) => {
    const nextState = cloneLogisticsState(logisticsRef.current);
    nextState.customEvents = Array.isArray(nextState.customEvents) ? nextState.customEvents : [];
    nextState.customEvents[eventIndex] = {
      ...(nextState.customEvents[eventIndex] || {}),
      [fieldKey]: value,
    };
    commitLogistics(nextState);
  };

  const removeCustomEvent = (eventIndex) => {
    const nextState = cloneLogisticsState(logisticsRef.current);
    nextState.customEvents = (nextState.customEvents || []).filter((_, index) => index !== eventIndex);
    commitLogistics(nextState);
  };

  const calendarEvents = buildCalendarEvents(logisticsState);
  const eventsByDate = useMemo(() => {
    const grouped = new Map();
    calendarEvents.forEach((event) => {
      const existing = grouped.get(event.dateKey) || [];
      const alreadyListed = existing.some((current) => current.title === event.title);
      if (!alreadyListed) {
        existing.push(event);
      }
      grouped.set(event.dateKey, existing);
    });
    return grouped;
  }, [calendarEvents]);
  const visibleMonthLabel = MONTH_LABEL_FORMATTER.format(visibleMonthStart);
  const monthDays = buildCalendarMonthDays(visibleMonthStart);
  const todayDateKey = toDateKey(new Date().toISOString().slice(0, 10));

  if (status === "loading" || (status === "ready" && user && !workspaceReady)) {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">Move Logistics</p>
          <h2>Loading your plans</h2>
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
          <h2>We could not load your logistics plan</h2>
          <p className="signup-page-status" data-tone="error" aria-live="polite">
            {errorMessage || ERROR_MESSAGE}
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

  const itinerarySection = logisticsState.sections?.["family-itinerary"] || {};
  const packersSection = logisticsState.sections?.packers || {};
  const timelineEntries = buildTimelineEntries(logisticsState);
  const directionsHref = buildGoogleMapsDirectionsHref(itinerarySection, logisticsState.itineraryStops);

  return (
    <main className="container logistics-layout">
      <section className="info-panel calendar-panel">
        <p className="eyebrow">Master Calendar</p>
        <h2>Move logistics monthly view</h2>
        <p>Every dated move-plan item appears here. Calendar cells only show event type names to reduce clutter.</p>
        <div className="calendar-toolbar">
          <div className="calendar-meta">
            <h3>{visibleMonthLabel}</h3>
          </div>
          <div className="calendar-nav">
            <button
              type="button"
              className="calendar-nav-button"
              onClick={() =>
                setVisibleMonthStart(
                  (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
              }
            >
              Previous
            </button>
            <button
              type="button"
              className="calendar-nav-button"
              onClick={() => {
                const now = new Date();
                setVisibleMonthStart(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
            >
              Current month
            </button>
            <button
              type="button"
              className="calendar-nav-button"
              onClick={() =>
                setVisibleMonthStart(
                  (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
              }
            >
              Next
            </button>
          </div>
        </div>
        <div className="calendar-grid" role="grid" aria-label={`Move logistics events for ${visibleMonthLabel}`}>
          {monthDays.map((day) => {
            const dayEvents = eventsByDate.get(day.dateKey) || [];
            const visibleEvents = dayEvents.slice(0, 3);
            const remainingCount = dayEvents.length - visibleEvents.length;

            return (
              <article
                className={`calendar-day${day.inMonth ? "" : " is-outside"}${day.dateKey === todayDateKey ? " is-today" : ""}`}
                key={day.dateKey}
                role="gridcell"
              >
                <div className="calendar-day-header">
                  <span>{WEEKDAY_LABELS[day.date.getDay()]}</span>
                  <strong>{day.date.getDate()}</strong>
                </div>
                <div className="calendar-events">
                  {visibleEvents.map((entry) => (
                    <p className="calendar-event" key={entry.key}>
                      <span className="calendar-event-title">{entry.title}</span>
                    </p>
                  ))}
                  {remainingCount > 0 ? <p className="calendar-event-meta">+{remainingCount} more</p> : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="info-panel organizer-native-note">
        <p className="eyebrow">Move Logistics</p>
        <h2>Centralize dates, contacts, and travel plans</h2>
        <p>
          This workspace is built for real move coordination: travel windows, temporary lodging,
          arrival timing, and first-week priorities that affect your family immediately.
        </p>
        <p className="signup-page-status" data-tone={syncStatus.tone} aria-live="polite">
          {syncStatus.message || "Changes save automatically so you can pick up planning later."}
        </p>
        <p>
          <a className="card-link" href="/organizer">
            Back to organizer -&gt;
          </a>
        </p>
        <div className="inventory-item-actions">
          <a className="label-action" href="#event-move-consult">
            Add event
          </a>
          <a className="label-action secondary" href="#event-custom-events">
            Add custom event
          </a>
        </div>
      </section>

      <section className="logistics-accordion" aria-label="Move logistics events" id="event-planner">
        {EVENT_SECTIONS.map((section) => {
          const sectionState = logisticsState.sections?.[section.id] || {};
          return (
            <details
              className="checklist-section logistics-section"
              data-event-id={section.id}
              key={section.id}
              id={`event-${section.id}`}
              open
            >
              <summary>
                <h2>{section.title}</h2>
              </summary>
              <div className="checklist-section-body logistics-section-body">
                <p className="checklist-intro">{section.intro}</p>
                <div className="logistics-form">
                  {section.groups.map((group) => (
                    <div className="logistics-group" key={`${section.id}-${group.title}`}>
                      <h3>{group.title}</h3>
                      <div className="logistics-field-grid">
                        {group.fields.map((field) => (
                          <LogisticsField
                            field={field}
                            key={`${section.id}-${field.key}`}
                            value={sectionState[field.key] || ""}
                            onChange={(value) => updateSectionField(section.id, field.key, value)}
                          />
                        ))}
                      </div>
                      {section.id === "packers" && group.title === "Event Details" ? (
                        <p className="logistics-summary">{buildPackersSummary(packersSection)}</p>
                      ) : null}
                    </div>
                  ))}
                  <div className="logistics-group">
                    <h3>Calendar Integration</h3>
                    <p className="logistics-hint">{section.calendarHint}</p>
                    <button
                      type="button"
                      className="label-action secondary"
                      onClick={() => clearSectionCalendar(section.id)}
                    >
                      Clear event from timeline
                    </button>
                  </div>
                </div>
              </div>
            </details>
          );
        })}

        <details className="checklist-section logistics-section" data-event-id="family-itinerary" id="event-family-itinerary" open>
          <summary>
            <h2>Family Itinerary During the Move</h2>
          </summary>
          <div className="checklist-section-body logistics-section-body">
            <p className="checklist-intro">
              Capture the overall travel plan and log each overnight stop so the whole family knows where to be and when.
            </p>
            <div className="logistics-form">
              <div className="logistics-group">
                <h3>Start Location</h3>
                <div className="logistics-field-grid">
                  <LogisticsField
                    field={{ key: "itinerary-start-location", label: "Location name", type: "text" }}
                    value={itinerarySection["itinerary-start-location"] || ""}
                    onChange={(value) => updateSectionField("family-itinerary", "itinerary-start-location", value)}
                  />
                  <LogisticsField
                    field={{ key: "itinerary-start-date", label: "Departure date", type: "date" }}
                    value={itinerarySection["itinerary-start-date"] || ""}
                    onChange={(value) => updateSectionField("family-itinerary", "itinerary-start-date", value)}
                  />
                </div>
              </div>

              <div className="logistics-group">
                <h3>End Location</h3>
                <div className="logistics-field-grid">
                  <LogisticsField
                    field={{ key: "itinerary-end-location", label: "Location name", type: "text" }}
                    value={itinerarySection["itinerary-end-location"] || ""}
                    onChange={(value) => updateSectionField("family-itinerary", "itinerary-end-location", value)}
                  />
                  <LogisticsField
                    field={{ key: "itinerary-end-date", label: "Arrival date", type: "date" }}
                    value={itinerarySection["itinerary-end-date"] || ""}
                    onChange={(value) => updateSectionField("family-itinerary", "itinerary-end-date", value)}
                  />
                </div>
              </div>

              <div className="logistics-group itinerary-group">
                <h3>Itinerary Stops</h3>
                <p className="logistics-hint">
                  Add one stop per overnight stay. Each stop is added to the master timeline automatically.
                </p>
                <div className="itinerary-stops" id="itinerary-stops">
                  {(logisticsState.itineraryStops || []).map((stop, index) => (
                    <div className="itinerary-stop" key={stop.id || `stop-${index}`}>
                      <div className="itinerary-stop-header">
                        <h4>Overnight Stop {index + 1}</h4>
                        <div className="itinerary-stop-actions">
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => moveItineraryStop(index, -1)}
                            disabled={index === 0}
                          >
                            Move up
                          </button>
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => moveItineraryStop(index, 1)}
                            disabled={index === logisticsState.itineraryStops.length - 1}
                          >
                            Move down
                          </button>
                          <button type="button" className="link-button" onClick={() => removeItineraryStop(index)}>
                            Remove stop
                          </button>
                        </div>
                      </div>
                      <div className="logistics-field-grid">
                        <LogisticsField
                          field={{ key: "stop-city", label: "City / Location", type: "text" }}
                          value={stop["stop-city"] || ""}
                          onChange={(value) => updateItineraryStop(index, "stop-city", value)}
                        />
                        <LogisticsField
                          field={{ key: "stop-date", label: "Arrival date", type: "date" }}
                          value={stop["stop-date"] || ""}
                          onChange={(value) => updateItineraryStop(index, "stop-date", value)}
                        />
                      </div>
                      <details className="logistics-details">
                        <summary>Lodging details (optional)</summary>
                        <div className="logistics-field-grid">
                          <LogisticsField
                            field={{ key: "stop-lodging", label: "Lodging name", type: "text" }}
                            value={stop["stop-lodging"] || ""}
                            onChange={(value) => updateItineraryStop(index, "stop-lodging", value)}
                          />
                          <LogisticsField
                            field={{ key: "stop-address", label: "Street address", type: "text" }}
                            value={stop["stop-address"] || ""}
                            onChange={(value) => updateItineraryStop(index, "stop-address", value)}
                          />
                          <LogisticsField
                            field={{ key: "stop-phone", label: "Phone number", type: "tel" }}
                            value={stop["stop-phone"] || ""}
                            onChange={(value) => updateItineraryStop(index, "stop-phone", value)}
                          />
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
                <button type="button" className="label-action" onClick={addItineraryStop}>
                  Add overnight stop
                </button>
              </div>
            </div>
          </div>
        </details>

        <details className="checklist-section logistics-section" data-event-id="custom-events" id="event-custom-events" open>
          <summary>
            <h2>Custom Events</h2>
          </summary>
          <div className="checklist-section-body logistics-section-body">
            <p className="checklist-intro">
              Add personal move-related events that are not tied to the itinerary, such as school tours,
              housing appointments, or temporary storage.
            </p>
            <div className="logistics-form">
              <div className="logistics-group">
                <h3>Custom Event List</h3>
                <p className="logistics-hint">
                  Each custom event appears on the master timeline as an all-day entry. Add an end date to show a date range.
                </p>
                <div className="custom-events" id="custom-events">
                  {(logisticsState.customEvents || []).map((event, index) => (
                    <div className="itinerary-stop custom-event" key={event.id || `custom-${index}`}>
                      <div className="itinerary-stop-header">
                        <h4>Custom Event {index + 1}</h4>
                        <button type="button" className="link-button" onClick={() => removeCustomEvent(index)}>
                          Remove event
                        </button>
                      </div>
                      <div className="logistics-field-grid">
                        <LogisticsField
                          field={{ key: "custom-title", label: "Event title", type: "text" }}
                          value={event["custom-title"] || ""}
                          onChange={(value) => updateCustomEvent(index, "custom-title", value)}
                        />
                        <LogisticsField
                          field={{ key: "custom-start-date", label: "Start date", type: "date" }}
                          value={event["custom-start-date"] || ""}
                          onChange={(value) => updateCustomEvent(index, "custom-start-date", value)}
                        />
                        <LogisticsField
                          field={{ key: "custom-end-date", label: "End date (optional)", type: "date" }}
                          value={event["custom-end-date"] || ""}
                          onChange={(value) => updateCustomEvent(index, "custom-end-date", value)}
                        />
                      </div>
                      <details className="logistics-details">
                        <summary>Optional details</summary>
                        <div className="logistics-field-grid">
                          <LogisticsField
                            field={{ key: "custom-address", label: "Address", type: "text" }}
                            value={event["custom-address"] || ""}
                            onChange={(value) => updateCustomEvent(index, "custom-address", value)}
                          />
                          <LogisticsField
                            field={{ key: "custom-phone", label: "Phone number", type: "tel" }}
                            value={event["custom-phone"] || ""}
                            onChange={(value) => updateCustomEvent(index, "custom-phone", value)}
                          />
                          <LogisticsField
                            field={{ key: "custom-contact", label: "Contact name", type: "text" }}
                            value={event["custom-contact"] || ""}
                            onChange={(value) => updateCustomEvent(index, "custom-contact", value)}
                          />
                          <LogisticsField
                            field={{ key: "custom-notes", label: "Notes", type: "textarea", rows: 2 }}
                            value={event["custom-notes"] || ""}
                            onChange={(value) => updateCustomEvent(index, "custom-notes", value)}
                          />
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
                <button type="button" className="label-action" onClick={addCustomEvent}>
                  Add custom event
                </button>
              </div>
            </div>
          </div>
        </details>
      </section>

      <details className="info-panel mobile-disclosure">
        <summary>
          <h2>How to use Move Logistics</h2>
        </summary>
        <div>
          <h3>Before you travel</h3>
          <p>
            Before travel starts, focus on the items that will affect your first few days the most:
            where you are sleeping, what you need to carry, and what must happen soon after arrival.
          </p>
          <ul>
            <li>Confirm travel dates.</li>
            <li>Confirm lodging or backup lodging.</li>
            <li>Review what must stay with you in the vehicle or luggage.</li>
            <li>Identify likely arrival-day priorities.</li>
            <li>Make a plan for children, pets, medications, and overnight basics.</li>
            <li>Keep the first night as simple as possible.</li>
          </ul>
          <h3>During travel</h3>
          <p>
            Travel days rarely go exactly to plan. Build for flexibility and keep the items you may
            need quickly easy to reach.
          </p>
          <ul>
            <li>Keep reservations and key contacts easy to access.</li>
            <li>Keep medications, chargers, snacks, and family essentials close by.</li>
            <li>Track route adjustments if timing changes.</li>
            <li>Save receipts if they may matter later.</li>
            <li>Confirm next lodging stop or arrival details as needed.</li>
          </ul>
          <h3>When you arrive</h3>
          <p>Arrival is usually easier when you focus on immediate function first, not full move completion.</p>
          <ul>
            <li>Confirm lodging.</li>
            <li>Identify reporting/check-in location.</li>
            <li>Verify housing next steps.</li>
            <li>Locate grocery, pharmacy, and urgent needs nearby.</li>
            <li>Review HHG (household goods shipment) delivery timing.</li>
            <li>Prioritize the few tasks that matter most in the first 24–72 hours.</li>
          </ul>
          <h3>If plans change</h3>
          <p>
            PCS moves often change at the last minute. A backup plan for lodging, documents, family
            essentials, and arrival priorities can reduce stress when timing shifts.
          </p>
          <ul>
            <li>Delayed travel</li>
            <li>Delayed lodging check-in</li>
            <li>HHG delays</li>
            <li>Housing not ready</li>
            <li>Service member report timing shifts</li>
            <li>Family arriving separately</li>
          </ul>
          <h3>Family practical callouts</h3>
          <p>
            <strong>Travel with kids:</strong> Travel days are easier when snacks, chargers, comfort
            items, changes of clothes, and first-night supplies are easy to reach without unpacking
            the entire car.
          </p>
          <p>
            <strong>Travel with pets:</strong> Keep pet records, medications, food, water, and crate
            or leash essentials accessible. Confirm pet rules before arriving at lodging.
          </p>
          <p>
            <strong>Housing not ready:</strong> If permanent housing may not be ready on arrival,
            build a temporary lodging plan before travel and think through parking, pet rules, school
            timing, and commute impact.
          </p>
          <p>
            <strong>First-night kit:</strong> Set aside one bag or bin for the first night so you do
            not need to search through everything after a long travel day.
          </p>
          <ul>
            <li>Clothes</li>
            <li>Medications</li>
            <li>Toiletries</li>
            <li>Chargers</li>
            <li>Bedding basics</li>
            <li>Kids&rsquo; comfort items</li>
            <li>Pet basics</li>
          </ul>
        </div>
      </details>

      <section className="info-panel">
        <p className="eyebrow">Master Timeline</p>
        <h2>Upcoming move events</h2>
        <p>Any dated event in this workspace appears here so the move schedule stays readable.</p>
        {timelineEntries.length === 0 ? (
          <p className="map-status">Add dates in any section to populate the timeline.</p>
        ) : (
          <div className="custom-events">
            {timelineEntries.map((entry) => (
              <article className="itinerary-stop custom-event" key={entry.key}>
                <div className="itinerary-stop-header">
                  <h4>{entry.title}</h4>
                  <strong>{entry.when}</strong>
                </div>
                <p>{entry.meta}</p>
                {entry.notes ? <p className="inventory-notes">{entry.notes}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="info-panel map-panel">
        <div className="map-panel-header">
          <div>
            <p className="eyebrow">Route Handoff</p>
            <h2>Travel route</h2>
          </div>
          {directionsHref ? (
            <a className="label-action" href={directionsHref} target="_blank" rel="noreferrer">
              Open in Google Maps
            </a>
          ) : null}
        </div>
        <div className="map-panel-body">
          <p className="map-status">
            {directionsHref
              ? "Open the current itinerary in Google Maps for turn-by-turn routing."
              : "Add a start and end location in Family Itinerary to generate a directions handoff."}
          </p>
        </div>
      </section>

    </main>
  );
}
