"use client";

import Link from "next/link";
import { useState } from "react";

import { PageStepNav } from "@/components/site/guided-page-intro";
import { pcsGeneralLinks } from "@/lib/bases/pcs-community-links";

const getResultsMessage = ({ items, searchValue, stateValue, branchValue, visibleCount }) => {
  if (visibleCount === items.length && !searchValue && !stateValue && !branchValue) {
    return `Showing ${items.length} of ${items.length} installations.`;
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
  if (branchValue) {
    filters.push(branchValue);
  }

  return `Showing ${visibleCount} of ${items.length} installations${
    filters.length ? ` for ${filters.join(" and ")}` : ""
  }.`;
};

export function BasesHeading() {
  const heading = "Base Guides";

  return <h1>{heading}</h1>;
}

export function NativeBasesPage({ items }) {
  const [searchValue, setSearchValue] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [branchValue, setBranchValue] = useState("");

  const normalizedQuery = searchValue.trim().toLowerCase();
  const uniqueStates = Array.from(new Set(items.map((item) => item.state).filter(Boolean))).sort(
    (left, right) => left.localeCompare(right)
  );
  const uniqueBranches = Array.from(new Set(items.map((item) => item.branch).filter(Boolean))).sort(
    (left, right) => left.localeCompare(right)
  );
  const visibleItems = items.filter((item) => {
    const matchesQuery = !normalizedQuery || item.searchText.includes(normalizedQuery);
    const matchesState = !stateValue || item.state === stateValue;
    const matchesBranch = !branchValue || item.branch === branchValue;
    return matchesQuery && matchesState && matchesBranch;
  });
  const resultsMessage = getResultsMessage({
    items,
    searchValue: searchValue.trim(),
    stateValue,
    branchValue,
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
            <p>Find your installation fast, verify the name, and preview what each guide includes.</p>
          </div>
          <span className="mobile-disclosure-hint" aria-hidden="true"></span>
        </summary>
        <div className="mobile-disclosure-body">
          <p>
            Open a base guide to find practical first-week resources for lodging, housing,
            transportation, medical and ID-card support, and local arrival basics.
          </p>
          <p>
            Some installations are known by more than one name depending on the source or what
            families are used to calling them. We include common naming references to make guides
            easier to find.
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
            Search by installation, old or new installation names, state, or major unit so the next
            base guide is easier to reach on a phone.
          </p>
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
          <label className="base-browser-field" htmlFor="base-branch-filter">
            Filter by branch
            <select
              id="base-branch-filter"
              value={branchValue}
              onChange={(event) => setBranchValue(event.target.value)}
            >
              <option value="">All branches</option>
              {uniqueBranches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
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
            <p className="base-state">{item.branch}</p>
            {item.aliases?.length ? (
              <p className="inventory-notes">Also commonly known as {item.aliases.join(", ")}</p>
            ) : null}
            <p className="base-label">Major units</p>
            <ul className="base-units">
              {item.units.map((unit) => (
                <li key={unit}>{unit}</li>
              ))}
            </ul>
            <p className="base-label">Guide preview</p>
            <ul className="base-units">
              {(item.previewSections || []).map((section) => (
                <li key={`${item.slug}-${section}`}>{section}</li>
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
      <section className="info-panel base-browser-panel">
        <p>
          Don&apos;t see your installation?{" "}
          <Link
            className="text-link"
            href="/contact?topic=suggest_feature&message=I%27d%20like%20to%20request%20a%20base%20guide%20for%3A%20"
          >
            Request a base guide →
          </Link>
        </p>
      </section>

      <PageStepNav
        previousLabel="Logistics"
        previousHref="/pcs-move-logistics-planning"
        nextLabel="Review Your Full Plan"
        nextHref="/how-to-plan-a-military-pcs-move"
      />
    </main>
  );
}
