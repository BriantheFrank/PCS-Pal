"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const INVENTORY_STORAGE_KEY = "pcspal-public-inventory-v1";
const LOGISTICS_STORAGE_KEY = "pcspal-public-logistics-v1";

const DEFAULT_ROOMS = ["Living Room", "Kitchen", "Master Bedroom", "Bedroom 2", "Bedroom 3", "Bathroom", "Garage", "Office", "Storage", "Other"];

const DEFAULT_PRIORITIES = [
  { key: "lodging", label: "Check into temporary lodging" },
  { key: "inprocessing", label: "Report to installation or in-processing" },
  { key: "deers", label: "Update DEERS/RAPIDS" },
  { key: "hhg", label: "Schedule HHG delivery" },
  { key: "school", label: "Enroll children in school" },
  { key: "vehicles", label: "Register vehicles if required" },
];

const emptyInventoryState = { rooms: [], updatedAt: "" };

const emptyLogisticsState = {
  timeline: { ordersReceivedDate: "", packOutStart: "", packOutEnd: "", lastDayCurrentHome: "", travelStart: "", expectedArrival: "", reportDate: "" },
  lodging: { lodgingName: "", confirmationNumber: "", checkIn: "", checkOut: "", petStatus: "", notes: "" },
  priorities: Object.fromEntries(DEFAULT_PRIORITIES.map((priority) => [priority.key, false])),
  shipment: { trackingNumber: "", pickupWindow: "", deliveryWindow: "", moverContact: "", claimDeadline: "" },
  updatedAt: "",
};

const readStorage = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const persistStorage = (key, value) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);

const getInventoryTotals = (state) => {
  const totalItems = state.rooms.reduce((sum, room) => sum + room.items.reduce((roomSum, item) => roomSum + item.quantity, 0), 0);
  const estimatedValue = state.rooms.reduce((sum, room) => sum + room.items.reduce((roomSum, item) => roomSum + Number(item.estimatedValue || 0) * Number(item.quantity || 0), 0), 0);
  const highValueCount = state.rooms.reduce((sum, room) => sum + room.items.filter((item) => item.highValue).length, 0);
  return { roomCount: state.rooms.length, totalItems, estimatedValue, highValueCount };
};

const buildCsv = (state) => {
  const header = ["Room", "Item", "Qty", "Estimated Value", "Condition", "Box Label", "Notes", "High Value"];
  const rows = [header];
  state.rooms.forEach((room) => {
    room.items.forEach((item) => {
      rows.push([room.name, item.itemName, String(item.quantity), String(item.estimatedValue), item.condition, item.boxLabel, item.notes, item.highValue ? "Yes" : "No"]);
    });
  });

  return rows.map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(",")).join("\n");
};

const downloadText = (filename, content, type = "text/csv") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export function getPublicInventorySnapshot() {
  const state = readStorage(INVENTORY_STORAGE_KEY, emptyInventoryState);
  const totals = getInventoryTotals(state || emptyInventoryState);
  const lastRoom = (state?.rooms || []).at(-1);
  return { ...totals, latestUpdatedRoom: lastRoom?.name || "Not started" };
}

