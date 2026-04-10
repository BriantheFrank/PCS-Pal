"use client";

import { useEffect, useState } from "react";

const INVENTORY_STORAGE_KEY = "pcspal-public-inventory-v1";
const LOGISTICS_STORAGE_KEY = "pcspal-public-logistics-v1";
const CHECKLIST_STORAGE_KEY = "pcspal-checklist-state-v1";

const defaults = {
  rooms: 0,
  items: 0,
  highValue: 0,
  logisticsFields: 0,
};

function readJson(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function DashboardSnapshotCards() {
  const [stats, setStats] = useState(defaults);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const inventory = readJson(INVENTORY_STORAGE_KEY, { rooms: [] });
    const logistics = readJson(LOGISTICS_STORAGE_KEY, {});
    const checklist = readJson(CHECKLIST_STORAGE_KEY, {});

    const rooms = inventory.rooms?.length || 0;
    const items = (inventory.rooms || []).reduce((sum, room) => sum + (room.items || []).length, 0);
    const highValue = (inventory.rooms || []).reduce(
      (sum, room) => sum + (room.items || []).filter((item) => item.highValue).length,
      0,
    );

    const sectionEvents = Object.values(logistics.sections || {}).filter((section) =>
      Object.values(section || {}).some((value) => String(value || "").trim())
    ).length;
    const logisticsFields = sectionEvents + (logistics.customEvents?.length || 0);

    setStats({ rooms, items, highValue, logisticsFields });
    setChecklistProgress({
      completed: Object.values(checklist).filter(Boolean).length,
      total: Object.keys(checklist).length,
    });
    setIsLoading(false);
  }, []);

  const [checklistProgress, setChecklistProgress] = useState({ completed: 0, total: 0 });
  const percent = checklistProgress.total
    ? Math.round((checklistProgress.completed / checklistProgress.total) * 100)
    : 0;
  const roomLabel = `${stats.rooms} ${stats.rooms === 1 ? "room" : "rooms"} tracked`;
  const taskLabel = checklistProgress.total
    ? `${checklistProgress.total} total tasks (${checklistProgress.completed} complete)`
    : "Checklist not started yet";

  const cards = [
    { title: "Checklist progress", value: taskLabel, note: "Start with your next required task." },
    { title: "Inventory rooms", value: roomLabel, note: `${stats.items} items listed (${stats.highValue} high value).` },
    { title: "Logistics readiness", value: `${stats.logisticsFields} events saved`, note: "Includes move consult and custom events." },
  ];

  return (
    <div className="card-grid dashboard-summary-grid">
      <article className="nav-card dashboard-stat-card">
        <p className="eyebrow">Overall move progress</p>
        <h3>{percent}% complete</h3>
        <progress max={100} value={percent} aria-label="Overall move progress" />
        <p>You&apos;re {percent}% through your move plan — great start.</p>
      </article>
      {isLoading ? (
        Array.from({ length: 3 }).map((_, idx) => (
          <article className="nav-card dashboard-stat-card skeleton-card" key={`skeleton-${idx}`} aria-hidden="true" />
        ))
      ) : (
        cards.map((card) => (
          <article className="nav-card dashboard-stat-card" key={card.title}>
            <p className="eyebrow">{card.title}</p>
            <h3>{card.value}</h3>
            <p>{card.note}</p>
          </article>
        ))
      )}
    </div>
  );
}
