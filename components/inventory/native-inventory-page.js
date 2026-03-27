"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  CATEGORY_DEFINITIONS,
  INVENTORY_STORAGE_KEY,
  buildInventoryLabelSettingsSnapshot,
  buildNewInventoryItem,
  getCategoryDefinition,
  loadInventoryState,
  normalizeInventoryState,
  pushInventory,
  reconcileInventoryWithRemote,
  sanitizeInventoryLabelSize,
  saveInventoryState,
} from "@/inventory-data";
import { useNativeAuth } from "@/components/auth/native-auth-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

const SYNC_DELAY_MS = 600;

const LOADING_MESSAGE = "Loading your saved move information";
const REDIRECT_MESSAGE = "Opening sign-in";
const LOCAL_ONLY_MESSAGE =
  "We could not load your saved move information right now. Please refresh and try again.";
const EMPTY_INVENTORY_MESSAGE = "Start your room list";
const PRINT_LABEL_SURFACE = "#FFFFFF";
const PRINT_LABEL_TEXT = "#0F172A";
const PRINT_LABEL_MUTED = "#475569";
const PRINT_LABEL_BORDER = "#E2E8F0";
const PRINT_LABEL_INSET = "rgba(15, 23, 42, 0.04)";
const PRINT_LABEL_DIVIDER = "rgba(226, 232, 240, 0.85)";

const initialStatus = {
  message: "",
  tone: "neutral",
};

const normalizeSearchValue = (value) => String(value ?? "").trim().toLowerCase();

const cloneInventoryState = (inventoryState) => {
  if (typeof structuredClone === "function") {
    return structuredClone(inventoryState);
  }

  return JSON.parse(JSON.stringify(inventoryState || { rooms: [] }));
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

const getMenuId = (roomIndex, itemIndex) => `${roomIndex}-${itemIndex}`;

const shiftOpenRoomIndexesAfterRemoval = (openRoomIndexes, roomIndex) =>
  new Set(
    Array.from(openRoomIndexes)
      .filter((index) => index !== roomIndex)
      .map((index) => (index > roomIndex ? index - 1 : index))
  );

const shiftActiveLabelAfterRoomRemoval = (activeLabelItem, roomIndex) => {
  if (!activeLabelItem) {
    return null;
  }

  if (activeLabelItem.roomIndex === roomIndex) {
    return null;
  }

  if (activeLabelItem.roomIndex > roomIndex) {
    return {
      roomIndex: activeLabelItem.roomIndex - 1,
      itemIndex: activeLabelItem.itemIndex,
    };
  }

  return activeLabelItem;
};

const shiftActiveLabelAfterItemRemoval = (activeLabelItem, roomIndex, itemIndex) => {
  if (!activeLabelItem || activeLabelItem.roomIndex !== roomIndex) {
    return activeLabelItem;
  }

  if (activeLabelItem.itemIndex === itemIndex) {
    return null;
  }

  if (activeLabelItem.itemIndex > itemIndex) {
    return {
      roomIndex: activeLabelItem.roomIndex,
      itemIndex: activeLabelItem.itemIndex - 1,
    };
  }

  return activeLabelItem;
};

const normalizeLabelText = (value) => String(value ?? "").trim();

const getPreviewLabelValues = (settings) => ({
  title: normalizeLabelText(settings?.title),
  room: normalizeLabelText(settings?.room),
  weight: normalizeLabelText(settings?.weight),
  notes: normalizeLabelText(settings?.notes),
});

const getOutputLabelValues = (settings) => {
  const previewValues = getPreviewLabelValues(settings);
  return {
    title: previewValues.title || "Unnamed box",
    room: previewValues.room || "Not entered",
    weight: previewValues.weight || "Not entered",
    notes: previewValues.notes || "Not entered",
  };
};

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "box-label";

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getLabelFilenameBase = (settings) =>
  slugify(
    normalizeLabelText(settings?.title) ||
      normalizeLabelText(settings?.room) ||
      "box-label"
  );

const buildLabelMarkup = (settings) => {
  const values = getOutputLabelValues(settings);
  const safeTitle = escapeHtml(values.title);
  const safeRoom = escapeHtml(values.room);
  const safeWeight = escapeHtml(values.weight);
  const safeNotes = escapeHtml(values.notes);
  const titleSize = Number(settings?.titleSize) || 26;
  const bodySize = Number(settings?.bodySize) || 18;

  return `
      <div class="print-label">
        <div class="label-row">
          <span class="label-key">Box Name</span>
          <span class="label-value label-title">${safeTitle}</span>
        </div>
        <div class="label-row">
          <span class="label-key">Room</span>
          <span class="label-value label-body">${safeRoom}</span>
        </div>
        <div class="label-row">
          <span class="label-key">Estimated Weight</span>
          <span class="label-value label-body">${safeWeight}</span>
        </div>
        <div class="label-row">
          <span class="label-key">Notes</span>
          <span class="label-value label-body">${safeNotes}</span>
        </div>
      </div>
      <style>
        :root { color-scheme: light only; }
        body {
          margin: 0;
          padding: 2rem;
          font-family: "Inter", "Roboto", "Segoe UI", system-ui, sans-serif;
          background: ${PRINT_LABEL_SURFACE};
        }
        .print-label {
          border: 2px solid ${PRINT_LABEL_BORDER};
          border-radius: 16px;
          padding: 1.5rem;
          display: grid;
          gap: 0.75rem;
          background: ${PRINT_LABEL_SURFACE};
          color: ${PRINT_LABEL_TEXT};
          max-width: 780px;
          box-shadow: inset 0 0 0 1px ${PRINT_LABEL_INSET};
        }
        .label-row {
          display: grid;
          gap: 0.22rem;
          align-items: start;
        }
        .label-key {
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.85rem;
          color: ${PRINT_LABEL_MUTED};
        }
        .label-value {
          font-weight: 600;
          color: ${PRINT_LABEL_TEXT};
          word-break: break-word;
          line-height: 1.35;
        }
        .label-title { font-size: ${titleSize}px; }
        .label-body { font-size: ${bodySize}px; }
        @media print {
          body { padding: 0; }
          .print-label { page-break-inside: avoid; box-shadow: none; }
        }
      </style>`;
};

const buildLabelPrintDocument = (settings) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(getOutputLabelValues(settings).title)} Label</title>
  </head>
  <body>
    ${buildLabelMarkup(settings)}
  </body>
