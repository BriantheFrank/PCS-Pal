"use client";

import Link from "next/link";
import { useState } from "react";

import { pcsGeneralLinks } from "@/lib/bases/pcs-community-links";

const getResultsMessage = ({ items, searchValue, stateValue, visibleCount }) => {
  if (visibleCount === items.length && !searchValue && !stateValue) {
    return `${items.length} base guides available.`;
  }

  if (visibleCount === 0) {
    return "No bases match that search yet. Try a different installation, unit, or location.";
  }

  const filters = [];
  if (searchValue) {
    filters.push(`"${searchValue}"`);
  }
  if (stateValue) {
    filters.push(stateValue);
  }

  return `${visibleCount} base guide${visibleCount === 1 ? "" : "s"} shown${
    filters.length ? ` for ${filters.join(" and ")}` : ""
  }.`;
};

export function BasesHeading() {
  const heading = "Military Destination Base Research";

  return <h1>{heading}</h1>;
}

export function NativeBasesPage({ items }) {
  const [searchValue, setSearchValue] = useState("");
  const [stateValue, setStateValue] = useState("");

  const normalizedQuery = searchValue.trim().toLowerCase();
  const uniqueStates = Array.from(new Set(items.map((item) => item.state).filter(Boolean))).sort(
    (left, right) => left.localeCompare(right)
  );
  const visibleItems = items.filter((item) => {
    const matchesQuery = !normalizedQuery || item.searchText.includes(normalizedQuery);
    const matchesState = !stateValue || item.state === stateValue;
    return matchesQuery && matchesState;
  });
  const resultsMessage = getResultsMessage({
    items,
    searchValue: searchValue.trim(),
    stateValue,
    visibleCount: visibleItems.length,
  });

  return (
    <main className="container">
      <details
        className="info-panel mobile-disclosure"
        data-mobile-collapse="true"
        open
        aria-labelledby="base-guidance-title"
      >
        <summary className="mobile-disclosure-summary">
          <div>
            <h2 id="base-guidance-title">How to Use Destination Base Information</h2>
            <p>Start with reporting, first-week resources, and the links worth saving before travel day.</p>
          </div>
          <span className="mobile-disclosure-hint" aria-hidden="true"></span>
        </summary>
        <div className="mobile-disclosure-body">
          <p>
            Open a base page to see where arriving Soldiers commonly start, which first-week offices
            matter most, and which links are worth saving before travel day.
          </p>
          <ol>
            <li>Start with the arrival and reporting section so you know where to check in first.</li>
            <li>Save the official links for lodging, housing, medical, transportation, and ID card support.</li>
            <li>Use the Google Maps shortcuts on travel day so you are not hunting for the right building from the parking lot.</li>
          </ol>
          <p>Tip: Save the reception location and at least one backup stop before you get on the road.</p>
        </div>
      </details>

      <section className="info-panel base-browser-panel" aria-labelledby="base-browser-title">
        <div className="base-browser-header">
          <p className="eyebrow">Quick Find</p>
          <h2 id="base-browser-title">Search and narrow the base list</h2>
          <p>
            Search by installation, state, or major unit so the next base guide is easier to reach
            on a phone.
          </p>
        </div>
        <div className="base-browser-controls">
          <label className="base-browser-field" htmlFor="base-search">
            Search bases
            <input
              id="base-search"
              type="search"
              placeholder="Fort Liberty, Texas, 82nd Airborne"
              autoComplete="off"
              enterKeyHint="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </label>
          <label className="base-browser-field" htmlFor="base-state-filter">
            Filter by state or region
            <select
              id="base-state-filter"
              value={stateValue}
              onChange={(event) => setStateValue(event.target.value)}
            >
              <option value="">All locations</option>
              {uniqueStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="base-browser-results" aria-live="polite">
          {resultsMessage}
        </p>
      </section>

      <section className="base-grid" id="base-directory-grid">
        {visibleItems.map((item) => (
          <Link className="base-card" href={item.href} key={item.slug}>
            <h2>{item.title}</h2>
            <p className="base-state">{item.state}</p>
            <p className="base-label">Major units</p>
            <ul className="base-units">
              {item.units.map((unit) => (
                <li key={unit}>{unit}</li>
              ))}
            </ul>
            <span className="card-link base-card-cta">View base details</span>
          </Link>
        ))}
      </section>



      <section className="info-panel base-browser-panel" aria-labelledby="base-helpful-links-title">
        <div className="base-browser-header">
          <p className="eyebrow">Helpful Links and Online Groups</p>
          <h2 id="base-helpful-links-title">Location-agnostic PCS support communities</h2>
          <p>
            Use these resources when you need broad PCS guidance. Base-specific community links are
            listed on each destination base detail page when a vetted group is available.
          </p>
        </div>
        <div className="base-grid">
          {pcsGeneralLinks.map((link) => (
            <a className="base-card" href={link.href} key={link.href} target="_blank" rel="noopener noreferrer">
              <h3>{link.title}</h3>
              <p>{link.description}</p>
              <span className="card-link">Open resource</span>
            </a>
          ))}
        </div>
      </section>

      <section className="info-panel base-browser-panel" aria-labelledby="base-planning-links-title">
        <div className="base-browser-header">
          <p className="eyebrow">Related PCS Planning</p>
          <h2 id="base-planning-links-title">Use base research with the rest of the move plan</h2>
          <p>
            Installation research is most useful when it stays connected to checklist work, travel
            planning, and arrival-week logistics.
          </p>
        </div>
        <div className="card-grid">
          <Link className="nav-card" href="/military-pcs-checklist">
            <h3>Military PCS checklist</h3>
            <p>Keep the administrative and family tasks visible while you research the next base.</p>
            <span className="card-link">Open checklist guide</span>
          </Link>
          <Link className="nav-card" href="/pcs-move-logistics-planning">
            <h3>PCS logistics planning</h3>
            <p>Use arrival-day lodging, delivery, and first-stop details alongside the base guide.</p>
            <span className="card-link">Open logistics planning</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
