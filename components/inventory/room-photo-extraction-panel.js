"use client";

import { useEffect, useMemo, useState } from "react";

import { prepareRoomPhotosForInference } from "@/lib/image-preprocess";
import { EXTRACTION_COPY, EXTRACTION_LIMITS } from "@/lib/inventory-extraction-constants";

const MAX_PAYLOAD_BYTES = EXTRACTION_LIMITS.maxPreparedBytesPerRun;

const toBlobFromDataUrl = async (dataUrl) => {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error("Could not read a saved local photo.");
  }
  return response.blob();
};

const buildFallbackItemName = (roomName) => `${roomName || "Room"} item`;

const normalizeSuggestedItems = (items, roomName) =>
  (Array.isArray(items) ? items : [])
    .slice(0, EXTRACTION_LIMITS.maxSuggestedItemsPerRun)
    .map((item, index) => ({
      id: String(item?.id || `ai-item-${index + 1}`),
      label: String(item?.label || buildFallbackItemName(roomName)).trim() || buildFallbackItemName(roomName),
      category: String(item?.category || "Miscellaneous").trim() || "Miscellaneous",
      notes: String(item?.notes || "").trim(),
      confidence: Number(item?.confidence) || null,
    }));

const runExtractionRequest = async ({ payload, signal }) => {
  const response = await fetch("/api/inventory/extract-local", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  let result = null;
  try {
    result = await response.json();
  } catch {
    throw new Error("Extraction service returned malformed JSON.");
  }

  if (!response.ok) {
    throw new Error(result?.error || "Extraction failed. Please try again.");
  }

  if (!Array.isArray(result?.items)) {
    throw new Error("Extraction result was malformed.");
  }

  return result;
};

export function RoomPhotoExtractionPanel({
  room,
  photos,
  disabled,
  onSaveSuggestedItems,
  hasUserContext,
}) {
  const storageKey = `pcs-pal-room-extract-review:${room.id}`;
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState({ message: "", tone: "neutral" });
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState(() => new Set());

  const canExtract = photos.length > 0 && !disabled && !isExtracting && hasUserContext;
  const selectedCount = selectedItemIds.size;

  const toggleSelection = (itemId) => {
    setSelectedItemIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedItemIds(new Set(suggestedItems.map((item) => item.id)));
  };

  const clearAll = () => {
    setSelectedItemIds(new Set());
  };

  const selectedItems = useMemo(
    () => suggestedItems.filter((item) => selectedItemIds.has(item.id)),
    [selectedItemIds, suggestedItems]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const saved = window.sessionStorage.getItem(storageKey);
      if (!saved) {
        return;
      }
      const parsed = JSON.parse(saved);
      const restoredItems = normalizeSuggestedItems(parsed?.items, room.name);
      setSuggestedItems(restoredItems);
      setSelectedItemIds(new Set(Array.isArray(parsed?.selectedIds) ? parsed.selectedIds : restoredItems.map((item) => item.id)));
    } catch {
      // no-op restore failure
    }
  }, [room.name, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!suggestedItems.length) {
      window.sessionStorage.removeItem(storageKey);
      return;
    }
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        items: suggestedItems,
        selectedIds: Array.from(selectedItemIds),
      })
    );
  }, [selectedItemIds, storageKey, suggestedItems]);

  const handleExtract = async () => {
    if (!hasUserContext) {
      setExtractionStatus({
        message: "Missing account or room context. Refresh and try again.",
        tone: "error",
      });
      return;
    }

    if (!photos.length) {
      setExtractionStatus({
        message: "Add at least one room photo before running extraction.",
        tone: "error",
      });
      return;
    }

    const runPhotos = photos.slice(0, EXTRACTION_LIMITS.maxPhotosPerRun);
    const ignoredPhotoCount = Math.max(0, photos.length - runPhotos.length);

    setIsExtracting(true);
    setSuggestedItems([]);
    setSelectedItemIds(new Set());
    setExtractionStatus({ message: "Preparing room photos for extraction…", tone: "neutral" });

    try {
      const localRoomPhotos = await Promise.all(
        runPhotos.map(async (photo) => ({
          localPhotoId: photo.id,
          roomId: room.id,
          fileName: photo.fileName,
          fileOrBlob: await toBlobFromDataUrl(photo.originalDataUrl),
        }))
      );

      const prepResult = await prepareRoomPhotosForInference(localRoomPhotos);
      const preparedPhotos = prepResult.preparedPhotos.filter(
        (prepared) => prepared.byteSize <= EXTRACTION_LIMITS.maxPreparedBytesPerPhoto
      );

      const oversizedCount = prepResult.preparedPhotos.length - preparedPhotos.length;
      const totalPreparedBytes = preparedPhotos.reduce((sum, photo) => sum + photo.byteSize, 0);

      if (!preparedPhotos.length) {
        throw new Error("No photos were usable after preprocessing. Try different shots.");
      }

      if (totalPreparedBytes > MAX_PAYLOAD_BYTES) {
        throw new Error("Prepared photos are too large for one run. Remove a few photos and retry.");
      }

      const payload = {
        roomId: room.id,
        roomName: room.name,
        photos: preparedPhotos.map((photo) => ({
          localPhotoId: photo.localPhotoId,
          fileName: photo.fileName,
          width: photo.width,
          height: photo.height,
          byteSize: photo.byteSize,
          resized: photo.resized,
        })),
      };

      setExtractionStatus({ message: "Extracting inventory suggestions…", tone: "neutral" });

      let attempt = 0;
      let result;
      let lastError;
      while (attempt <= EXTRACTION_LIMITS.maxRetries && !result) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort("timeout"), EXTRACTION_LIMITS.requestTimeoutMs);

        try {
          result = await runExtractionRequest({ payload, signal: controller.signal });
        } catch (error) {
          lastError = error;
        } finally {
          window.clearTimeout(timeout);
        }

        attempt += 1;
      }

      if (!result) {
        throw lastError || new Error("Unable to complete extraction right now.");
      }

      const normalizedItems = normalizeSuggestedItems(result.items, room.name);
      setSuggestedItems(normalizedItems);
      setSelectedItemIds(new Set(normalizedItems.map((item) => item.id)));

      const partialFailures = prepResult.failureCount + oversizedCount;
      const statusParts = [];
      if (normalizedItems.length) {
        statusParts.push(`Found ${normalizedItems.length} suggested item${normalizedItems.length === 1 ? "" : "s"}.`);
      }
      if (partialFailures > 0) {
        statusParts.push(`${partialFailures} photo${partialFailures === 1 ? " was" : "s were"} skipped.`);
      }
      if (ignoredPhotoCount > 0) {
        statusParts.push(`${ignoredPhotoCount} photo${ignoredPhotoCount === 1 ? "" : "s"} excluded due to run limit.`);
      }

      setExtractionStatus({
        message: statusParts.join(" ") || "Extraction completed.",
        tone: normalizedItems.length ? "success" : "neutral",
      });
    } catch (error) {
      setExtractionStatus({
        message: error?.name === "AbortError" ? "Extraction timed out. Try again." : error?.message || "Extraction failed.",
        tone: "error",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveSelected = async () => {
    if (!selectedItems.length || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await onSaveSuggestedItems(selectedItems);
      setSuggestedItems([]);
      setSelectedItemIds(new Set());
      setExtractionStatus({
        message: `${selectedItems.length} item${selectedItems.length === 1 ? "" : "s"} saved to this room and synced with your account.`,
        tone: "success",
      });
    } catch (error) {
      setExtractionStatus({
        message: error?.message || "Could not save suggested items. Your photos are still available to retry.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="room-photo-extract-panel">
      <p className="room-photo-extract-copy">{EXTRACTION_COPY.localOnly}</p>
      <p className="room-photo-extract-copy">{EXTRACTION_COPY.reviewRequired}</p>
      <p className="room-photo-extract-copy">{EXTRACTION_COPY.syncedItems}</p>
      <div className="room-photo-extract-actions">
        <button type="button" className="label-action" onClick={handleExtract} disabled={!canExtract}>
          {isExtracting ? "Extracting…" : "Run AI extraction"}
        </button>
      </div>
      {extractionStatus.message ? (
        <p className="auth-status" data-tone={extractionStatus.tone} aria-live="polite">
          {extractionStatus.message}
        </p>
      ) : null}
      {suggestedItems.length ? (
        <div className="room-photo-suggestion-list">
          <div className="room-photo-suggestion-header">
            <strong>Review suggested items</strong>
            <div className="room-photo-suggestion-controls">
              <button type="button" className="link-button" onClick={selectAll}>Select all</button>
              <button type="button" className="link-button" onClick={clearAll}>Clear</button>
            </div>
          </div>
          <ul>
            {suggestedItems.map((item) => (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedItemIds.has(item.id)}
                    onChange={() => toggleSelection(item.id)}
                    disabled={isSaving}
                  />
                  <span>{item.label}</span>
                  <span className="inventory-room-meta">{item.category}</span>
                </label>
              </li>
            ))}
          </ul>
          <button type="button" className="label-action" onClick={handleSaveSelected} disabled={!selectedCount || isSaving}>
            {isSaving ? "Saving…" : `Save ${selectedCount} selected item${selectedCount === 1 ? "" : "s"}`}
          </button>
        </div>
      ) : null}
    </section>
  );
}