</html>`;

const splitLongCanvasToken = (context, token, maxWidth) => {
  const fragments = [];
  let remaining = token;
  while (remaining && context.measureText(remaining).width > maxWidth) {
    let sliceLength = remaining.length - 1;
    while (
      sliceLength > 1 &&
      context.measureText(remaining.slice(0, sliceLength)).width > maxWidth
    ) {
      sliceLength -= 1;
    }
    fragments.push(remaining.slice(0, sliceLength));
    remaining = remaining.slice(sliceLength);
  }
  if (remaining) {
    fragments.push(remaining);
  }
  return fragments;
};

const buildWrappedCanvasLines = (context, text, maxWidth) => {
  const normalized = String(text || "");
  const paragraphs = normalized.split(/\n/);
  const lines = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push(" ");
    } else {
      let currentLine = "";
      words.forEach((word) => {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (context.measureText(candidate).width <= maxWidth) {
          currentLine = candidate;
          return;
        }

        if (currentLine) {
          lines.push(currentLine);
        }

        if (context.measureText(word).width <= maxWidth) {
          currentLine = word;
          return;
        }

        const fragments = splitLongCanvasToken(context, word, maxWidth);
        const lastFragment = fragments.pop() || "";
        lines.push(...fragments);
        currentLine = lastFragment;
      });

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    if (paragraphIndex < paragraphs.length - 1) {
      lines.push(" ");
    }
  });

  return lines.length ? lines : ["-"];
};
const renderLabelCanvas = (settings) => {
  const values = getOutputLabelValues(settings);
  const titleSize = Math.max(22, Number(settings?.titleSize) || 26);
  const bodySize = Math.max(16, Number(settings?.bodySize) || 18);
  const labelSize = 16;
  const fieldGap = 24;
  const padding = 44;
  const width = 920;
  const innerWidth = width - padding * 2;
  const canvas = document.createElement("canvas");
  const measureContext = canvas.getContext("2d");
  if (!measureContext) {
    throw new Error("Canvas export is not available in this browser.");
  }

  const fontFamily = '"Inter", "Roboto", "Segoe UI", system-ui, sans-serif';
  const sections = [
    { label: "Box Name", value: values.title, fontSize: titleSize },
    { label: "Room", value: values.room, fontSize: bodySize },
    { label: "Estimated Weight", value: values.weight, fontSize: bodySize },
    { label: "Notes", value: values.notes, fontSize: bodySize },
  ].map((section) => {
    measureContext.font = `600 ${section.fontSize}px ${fontFamily}`;
    return {
      ...section,
      lines: buildWrappedCanvasLines(measureContext, section.value, innerWidth),
    };
  });

  const labelLineHeight = labelSize * 1.2;
  const height =
    padding * 2 +
    sections.reduce((total, section) => {
      const sectionHeight =
        labelLineHeight +
        10 +
        section.lines.length * section.fontSize * 1.35 +
        fieldGap;
      return total + sectionHeight;
    }, 0) -
    fieldGap;

  const scale = 2;
  canvas.width = width * scale;
  canvas.height = Math.max(480, Math.ceil(height)) * scale;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas export is not available in this browser.");
  }

  context.scale(scale, scale);
  context.fillStyle = PRINT_LABEL_SURFACE;
  context.fillRect(0, 0, width, canvas.height / scale);
  context.strokeStyle = PRINT_LABEL_BORDER;
  context.lineWidth = 3;
  context.strokeRect(16, 16, width - 32, canvas.height / scale - 32);

  let y = padding;
  sections.forEach((section, sectionIndex) => {
    context.fillStyle = PRINT_LABEL_MUTED;
    context.font = `700 ${labelSize}px ${fontFamily}`;
    context.textBaseline = "top";
    context.fillText(section.label.toUpperCase(), padding, y);
    y += labelLineHeight + 10;

    context.fillStyle = PRINT_LABEL_TEXT;
    context.font = `600 ${section.fontSize}px ${fontFamily}`;
    const lineHeight = section.fontSize * 1.35;
    section.lines.forEach((line) => {
      context.fillText(line, padding, y, innerWidth);
      y += lineHeight;
    });

    if (sectionIndex < sections.length - 1) {
      y += 10;
      context.strokeStyle = PRINT_LABEL_DIVIDER;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(padding, y);
      context.lineTo(width - padding, y);
      context.stroke();
      y += fieldGap - 10;
    }
  });

  return canvas;
};

const downloadLabelCanvas = (canvas, filename) => {
  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL("image/png");
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

const printLabelFromSettings = (settings) =>
  new Promise((resolve, reject) => {
    const printWindow = window.open("", "_blank", "width=960,height=720");
    if (!printWindow) {
      reject(new Error("The browser blocked the print window."));
      return;
    }

    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
      window.setTimeout(() => {
        try {
          printWindow.close();
        } catch (error) {
          console.warn("Unable to close the print window automatically.", error);
        }
      }, 250);
    };

    try {
      printWindow.document.open();
      printWindow.document.write(buildLabelPrintDocument(settings));
      printWindow.document.close();
    } catch (error) {
      try {
        printWindow.close();
      } catch (closeError) {
        console.warn("Unable to close the failed print window.", closeError);
      }
      reject(error);
      return;
    }

    const triggerPrint = () => {
      try {
        printWindow.onafterprint = finish;
        printWindow.focus();
        printWindow.print();
        window.setTimeout(finish, 1500);
      } catch (error) {
        try {
          printWindow.close();
        } catch (closeError) {
          console.warn("Unable to close the failed print window.", closeError);
        }
        reject(error);
      }
    };

    if (printWindow.document.readyState === "complete") {
      window.setTimeout(triggerPrint, 60);
    } else {
      printWindow.onload = () => {
        window.setTimeout(triggerPrint, 60);
      };
    }
  });

export function InventoryHeading() {
  const { displayName } = useNativeAuth();
  const possessiveName = getPossessiveFirstName(displayName);
  const heading = possessiveName ? `${possessiveName} Move Inventory` : "Move Inventory";

  return <h1>{heading}</h1>;
}

export function NativeInventoryPage() {
  const router = useRouter();
  const { status, user, errorMessage } = useNativeAuth();
  const [inventory, setInventory] = useState(() => normalizeInventoryState({ rooms: [] }));
  const [inventoryReady, setInventoryReady] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [syncStatus, setSyncStatus] = useState(initialStatus);
  const [activeMenuItemId, setActiveMenuItemId] = useState(null);
  const [activeRoomMenuIndex, setActiveRoomMenuIndex] = useState(null);
  const [openRoomIndexes, setOpenRoomIndexes] = useState(() => new Set());
  const [activeLabelItem, setActiveLabelItem] = useState(null);
  const [labelSettings, setLabelSettings] = useState(null);
  const [labelActionStatus, setLabelActionStatus] = useState(initialStatus);
  const inventoryRef = useRef(inventory);
  const syncTimerRef = useRef(null);
  const labelPanelRef = useRef(null);
  const labelTitleInputRef = useRef(null);
  const focusLabelInputRef = useRef(true);
  const lastLabelTriggerRef = useRef(null);

  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);

  useEffect(() => {
    if (status === "ready" && !user) {
      router.replace("/sign-in?next=/inventory");
    }
  }, [router, status, user]);

  useEffect(() => {
    if (!activeMenuItemId && activeRoomMenuIndex === null) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!event.target.closest(".inventory-item-menu")) {
        setActiveMenuItemId(null);
      }
      if (!event.target.closest(".inventory-room-menu")) {
        setActiveRoomMenuIndex(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [activeMenuItemId, activeRoomMenuIndex]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && activeLabelItem) {
        if (lastLabelTriggerRef.current && document.contains(lastLabelTriggerRef.current)) {
          lastLabelTriggerRef.current.focus();
        }
        setActiveLabelItem(null);
        setLabelSettings(null);
        setLabelActionStatus(initialStatus);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeLabelItem]);

  useEffect(() => {
    if (!activeLabelItem || !labelPanelRef.current) {
      return;
    }

    labelPanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    if (focusLabelInputRef.current) {
      window.requestAnimationFrame(() => {
        labelTitleInputRef.current?.focus();
        labelTitleInputRef.current?.select();
      });
    }
    focusLabelInputRef.current = true;
  }, [activeLabelItem]);

  useEffect(() => {
    if (status !== "ready" || !user || typeof window === "undefined") {
      if (status !== "ready") {
        setInventoryReady(false);
      }
      return undefined;
    }

    let active = true;
    const storage = window.localStorage;
    const localInventory = loadInventoryState(storage);
    inventoryRef.current = localInventory;
    setInventory(localInventory);
    setInventoryReady(false);

    const initializeInventory = async () => {
      try {
        const supabase = await getBrowserSupabaseClient();
        const reconciliation = await reconcileInventoryWithRemote({
          supabase,
          storage,
          userId: user.id,
        });

        if (!active) {
          return;
        }

        inventoryRef.current = reconciliation.inventoryState;
        setInventory(reconciliation.inventoryState);
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
          setInventoryReady(true);
        }
      }
    };

    void initializeInventory();

    return () => {
      active = false;
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [status, user]);

  const syncActiveLabelSelection = (nextInventory, nextActiveLabelItem = activeLabelItem) => {
    if (!nextActiveLabelItem) {
      setActiveLabelItem(null);
      setLabelSettings(null);
      return;
    }

    const room = nextInventory.rooms[nextActiveLabelItem.roomIndex];
    const item = room?.items[nextActiveLabelItem.itemIndex];
    if (!room || !item) {
      setActiveLabelItem(null);
      setLabelSettings(null);
      return;
    }

    setActiveLabelItem(nextActiveLabelItem);
    setLabelSettings(buildInventoryLabelSettingsSnapshot(room, item));
  };

  const scheduleRemoteSync = () => {
    if (!user || typeof window === "undefined") {
      return;
    }

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = window.setTimeout(async () => {
      try {
        const supabase = await getBrowserSupabaseClient();
        await pushInventory({
          supabase,
          userId: user.id,
          inventoryState: inventoryRef.current,
        });
        setSyncStatus((current) => (current.tone === "error" ? initialStatus : current));
      } catch (error) {
        setSyncStatus({
          message: error?.message || LOCAL_ONLY_MESSAGE,
          tone: "error",
        });
      }
    }, SYNC_DELAY_MS);
  };

  const commitInventory = (nextInventory, nextActiveLabelItem = activeLabelItem) => {
    const normalizedInventory = normalizeInventoryState(nextInventory);
    inventoryRef.current = normalizedInventory;
    setInventory(normalizedInventory);
    if (typeof window !== "undefined") {
      saveInventoryState(window.localStorage, normalizedInventory);
    }
    syncActiveLabelSelection(normalizedInventory, nextActiveLabelItem);
    scheduleRemoteSync();
  };
  const openLabelPanel = (roomIndex, itemIndex, options = {}) => {
    const draft = cloneInventoryState(inventoryRef.current);
    const room = draft.rooms[roomIndex];
    const item = room?.items[itemIndex];
    if (!room || !item) {
      return;
    }

    const { focusInput = true, triggerButton = null } = options;
    item.labelSettings = buildInventoryLabelSettingsSnapshot(room, item);
    focusLabelInputRef.current = focusInput;
    lastLabelTriggerRef.current =
      triggerButton instanceof HTMLElement ? triggerButton : document.activeElement;
    setLabelActionStatus(initialStatus);
    commitInventory(draft, { roomIndex, itemIndex });
  };

  const closeLabelPanel = (restoreFocus = true) => {
    if (
      restoreFocus &&
      lastLabelTriggerRef.current &&
      document.contains(lastLabelTriggerRef.current)
    ) {
      lastLabelTriggerRef.current.focus();
    }
    lastLabelTriggerRef.current = null;
    setActiveLabelItem(null);
    setLabelSettings(null);
    setLabelActionStatus(initialStatus);
  };

  const updateLabelSetting = (field, value) => {
    if (!activeLabelItem) {
      return;
    }

    const draft = cloneInventoryState(inventoryRef.current);
    const room = draft.rooms[activeLabelItem.roomIndex];
    const item = room?.items[activeLabelItem.itemIndex];
    if (!room || !item) {
      closeLabelPanel(false);
      return;
    }

    const nextSettings = {
      ...buildInventoryLabelSettingsSnapshot(room, item),
      [field]: value,
    };
    nextSettings.titleSize = sanitizeInventoryLabelSize(
      nextSettings.titleSize,
      26,
      18,
      36
    );
    nextSettings.bodySize = sanitizeInventoryLabelSize(
      nextSettings.bodySize,
      18,
      14,
      28
    );
    item.labelSettings = nextSettings;
    setLabelSettings(nextSettings);
    setLabelActionStatus(initialStatus);
    commitInventory(draft, activeLabelItem);
  };

  const handleRoomSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("room-name") || "").trim();
    if (!name) {
      return;
    }

    const draft = cloneInventoryState(inventoryRef.current);
    draft.rooms.push({ name, items: [] });
    commitInventory(draft);
    setActiveMenuItemId(null);
    setActiveRoomMenuIndex(null);
    event.currentTarget.reset();
  };

  const handleAddItem = (event, roomIndex) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const label = String(formData.get("item-label") || "").trim();
    const category = String(formData.get("item-category") || "Moving Box");
    const notes = String(formData.get("item-notes") || "").trim();
    if (!label) {
      return;
    }

    const draft = cloneInventoryState(inventoryRef.current);
    const room = draft.rooms[roomIndex];
    if (!room) {
      return;
    }

    room.items.push(buildNewInventoryItem({ label, category, notes }));
    commitInventory(draft);
    setActiveMenuItemId(null);
    setActiveRoomMenuIndex(null);
    event.currentTarget.reset();
  };

  const handleItemFieldChange = (roomIndex, itemIndex, field, value) => {
    const draft = cloneInventoryState(inventoryRef.current);
    const item = draft.rooms[roomIndex]?.items[itemIndex];
    if (!item) {
      return;
    }

    if (field === "category") {
      item.category = value;
      item.weight = getCategoryDefinition(item.category).defaultWeight;
    }
    if (field === "weight") {
      item.weight = Number(value);
    }
    if (field === "include") {
      item.includeInEstimate = Boolean(value);
    }
    if (field === "high-value") {
      item.isHighValue = Boolean(value);
    }

    commitInventory(draft);
  };

  const handleRoomToggle = (roomIndex, isOpen) => {
    if (currentQuery) {
      return;
    }

    setOpenRoomIndexes((current) => {
      const next = new Set(current);
      if (isOpen) {
        next.add(roomIndex);
      } else {
        next.delete(roomIndex);
      }
      return next;
    });
  };

  const handleToggleRoomMenu = (event, roomIndex) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveMenuItemId(null);
    setActiveRoomMenuIndex((current) => (current === roomIndex ? null : roomIndex));
  };

  const handleOpenRoomPanel = (event, roomIndex, panelName) => {
    event.preventDefault();
    event.stopPropagation();
    const draft = cloneInventoryState(inventoryRef.current);
    const room = draft.rooms[roomIndex];
    if (!room) {
      return;
    }

    room.editMode = panelName;
    setActiveRoomMenuIndex(null);
    setActiveMenuItemId(null);
    commitInventory(draft);
  };

  const handleCancelRoomPanel = (roomIndex) => {
    const draft = cloneInventoryState(inventoryRef.current);
    const room = draft.rooms[roomIndex];
    if (!room) {
      return;
    }

    delete room.editMode;
    commitInventory(draft);
  };

  const handleConfirmRoomRename = (event, roomIndex) => {
    const roomCard = event.currentTarget.closest(".inventory-room");
    const input = roomCard?.querySelector("[data-room-rename-input]");
    const newName = input?.value.trim();
    if (!newName) {
      return;
    }

    const draft = cloneInventoryState(inventoryRef.current);
    const room = draft.rooms[roomIndex];
    if (!room) {
      return;
    }

    const oldRoomName = room.name;
    room.name = newName;
    delete room.editMode;
    room.items.forEach((item) => {
      if (
        item.labelSettings &&
        (!item.labelSettings.room || item.labelSettings.room === oldRoomName)
      ) {
        item.labelSettings.room = newName;
      }
    });

    commitInventory(draft);
  };

  const handleDeleteRoom = (roomIndex) => {
    const confirmed = window.confirm(
      "Delete this room and all items inside it? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    const draft = cloneInventoryState(inventoryRef.current);
    draft.rooms.splice(roomIndex, 1);
    const nextActiveLabelItem = shiftActiveLabelAfterRoomRemoval(activeLabelItem, roomIndex);
    setOpenRoomIndexes((current) => shiftOpenRoomIndexesAfterRemoval(current, roomIndex));
    setActiveRoomMenuIndex(null);
    setActiveMenuItemId(null);
    commitInventory(draft, nextActiveLabelItem);
  };

  const handleToggleItemMenu = (event, roomIndex, itemIndex) => {
    event.preventDefault();
    event.stopPropagation();
    const menuId = getMenuId(roomIndex, itemIndex);
    setActiveRoomMenuIndex(null);
    setActiveMenuItemId((current) => (current === menuId ? null : menuId));
  };

  const handleOpenItemPanel = (roomIndex, itemIndex, panelName) => {
    const draft = cloneInventoryState(inventoryRef.current);
    const item = draft.rooms[roomIndex]?.items[itemIndex];
    if (!item) {
      return;
    }

    item.editMode = panelName;
    setActiveMenuItemId(null);
    setActiveRoomMenuIndex(null);
    commitInventory(draft);
  };

  const handleCancelItemPanel = (roomIndex, itemIndex) => {
    const draft = cloneInventoryState(inventoryRef.current);
    const item = draft.rooms[roomIndex]?.items[itemIndex];
    if (!item) {
      return;
    }

    delete item.editMode;
    commitInventory(draft);
  };
  const handleConfirmMove = (event, roomIndex, itemIndex) => {
    const itemCard = event.currentTarget.closest(".inventory-item");
    const select = itemCard?.querySelector("[data-move-select]");
    const destinationIndex = Number(select?.value);
    if (Number.isNaN(destinationIndex)) {
      return;
    }
    if (destinationIndex === roomIndex) {
      handleCancelItemPanel(roomIndex, itemIndex);
      return;
    }

    const draft = cloneInventoryState(inventoryRef.current);
    const room = draft.rooms[roomIndex];
    const destinationRoom = draft.rooms[destinationIndex];
    if (!room || !destinationRoom) {
      return;
    }

    const oldRoomName = room.name;
    const movedItems = room.items.splice(itemIndex, 1);
    const movedItem = movedItems[0];
    if (!movedItem) {
      return;
    }

    delete movedItem.editMode;
    destinationRoom.items.push(movedItem);
    if (movedItem.labelSettings && movedItem.labelSettings.room === oldRoomName) {
      movedItem.labelSettings.room = destinationRoom.name;
    }

    let nextActiveLabelItem = activeLabelItem;
    const wasActive =
      activeLabelItem &&
      activeLabelItem.roomIndex === roomIndex &&
      activeLabelItem.itemIndex === itemIndex;
    if (wasActive) {
      nextActiveLabelItem = {
        roomIndex: destinationIndex,
        itemIndex: destinationRoom.items.length - 1,
      };
    } else {
      nextActiveLabelItem = shiftActiveLabelAfterItemRemoval(
        activeLabelItem,
        roomIndex,
        itemIndex
      );
    }

    commitInventory(draft, nextActiveLabelItem);
  };

  const handleConfirmRename = (event, roomIndex, itemIndex) => {
    const itemCard = event.currentTarget.closest(".inventory-item");
    const input = itemCard?.querySelector("[data-rename-input]");
    const newLabel = input?.value.trim();
    if (!newLabel) {
      return;
    }

    const draft = cloneInventoryState(inventoryRef.current);
    const item = draft.rooms[roomIndex]?.items[itemIndex];
    if (!item) {
      return;
    }

    const oldLabel = item.label;
    item.label = newLabel;
    delete item.editMode;
    if (
      item.labelSettings &&
      (!item.labelSettings.title || item.labelSettings.title === oldLabel)
    ) {
      item.labelSettings.title = newLabel;
    }

    commitInventory(draft);
  };

  const handleDeleteItem = (roomIndex, itemIndex) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    const draft = cloneInventoryState(inventoryRef.current);
    const room = draft.rooms[roomIndex];
    if (!room) {
      return;
    }

    room.items.splice(itemIndex, 1);
    const nextActiveLabelItem = shiftActiveLabelAfterItemRemoval(
      activeLabelItem,
      roomIndex,
      itemIndex
    );
    commitInventory(draft, nextActiveLabelItem);
  };

  const handleViewLabel = (event, roomIndex, itemIndex) => {
    openLabelPanel(roomIndex, itemIndex, {
      focusInput: true,
      triggerButton: event.currentTarget,
    });
  };

  const handlePrintFromItem = (event, roomIndex, itemIndex) => {
    const draft = cloneInventoryState(inventoryRef.current);
    const room = draft.rooms[roomIndex];
    const item = room?.items[itemIndex];
    if (!room || !item) {
      return;
    }

    const nextSettings = buildInventoryLabelSettingsSnapshot(room, item);
    item.labelSettings = nextSettings;
    focusLabelInputRef.current = false;
    lastLabelTriggerRef.current = event.currentTarget;
    setLabelActionStatus({
      message: "Opening print dialog...",
      tone: "neutral",
    });
    commitInventory(draft, { roomIndex, itemIndex });
    void printLabelFromSettings(nextSettings)
      .then(() => {
        setLabelActionStatus({
          message: "Print dialog opened.",
          tone: "success",
        });
      })
      .catch((error) => {
        console.error("Unable to print the label.", error);
        setLabelActionStatus({
          message: "Unable to open the print dialog right now.",
          tone: "error",
        });
      });
  };

  const handlePrintLabel = async (event) => {
    event.preventDefault();
    if (!labelSettings) {
      return;
    }

    setLabelActionStatus({
      message: "Opening print dialog...",
      tone: "neutral",
    });
    try {
      await printLabelFromSettings(labelSettings);
      setLabelActionStatus({
        message: "Print dialog opened.",
        tone: "success",
      });
    } catch (error) {
      console.error("Unable to print the label.", error);
      setLabelActionStatus({
        message: "Unable to open the print dialog right now.",
        tone: "error",
      });
    }
  };

  const handleDownloadLabel = (event) => {
    event.preventDefault();
    if (!labelSettings) {
      return;
    }

    setLabelActionStatus({
      message: "Preparing label download...",
      tone: "neutral",
    });
    try {
      const canvas = renderLabelCanvas(labelSettings);
      downloadLabelCanvas(canvas, `box-label-${getLabelFilenameBase(labelSettings)}.png`);
      setLabelActionStatus({
        message: "Label downloaded as PNG.",
        tone: "success",
      });
    } catch (error) {
      console.error("Unable to download the label.", error);
      setLabelActionStatus({
        message: "Unable to download the label right now.",
        tone: "error",
      });
    }
  };

  if (status === "loading" || (status === "ready" && user && !inventoryReady)) {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">Move Inventory</p>
          <h2>Loading your inventory</h2>
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
          <p className="eyebrow">Move Inventory</p>
          <h2>Inventory access is unavailable</h2>
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
          <p className="eyebrow">Move Inventory</p>
          <h2>Redirecting to sign in</h2>
          <p className="signup-page-status" aria-live="polite">
            {REDIRECT_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

  const highValueItems = [];
  inventory.rooms.forEach((room) => {
    room.items.forEach((item) => {
      if (item.isHighValue) {
        highValueItems.push({
          roomName: room.name,
          item,
        });
      }
    });
  });

  const filteredQuery = normalizeSearchValue(currentQuery);
  const visibleRooms = inventory.rooms
    .map((room, roomIndex) => {
      const roomMatches = normalizeSearchValue(room.name).includes(filteredQuery);
      const filteredItems = roomMatches
        ? room.items.map((item, itemIndex) => ({ item, itemIndex }))
        : room.items
            .map((item, itemIndex) => ({ item, itemIndex }))
            .filter(({ item }) => {
              const labelMatch = normalizeSearchValue(item.label).includes(filteredQuery);
              const notesMatch = normalizeSearchValue(item.notes || "").includes(filteredQuery);
              return labelMatch || notesMatch;
            });

      if (filteredQuery && !roomMatches && filteredItems.length === 0) {
        return null;
      }

      return {
        filteredItems,
        room,
        roomIndex,
        shouldOpen: Boolean(filteredQuery) || openRoomIndexes.has(roomIndex),
      };
    })
    .filter(Boolean);

  const previewValues = getPreviewLabelValues(labelSettings || {});
  return (
    <main className="container inventory-grid">
      <details
        className="info-panel mobile-disclosure"
        data-mobile-collapse="true"
        open
        aria-labelledby="inventory-guidance-title"
      >
        <summary className="mobile-disclosure-summary">
          <div>
            <h2 id="inventory-guidance-title">How to Use Move Inventory</h2>
            <p>Keep the packing guidance nearby, but collapse it when you just need to add rooms or items.</p>
          </div>
          <span className="mobile-disclosure-hint" aria-hidden="true"></span>
        </summary>
        <div className="mobile-disclosure-body">
          <p>
            Build a complete household inventory that matches how movers pack and how claims are
            processed.
          </p>
          <ol>
            <li>Create one entry for every room, including garages and storage areas.</li>
            <li>Start with large, high-value items like furniture, electronics, and appliances.</li>
            <li>Flag expensive or sentimental items so they are clearly identified.</li>
            <li>Add boxed items under the correct room as packing happens.</li>
            <li>Label every box with the room name and box number to match your list.</li>
            <li>Before pack-out, confirm all rooms and high-value items are captured.</li>
          </ol>
          <p>Tip: Keep labels short and consistent so movers can match boxes quickly.</p>
        </div>
      </details>

      <section className="inventory-controls">
        {syncStatus.message ? (
          <p className="auth-status" data-tone={syncStatus.tone} aria-live="polite">
            {syncStatus.message}
          </p>
        ) : null}

        <div className="inventory-search">
          <label htmlFor="inventory-search">Search your inventory</label>
          <input
            id="inventory-search"
            type="search"
            placeholder="Search rooms, items, or notes"
            autoComplete="off"
            value={currentQuery}
            onChange={(event) => setCurrentQuery(event.target.value)}
          />
        </div>

        <form className="inventory-form" id="room-form" onSubmit={handleRoomSubmit}>
          <label htmlFor="room-name">Add a room</label>
          <input
            id="room-name"
            name="room-name"
            type="text"
            placeholder="Kitchen, Garage, Bedroom"
            required
          />
          <button type="submit">Add Room</button>
        </form>

        <div className="inventory-weight-summary" aria-live="polite">
          <h2>Estimated Total Household Goods Weight</h2>
          <p className="weight-total" id="total-weight">{inventory.totalWeight} lbs</p>
          <p className="weight-disclaimer">
            Weight estimates are approximate and for planning purposes only.
          </p>
        </div>

        <div className="inventory-high-value-summary" aria-live="polite">
          <h2>High Value Items</h2>
          {highValueItems.length > 0 ? (
            <ul className="inventory-high-value-list" id="high-value-list">
              {highValueItems.map(({ roomName, item }, index) => (
                <li className="inventory-high-value-item" key={`${roomName}-${item.label}-${index}`}>
                  <div className="inventory-high-value-details">
                    <strong>{item.label}</strong>
                    <span className="inventory-high-value-room">{roomName}</span>
                  </div>
                  {Number.isFinite(item.weight) ? (
                    <span className="inventory-high-value-weight">{item.weight} lbs</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="inventory-empty" id="high-value-empty" hidden={highValueItems.length > 0}>
            No high value items have been marked.
          </p>
        </div>
      </section>

      <section id="rooms-container">
        {inventory.rooms.length === 0 ? (
          <section className="info-panel">
            <h2>{EMPTY_INVENTORY_MESSAGE}</h2>
            <p>Add a room above to begin tracking boxes and household items for your move.</p>
          </section>
        ) : (
          visibleRooms.map(({ room, roomIndex, filteredItems, shouldOpen }) => (
            <details
              className="inventory-room"
              data-room-index={roomIndex}
              key={`${roomIndex}-${room.name}`}
              open={shouldOpen}
              onToggle={(event) => handleRoomToggle(roomIndex, event.currentTarget.open)}
            >
              <summary>
                <div className="inventory-room-summary">
                  <div className="inventory-room-heading">
                    <h3>{room.name}</h3>
                    <span className="inventory-room-meta">{room.items.length} items</span>
                  </div>
                  <div className="inventory-room-menu">
                    <button
                      type="button"
                      className="item-menu-trigger"
                      data-action="toggle-room-menu"
                      data-room-index={roomIndex}
                      aria-haspopup="true"
                      aria-expanded={activeRoomMenuIndex === roomIndex ? "true" : "false"}
                      aria-label="Room options"
                      onClick={(event) => handleToggleRoomMenu(event, roomIndex)}
                    >
                      ...
                    </button>
                    <div className="item-menu-dropdown" role="menu" hidden={activeRoomMenuIndex !== roomIndex}>
                      <button
                        type="button"
                        className="item-menu-item"
                        onClick={(event) => handleOpenRoomPanel(event, roomIndex, "rename")}
                      >
                        Rename room
                      </button>
                      <button
                        type="button"
                        className="item-menu-item item-menu-item--danger"
                        onClick={() => handleDeleteRoom(roomIndex)}
                      >
                        Delete room
                      </button>
                    </div>
                  </div>
                </div>
              </summary>
              <div
                className="inventory-room-panel inventory-item-panel"
                data-room-panel="rename"
                hidden={room.editMode !== "rename"}
              >
                <label className="inventory-item-field">
                  New room name
                  <input
                    key={`room-rename-${roomIndex}-${room.name}`}
                    type="text"
                    defaultValue={room.name}
                    data-room-rename-input
                    data-room-index={roomIndex}
                  />
                </label>
                <div className="inventory-item-panel-actions">
                  <button type="button" className="label-action secondary" onClick={() => handleCancelRoomPanel(roomIndex)}>
                    Cancel
                  </button>
                  <button type="button" className="label-action" onClick={(event) => handleConfirmRoomRename(event, roomIndex)}>
                    Save Name
                  </button>
                </div>
              </div>
              <form className="inventory-form" data-room-index={roomIndex} onSubmit={(event) => handleAddItem(event, roomIndex)}>
                <label htmlFor={`item-label-${roomIndex}`}>Add a box or item</label>
                <input
                  id={`item-label-${roomIndex}`}
                  name="item-label"
                  type="text"
                  placeholder="Box 1 - Dishes"
                  required
                />
                <label htmlFor={`item-category-${roomIndex}`}>Item category</label>
                <select id={`item-category-${roomIndex}`} name="item-category" defaultValue="Moving Box">
                  {CATEGORY_DEFINITIONS.map((category) => (
                    <option key={`${roomIndex}-${category.label}`} value={category.label}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <label htmlFor={`item-notes-${roomIndex}`}>Notes (optional)</label>
                <textarea
                  id={`item-notes-${roomIndex}`}
                  name="item-notes"
                  placeholder="Fragile, open first, belongs upstairs"
                ></textarea>
                <button type="submit">Add Item</button>
              </form>
              <p className="inventory-room-weight">
                Estimated Weight for {room.name}: {room.roomWeight} lbs
              </p>
              {filteredItems.length === 0 ? (
                <p className="inventory-empty">No matching items yet.</p>
              ) : (
                <ul className="inventory-items">
                  {filteredItems.map(({ item, itemIndex }) => {
                    const menuId = getMenuId(roomIndex, itemIndex);
                    return (
                      <li
                        className={`inventory-item ${item.includeInEstimate ? "" : "inventory-item--excluded"}`.trim()}
                        key={`${roomIndex}-${itemIndex}-${item.label}`}
                      >
                        <div className="inventory-item-main">
                          <div className="inventory-item-header">
                            <strong>{item.label}</strong>
                            <div className="inventory-item-menu">
                              <button
                                type="button"
                                className="item-menu-trigger"
                                data-action="toggle-item-menu"
                                data-room-index={roomIndex}
                                data-item-index={itemIndex}
                                aria-haspopup="true"
                                aria-expanded={activeMenuItemId === menuId ? "true" : "false"}
                                aria-label="Item options"
                                onClick={(event) => handleToggleItemMenu(event, roomIndex, itemIndex)}
                              >
                                ...
                              </button>
                              <div className="item-menu-dropdown" role="menu" hidden={activeMenuItemId !== menuId}>
                                <button type="button" className="item-menu-item" onClick={() => handleOpenItemPanel(roomIndex, itemIndex, "move")}>
                                  Move to Another Room
                                </button>
                                <button type="button" className="item-menu-item" onClick={() => handleOpenItemPanel(roomIndex, itemIndex, "rename")}>
                                  Rename Item
                                </button>
                                <button type="button" className="item-menu-item item-menu-item--danger" onClick={() => handleDeleteItem(roomIndex, itemIndex)}>
                                  Delete Item
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="inventory-item-fields">
                            <label className="inventory-item-field">
                              Category
                              <select
                                data-field="category"
                                data-room-index={roomIndex}
                                data-item-index={itemIndex}
                                value={item.category}
                                onChange={(event) => handleItemFieldChange(roomIndex, itemIndex, "category", event.target.value)}
                              >
                                {CATEGORY_DEFINITIONS.map((category) => (
                                  <option key={`${roomIndex}-${itemIndex}-${category.label}`} value={category.label}>
                                    {category.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="inventory-item-field">
                              Estimated weight (lbs)
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={item.weight}
                                data-field="weight"
                                data-room-index={roomIndex}
                                data-item-index={itemIndex}
                                onChange={(event) => handleItemFieldChange(roomIndex, itemIndex, "weight", event.target.value)}
                              />
                            </label>
                            <label className="inventory-item-field inventory-item-checkbox">
                              <input
                                type="checkbox"
                                data-field="include"
                                data-room-index={roomIndex}
                                data-item-index={itemIndex}
                                checked={item.includeInEstimate}
                                onChange={(event) => handleItemFieldChange(roomIndex, itemIndex, "include", event.target.checked)}
                              />
                              <span>Include in weight estimate</span>
                            </label>
                            <label className="inventory-item-field inventory-item-checkbox">
                              <input
                                type="checkbox"
                                data-field="high-value"
                                data-room-index={roomIndex}
                                data-item-index={itemIndex}
                                checked={item.isHighValue}
                                onChange={(event) => handleItemFieldChange(roomIndex, itemIndex, "high-value", event.target.checked)}
                              />
                              <span>High value item</span>
                            </label>
                          </div>
                          {item.notes ? <p className="inventory-notes">{item.notes}</p> : null}
                          <div className="inventory-item-panel" data-panel="move" hidden={item.editMode !== "move"}>
                            <label className="inventory-item-field">
                              Move to room
                              <select key={`move-${roomIndex}-${itemIndex}-${inventory.rooms.length}`} data-move-select defaultValue={roomIndex}>
                                {inventory.rooms.map((roomOption, optionIndex) => (
                                  <option key={`${roomIndex}-${itemIndex}-move-${roomOption.name}-${optionIndex}`} value={optionIndex}>
                                    {roomOption.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <div className="inventory-item-panel-actions">
                              <button type="button" className="label-action secondary" onClick={() => handleCancelItemPanel(roomIndex, itemIndex)}>
                                Cancel
                              </button>
                              <button type="button" className="label-action" onClick={(event) => handleConfirmMove(event, roomIndex, itemIndex)}>
                                Move Item
                              </button>
                            </div>
                          </div>
                          <div className="inventory-item-panel" data-panel="rename" hidden={item.editMode !== "rename"}>
                            <label className="inventory-item-field">
                              New item name
                              <input
                                key={`rename-${roomIndex}-${itemIndex}-${item.label}`}
                                type="text"
                                defaultValue={item.label}
                                data-rename-input
                                data-room-index={roomIndex}
                                data-item-index={itemIndex}
                              />
                            </label>
                            <div className="inventory-item-panel-actions">
                              <button type="button" className="label-action secondary" onClick={() => handleCancelItemPanel(roomIndex, itemIndex)}>
                                Cancel
                              </button>
                              <button type="button" className="label-action" onClick={(event) => handleConfirmRename(event, roomIndex, itemIndex)}>
                                Save Name
                              </button>
                            </div>
                          </div>
                          <div className="inventory-item-footer">
                            <div className="inventory-item-actions">
                              <button type="button" className="label-action" onClick={(event) => handleViewLabel(event, roomIndex, itemIndex)}>
                                Edit Label
                              </button>
                              <button type="button" className="label-action secondary" onClick={(event) => handlePrintFromItem(event, roomIndex, itemIndex)}>
                                Print Label
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </details>
          ))
        )}
      </section>

      <section
        className="label-panel"
        id="label-panel"
        hidden={!activeLabelItem}
        aria-hidden={activeLabelItem ? "false" : "true"}
        aria-labelledby="label-panel-title"
        tabIndex={-1}
        ref={labelPanelRef}
      >
        <div className="label-panel-header">
          <div>
            <p className="label-eyebrow">Box label</p>
            <h2 id="label-panel-title">Edit, preview, print, or download</h2>
          </div>
          <div className="label-panel-actions">
            <button type="button" className="label-action" id="print-label-button" onClick={handlePrintLabel}>
              Print Label
            </button>
            <button type="button" className="label-action" id="download-label-button" onClick={handleDownloadLabel}>
              Download Label
            </button>
            <button type="button" className="label-action secondary" id="close-label-button" onClick={() => closeLabelPanel(true)}>
              Close
            </button>
          </div>
        </div>
        <p className="label-action-status" id="label-action-status" data-tone={labelActionStatus.tone} aria-live="polite">
          {labelActionStatus.message}
        </p>
        <div className="label-panel-body">
          <div className="label-editor">
            <div className="label-editor-section">
              <h3>Label fields</h3>
              <label>
                Box name
                <input
                  id="label-title-input"
                  type="text"
                  placeholder="Kitchen dishes"
                  autoComplete="off"
                  value={labelSettings?.title || ""}
                  onChange={(event) => updateLabelSetting("title", event.target.value)}
                  ref={labelTitleInputRef}
                />
              </label>
              <label>
                Room
                <input
                  id="label-room-input"
                  type="text"
                  placeholder="Kitchen"
                  autoComplete="off"
                  value={labelSettings?.room || ""}
                  onChange={(event) => updateLabelSetting("room", event.target.value)}
                />
              </label>
              <label>
                Estimated weight
                <input
                  id="label-weight-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="45 lbs"
                  autoComplete="off"
                  value={labelSettings?.weight || ""}
                  onChange={(event) => updateLabelSetting("weight", event.target.value)}
                />
              </label>
              <label>
                Notes (optional)
                <textarea
                  id="label-notes-input"
                  rows="3"
                  placeholder="Fragile, open first, keep upright"
                  value={labelSettings?.notes || ""}
                  onChange={(event) => updateLabelSetting("notes", event.target.value)}
                ></textarea>
              </label>
            </div>
            <div className="label-editor-section">
              <h3>Font size</h3>
              <label className="label-size-control">
                Title size
                <input
                  id="label-title-size"
                  type="range"
                  min="18"
                  max="36"
                  step="1"
                  value={labelSettings?.titleSize || 26}
                  onChange={(event) => updateLabelSetting("titleSize", Number(event.target.value) || 26)}
                />
                <span id="label-title-size-value">{labelSettings?.titleSize || 26}px</span>
              </label>
              <label className="label-size-control">
                Body size
                <input
                  id="label-body-size"
                  type="range"
                  min="14"
                  max="28"
                  step="1"
                  value={labelSettings?.bodySize || 18}
                  onChange={(event) => updateLabelSetting("bodySize", Number(event.target.value) || 18)}
                />
                <span id="label-body-size-value">{labelSettings?.bodySize || 18}px</span>
              </label>
            </div>
          </div>
          <div className="label-preview">
            <p className="label-preview-title">Live preview</p>
            <div className="print-label" id="print-label">
              <div className="label-row">
                <span className="label-key">Box Name</span>
                <span
                  className={`label-value ${previewValues.title ? "" : "is-placeholder"}`.trim()}
                  id="label-title"
                >
                  {previewValues.title || "Add a box name"}
                </span>
              </div>
              <div className="label-row">
                <span className="label-key">Room</span>
                <span
                  className={`label-value ${previewValues.room ? "" : "is-placeholder"}`.trim()}
                  id="label-room"
                >
                  {previewValues.room || "Add a room"}
                </span>
              </div>
              <div className="label-row">
                <span className="label-key">Estimated Weight</span>
                <span
                  className={`label-value ${previewValues.weight ? "" : "is-placeholder"}`.trim()}
                  id="label-weight"
                >
                  {previewValues.weight || "Add weight"}
                </span>
              </div>
              <div className="label-row" id="label-notes-row">
                <span className="label-key">Notes</span>
                <span
                  className={`label-value ${previewValues.notes ? "" : "is-placeholder"}`.trim()}
                  id="label-notes"
                >
                  {previewValues.notes || "Optional notes"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
