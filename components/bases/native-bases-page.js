"use client";

import Link from "next/link";
import { useState } from "react";

import { PageStepNav } from "@/components/site/guided-page-intro";
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
    filters.push(`\"${searchValue}\"`);
  }
  if (stateValue) {
    filters.push(stateValue);
  }

  return `${visibleCount} base guide${visibleCount === 1 ? "" : "s"} shown${
    filters.length ? ` for ${filters.join(" and ")}` : ""
  }.`;
};

export function BasesHeading() {
  return <h1>Find your next duty station faster</h1>;
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
      <section className="info-panel legal-page-section" aria-label="How to use base guides">
        <p>
          <strong>What this page helps with:</strong> Use this page to quickly find the most important
          arrival information for your installation, including lodging, housing, transportation, and key
          offices.
        </p>
        <p>
          <strong>Best for:</strong> Families trying to get familiar with a new duty station before
          travel or shortly after arrival.
        </p>
        <p>
          <strong>Start by:</strong> Choosing your installation and reviewing lodging, housing, and
          first-stop offices.
        </p>
        <p>
          <strong>Next likely step:</strong>{" "}
          <Link className="text-link" href="/contact">
            Contact us with gaps you want covered
          </Link>
        </p>
      </section>

      <section className="info-panel base-browser-panel" aria-labelledby="base-browser-title">
        <div className="base-browser-header">
          <p className="eyebrow">Quick Find</p>
          <h2 id="base-browser-title">Search and narrow the base list</h2>
          <p>Search by installation, state, or major unit to quickly open the guide you need.</p>
        </div>
        <div className="base-browser-controls">
          <label className="base-browser-field" htmlFor="base-search">
            Search bases
            <input
              id="base-search"
              type="search"
              placeholder="Fort Bragg, Texas, 82nd Airborne"
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
            listed on each base detail page when a vetted group is available.
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

      <PageStepNav
        previousLabel="Logistics"
        previousHref="/pcs-move-logistics-planning"
        nextLabel="Contact"
        nextHref="/contact"
      />
    </main>
  );
}
