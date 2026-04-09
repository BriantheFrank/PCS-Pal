"use client";

import { useEffect, useState } from "react";

const INVENTORY_STORAGE_KEY = "pcspal-public-inventory-v1";
const LOGISTICS_STORAGE_KEY = "pcspal-public-logistics-v1";

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

  useEffect(() => {
    const inventory = readJson(INVENTORY_STORAGE_KEY, { rooms: [] });
    const logistics = readJson(LOGISTICS_STORAGE_KEY, {});

    const rooms = inventory.rooms?.length || 0;
    const items = (inventory.rooms || []).reduce((sum, room) => sum + (room.items || []).length, 0);
    const highValue = (inventory.rooms || []).reduce(
      (sum, room) => sum + (room.items || []).filter((item) => item.highValue).length,
      0,
    );

    const logisticsSections = [logistics.timeline || {}, logistics.lodging || {}, logistics.shipment || {}, logistics.priorities || {}];
    const logisticsFields = logisticsSections.reduce(
      (sum, section) => sum + Object.values(section).filter(Boolean).length,
      0,
    );

    setStats({ rooms, items, highValue, logisticsFields });
  }, []);

  const cards = [
    { title: "Checklist progress", value: "34 tasks available", note: "Start with your next required task." },
    { title: "Inventory rooms", value: `${stats.rooms} rooms tracked`, note: `${stats.items} items listed (${stats.highValue} high value).` },
    { title: "Logistics readiness", value: `${stats.logisticsFields} details saved`, note: "Add travel and arrival milestones." },
  ];

  return (
    <div className="card-grid dashboard-summary-grid">
      {cards.map((card) => (
        <article className="nav-card dashboard-stat-card" key={card.title}>
          <p className="eyebrow">{card.title}</p>
          <h3>{card.value}</h3>
          <p>{card.note}</p>
        </article>
      ))}
    </div>
  );
}
