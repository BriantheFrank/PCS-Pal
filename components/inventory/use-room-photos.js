"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  deleteRoomPhoto,
  listRoomPhotos,
  MAX_ROOM_PHOTOS,
  saveRoomPhotos,
} from "@/lib/room-photo-storage";

const initialStatus = { message: "", tone: "neutral" };

export const useRoomPhotos = ({ userId, moveProfile, roomId, roomName }) => {
  const [photos, setPhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(initialStatus);

  const moveScopeKey = useMemo(
    () =>
      `${String(userId || "")}:${String(moveProfile?.destination_base_id || "")}:${String(moveProfile?.move_month || "")}:${String(moveProfile?.move_stage || "")}`,
    [userId, moveProfile?.destination_base_id, moveProfile?.move_month, moveProfile?.move_stage]
  );

  const refresh = useCallback(() => {
    if (typeof window === "undefined" || !userId || !roomId) {
      setPhotos([]);
      return;
    }

    void listRoomPhotos({
        userId,
        moveProfile,
        roomId,
      }).then((nextPhotos) => setPhotos(nextPhotos || []));
  }, [moveScopeKey, moveProfile, roomId, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPhotos = useCallback(
    async (fileList) => {
      if (!fileList?.length) {
        return;
      }
      if (!userId || !roomId || typeof window === "undefined") {
        setStatus({
          message: "Missing room or account context. Refresh and try again.",
          tone: "error",
        });
        return;
      }

      setIsSaving(true);
      setStatus(initialStatus);
      try {
        const result = await saveRoomPhotos({
          files: Array.from(fileList),
          userId,
          moveProfile,
          roomId,
          roomName,
        });

        refresh();
        if (!result.addedCount) {
          setStatus({
            message: "Those photos already exist for this room on this device.",
            tone: "neutral",
          });
          return;
        }

        setStatus({
          message:
            result.addedCount === 1
              ? "1 photo saved locally to this room."
              : `${result.addedCount} photos saved locally to this room.`,
          tone: "success",
        });

        if (result.skippedOversized || result.reachedRoomLimit) {
          const details = [];
          if (result.skippedOversized) {
            details.push(`${result.skippedOversized} large photo${result.skippedOversized === 1 ? " was" : "s were"} skipped`);
          }
          if (result.reachedRoomLimit) {
            details.push(`room limit is ${MAX_ROOM_PHOTOS} photos`);
          }
          setStatus({
            message: `${result.addedCount} saved locally. ${details.join("; ")}.`,
            tone: "neutral",
          });
        }
      } catch (error) {
        setStatus({
          message: error?.message || "Unable to save room photos on this device right now.",
          tone: "error",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [moveScopeKey, refresh, roomId, roomName, userId]
  );

  const removePhoto = useCallback(
    async (photoId) => {
      if (!userId || !roomId || typeof window === "undefined") {
        return;
      }

      try {
        await deleteRoomPhoto({
          userId,
          moveProfile,
          roomId,
          photoId,
        });
        refresh();
        setStatus({ message: "Photo removed from this device.", tone: "success" });
      } catch (error) {
        setStatus({
          message: error?.message || "Unable to remove this photo right now.",
          tone: "error",
        });
      }
    },
    [moveScopeKey, refresh, roomId, userId]
  );

  return {
    photos,
    photoCount: photos.length,
    isSaving,
    status,
    addPhotos,
    removePhoto,
  };
};