export function PublicInventoryWorkspace() {
  const [inventory, setInventory] = useState(emptyInventoryState);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);

  useEffect(() => {
    const loaded = readStorage(INVENTORY_STORAGE_KEY, emptyInventoryState);
    setInventory({ ...emptyInventoryState, ...loaded });
  }, []);

  useEffect(() => {
    persistStorage(INVENTORY_STORAGE_KEY, inventory);
  }, [inventory]);

  const totals = useMemo(() => getInventoryTotals(inventory), [inventory]);

  const highValueItems = useMemo(() => inventory.rooms.flatMap((room) => room.items.filter((item) => item.highValue).map((item) => ({ roomName: room.name, itemName: item.itemName, boxLabel: item.boxLabel }))), [inventory]);

  const upsertInventory = (updater) => {
    setInventory((current) => ({ ...updater(current), updatedAt: new Date().toISOString() }));
  };

  const addRoom = (roomName) => {
    const name = roomName || window.prompt("Room name", DEFAULT_ROOMS.find((option) => !inventory.rooms.some((room) => room.name === option)) || "New Room");
    if (!name) return;
    upsertInventory((current) => ({ ...current, rooms: [...current.rooms, { id: crypto.randomUUID(), name: name.trim(), items: [] }] }));
    setActiveRoomIndex(inventory.rooms.length);
  };

  const updateRoom = (roomIndex, updates) => {
    upsertInventory((current) => ({ ...current, rooms: current.rooms.map((room, index) => (index === roomIndex ? { ...room, ...updates } : room)) }));
  };

  const deleteRoom = (roomIndex) => {
    upsertInventory((current) => ({ ...current, rooms: current.rooms.filter((_, index) => index !== roomIndex) }));
    setActiveRoomIndex(0);
  };

  const addItem = (roomIndex) => {
    const itemName = window.prompt("Item name");
    if (!itemName) return;
    upsertInventory((current) => ({
      ...current,
      rooms: current.rooms.map((room, index) =>
        index === roomIndex
          ? { ...room, items: [...room.items, { id: crypto.randomUUID(), itemName, quantity: 1, estimatedValue: "", condition: "Good", boxLabel: "", notes: "", highValue: false }] }
          : room,
      ),
    }));
  };

  const updateItem = (roomIndex, itemIndex, key, value) => {
    upsertInventory((current) => ({
      ...current,
      rooms: current.rooms.map((room, index) =>
        index !== roomIndex ? room : { ...room, items: room.items.map((item, currentItemIndex) => (currentItemIndex === itemIndex ? { ...item, [key]: value } : item)) },
      ),
    }));
  };

  const deleteItem = (roomIndex, itemIndex) => {
    upsertInventory((current) => ({ ...current, rooms: current.rooms.map((room, index) => (index !== roomIndex ? room : { ...room, items: room.items.filter((_, idx) => idx !== itemIndex) })) }));
  };

  const activeRoom = inventory.rooms[activeRoomIndex] || null;

  return (
    <section className="tool-page-shell">
      <p className="sync-banner">Your inventory is saved on this device. Sign in to sync it across devices.</p>
      <div className="tool-action-bar">
        <button type="button" className="label-action" onClick={() => addRoom("")}>Add room</button>
        <button type="button" className="label-action secondary" onClick={() => (inventory.rooms.length ? addItem(activeRoomIndex) : addRoom(""))} disabled={!inventory.rooms.length}>Add item</button>
        <button type="button" className="label-action secondary" onClick={() => window.print()}>Print inventory</button>
        <button type="button" className="label-action secondary" onClick={() => downloadText("pcs-inventory.csv", buildCsv(inventory))}>Download CSV</button>
      </div>

      <div className="tool-summary-grid">
        <article className="tool-summary-card"><p>Rooms tracked</p><strong>{totals.roomCount}</strong></article>
        <article className="tool-summary-card"><p>Total items</p><strong>{totals.totalItems}</strong></article>
        <article className="tool-summary-card"><p>Estimated total value</p><strong>{formatCurrency(totals.estimatedValue)}</strong></article>
        <article className="tool-summary-card"><p>High-value items flagged</p><strong>{totals.highValueCount}</strong></article>
      </div>

      {highValueItems.length > 0 ? <aside className="tool-side-panel"><h3>Items to document before pack-out</h3><ul className="tool-list">{highValueItems.map((item) => <li key={`${item.roomName}-${item.itemName}`}><strong>{item.itemName}</strong> in {item.roomName}{item.boxLabel ? ` (${item.boxLabel})` : ""}</li>)}</ul></aside> : null}

      {inventory.rooms.length === 0 ? (
        <div className="tool-empty-state">
          <p className="tool-empty-icon" aria-hidden="true">📦</p>
          <h3>No rooms added yet</h3>
          <p>Start with the room you’d need to unpack first.</p>
          <button type="button" className="label-action" onClick={() => addRoom("")}>Add your first room</button>
        </div>
      ) : (
        <div className="tool-workspace-grid">
          <aside className="tool-room-nav" aria-label="Rooms">
            {inventory.rooms.map((room, roomIndex) => {
              const roomValue = room.items.reduce((sum, item) => sum + Number(item.estimatedValue || 0) * Number(item.quantity || 0), 0);
              return (
                <article className="tool-room-card" key={room.id}>
                  <button type="button" className="tool-room-toggle" onClick={() => setActiveRoomIndex(roomIndex)}><span>{room.name}</span><small>{room.items.length} items - {formatCurrency(roomValue)}</small></button>
                  <div className="tool-room-actions">
                    <button type="button" className="link-button" onClick={() => addItem(roomIndex)}>Add item</button>
                    <button type="button" className="link-button" onClick={() => { const nextName = window.prompt("Rename room", room.name); if (nextName) updateRoom(roomIndex, { name: nextName.trim() }); }}>Edit</button>
                    <button type="button" className="link-button" onClick={() => deleteRoom(roomIndex)}>Delete</button>
                  </div>
                </article>
              );
            })}
          </aside>

          <section className="tool-main-panel" aria-live="polite">
            <h3>{activeRoom?.name || "Select a room"}</h3>
            {!activeRoom ? null : activeRoom.items.length === 0 ? <p className="tool-muted">No items in this room yet. Add the first item now.</p> : (
              <div className="tool-table-wrapper">
                <table className="tool-table" role="table">
                  <thead><tr><th>Item</th><th>Qty</th><th>Value</th><th>Condition</th><th>Box Label</th><th>Notes</th><th>High Value</th><th>Actions</th></tr></thead>
                  <tbody>
                    {activeRoom.items.map((item, itemIndex) => (
                      <tr key={item.id}>
                        <td><input value={item.itemName} onChange={(event) => updateItem(activeRoomIndex, itemIndex, "itemName", event.target.value)} /></td>
                        <td><input type="number" min="1" value={item.quantity} onChange={(event) => updateItem(activeRoomIndex, itemIndex, "quantity", Number(event.target.value || 1))} /></td>
                        <td><input type="number" min="0" value={item.estimatedValue} onChange={(event) => updateItem(activeRoomIndex, itemIndex, "estimatedValue", Number(event.target.value || 0))} /></td>
                        <td><input value={item.condition} onChange={(event) => updateItem(activeRoomIndex, itemIndex, "condition", event.target.value)} /></td>
                        <td><input value={item.boxLabel} onChange={(event) => updateItem(activeRoomIndex, itemIndex, "boxLabel", event.target.value)} /></td>
                        <td><input value={item.notes} onChange={(event) => updateItem(activeRoomIndex, itemIndex, "notes", event.target.value)} /></td>
                        <td><label className="tool-checkbox"><input type="checkbox" checked={item.highValue} onChange={(event) => updateItem(activeRoomIndex, itemIndex, "highValue", event.target.checked)} /><span>Flag</span></label></td>
                        <td><button type="button" className="link-button" onClick={() => deleteItem(activeRoomIndex, itemIndex)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export function PublicLogisticsWorkspace() {
  const [logistics, setLogistics] = useState(emptyLogisticsState);

  useEffect(() => {
    const loaded = readStorage(LOGISTICS_STORAGE_KEY, emptyLogisticsState);
    setLogistics({ ...emptyLogisticsState, ...loaded });
  }, []);

  useEffect(() => {
    persistStorage(LOGISTICS_STORAGE_KEY, logistics);
  }, [logistics]);

  const inventorySnapshot = useMemo(() => getPublicInventorySnapshot(), [logistics.updatedAt]);

  const filledFieldsCount = useMemo(() => {
    const timelineCount = Object.values(logistics.timeline).filter(Boolean).length;
    const lodgingCount = Object.values(logistics.lodging).filter(Boolean).length;
    const shipmentCount = Object.values(logistics.shipment).filter(Boolean).length;
    const priorityCount = Object.values(logistics.priorities).filter(Boolean).length;
    return timelineCount + lodgingCount + shipmentCount + priorityCount;
  }, [logistics]);

  const hasPlan = filledFieldsCount > 0;

  const updateSection = (section, key, value) => {
    setLogistics((current) => ({ ...current, [section]: { ...current[section], [key]: value }, updatedAt: new Date().toISOString() }));
  };

  return (
    <section className="tool-page-shell logistics-tool-shell">
      <div className="tool-top-grid">
        <article className="tool-main-panel">
          <div className="tool-panel-header-row"><h2>Logistics planner</h2><button type="button" className="label-action">Save logistics plan</button></div>
          {!hasPlan ? <div className="tool-empty-state"><p className="tool-empty-icon" aria-hidden="true">🧭</p><h3>No logistics plan started yet</h3><p>Add your travel dates and lodging first so the rest of your move has a timeline.</p><button type="button" className="label-action" onClick={() => document.getElementById("ordersReceivedDate")?.focus()}>Start logistics plan</button></div> : null}

          <div className="tool-form-section"><h3>Travel timeline</h3><div className="tool-input-grid">
            <label>Orders received date<input id="ordersReceivedDate" type="date" value={logistics.timeline.ordersReceivedDate} onChange={(event) => updateSection("timeline", "ordersReceivedDate", event.target.value)} /></label>
            <label>Pack-out start<input type="date" value={logistics.timeline.packOutStart} onChange={(event) => updateSection("timeline", "packOutStart", event.target.value)} /></label>
            <label>Pack-out end<input type="date" value={logistics.timeline.packOutEnd} onChange={(event) => updateSection("timeline", "packOutEnd", event.target.value)} /></label>
            <label>Last day in current home<input type="date" value={logistics.timeline.lastDayCurrentHome} onChange={(event) => updateSection("timeline", "lastDayCurrentHome", event.target.value)} /></label>
            <label>Travel start<input type="date" value={logistics.timeline.travelStart} onChange={(event) => updateSection("timeline", "travelStart", event.target.value)} /></label>
            <label>Expected arrival<input type="date" value={logistics.timeline.expectedArrival} onChange={(event) => updateSection("timeline", "expectedArrival", event.target.value)} /></label>
            <label>Report/no-later-than date<input type="date" value={logistics.timeline.reportDate} onChange={(event) => updateSection("timeline", "reportDate", event.target.value)} /></label>
          </div></div>

          <div className="tool-form-section"><h3>Temporary lodging</h3><div className="tool-input-grid">
            <label>Hotel/TLF name<input value={logistics.lodging.lodgingName} onChange={(event) => updateSection("lodging", "lodgingName", event.target.value)} /></label>
            <label>Confirmation number<input value={logistics.lodging.confirmationNumber} onChange={(event) => updateSection("lodging", "confirmationNumber", event.target.value)} /></label>
            <label>Check-in<input type="date" value={logistics.lodging.checkIn} onChange={(event) => updateSection("lodging", "checkIn", event.target.value)} /></label>
            <label>Check-out<input type="date" value={logistics.lodging.checkOut} onChange={(event) => updateSection("lodging", "checkOut", event.target.value)} /></label>
            <label>Pet status<input value={logistics.lodging.petStatus} onChange={(event) => updateSection("lodging", "petStatus", event.target.value)} /></label>
            <label>Notes<textarea rows="2" value={logistics.lodging.notes} onChange={(event) => updateSection("lodging", "notes", event.target.value)} /></label>
          </div></div>

          <div className="tool-form-section"><h3>Arrival priorities</h3><ul className="tool-checklist">{DEFAULT_PRIORITIES.map((priority) => <li key={priority.key}><label><input type="checkbox" checked={Boolean(logistics.priorities[priority.key])} onChange={(event) => updateSection("priorities", priority.key, event.target.checked)} /><span>{priority.label}</span></label></li>)}</ul></div>

          <div className="tool-form-section"><h3>Shipment / HHG coordination</h3><div className="tool-input-grid">
            <label>Shipment tracking number<input value={logistics.shipment.trackingNumber} onChange={(event) => updateSection("shipment", "trackingNumber", event.target.value)} /></label>
            <label>Pickup window<input value={logistics.shipment.pickupWindow} onChange={(event) => updateSection("shipment", "pickupWindow", event.target.value)} /></label>
            <label>Delivery window<input value={logistics.shipment.deliveryWindow} onChange={(event) => updateSection("shipment", "deliveryWindow", event.target.value)} /></label>
            <label>Mover phone / contact<input value={logistics.shipment.moverContact} onChange={(event) => updateSection("shipment", "moverContact", event.target.value)} /></label>
            <label>Claim deadline reminder<input type="date" value={logistics.shipment.claimDeadline} onChange={(event) => updateSection("shipment", "claimDeadline", event.target.value)} /></label>
          </div></div>
        </article>

        <aside className="tool-side-panel inventory-snapshot-panel">
          <h3>Household Goods & Inventory Snapshot</h3>
          <dl className="snapshot-grid"><div><dt>Rooms tracked</dt><dd>{inventorySnapshot.roomCount}</dd></div><div><dt>Total items</dt><dd>{inventorySnapshot.totalItems}</dd></div><div><dt>High-value items flagged</dt><dd>{inventorySnapshot.highValueCount}</dd></div><div><dt>Latest updated room</dt><dd>{inventorySnapshot.latestUpdatedRoom}</dd></div></dl>
          <div className="tool-action-column">
            <Link href="/pcs-inventory-label-tracking" className="label-action secondary">Open Full Inventory</Link>
            <Link href="/pcs-inventory-label-tracking" className="label-action secondary">Add Item</Link>
            <button type="button" className="label-action secondary" onClick={() => window.print()}>Print Labels</button>
          </div>
        </aside>
      </div>

      <section className="info-panel tool-reminders"><h3>Helpful reminders</h3><ul className="tool-list"><li>Confirm HHG pickup and delivery windows with your transportation office.</li><li>Keep lodging receipts and claim deadlines easy to find.</li><li>Use arrival priorities as your first-week checklist.</li></ul></section>
    </section>
  );
}
