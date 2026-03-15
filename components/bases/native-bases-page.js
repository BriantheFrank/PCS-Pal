"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";

const LOADING_MESSAGE = "Loading your destination base library.";
const REDIRECT_MESSAGE = "Redirecting to sign in so you can open the base library.";
const ERROR_MESSAGE = "The base library is unavailable right now. Please try again in a moment.";

const getPossessiveFirstName = (displayName) => {
  const firstName = String(displayName || "")
    .split(/\s+/)
    .filter(Boolean)[0];

  if (!firstName) {
    return "";
  }

  return firstName.endsWith("s") ? `${firstName}'` : `${firstName}'s`;
};

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
  const { displayName } = useNativeAuth();
  const possessiveName = getPossessiveFirstName(displayName);
  const heading = possessiveName ? `${possessiveName} Destination Bases` : "Army Duty Stations";

  return <h1>{heading}</h1>;
}

export function NativeBasesPage({ items }) {
  const router = useRouter();
  const { status, user, errorMessage } = useNativeAuth();
  const [searchValue, setSearchValue] = useState("");
  const [stateValue, setStateValue] = useState("");

  useEffect(() => {
    if (status === "ready" && !user) {
      router.replace("/sign-in?next=/bases");
    }
  }, [router, status, user]);

  if (status === "loading") {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">Destination Bases</p>
          <h2>Loading your base library</h2>
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
          <p className="eyebrow">Destination Bases</p>
          <h2>Base access is unavailable</h2>
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
          <p className="eyebrow">Destination Bases</p>
          <h2>Redirecting to sign in</h2>
          <p className="signup-page-status" aria-live="polite">
            {REDIRECT_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

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
          <a className="base-card" href={item.href} key={item.slug}>
            <h2>{item.title}</h2>
            <p className="base-state">{item.state}</p>
            <p className="base-label">Major units</p>
            <ul className="base-units">
              {item.units.map((unit) => (
                <li key={unit}>{unit}</li>
              ))}
            </ul>
            <span className="card-link base-card-cta">View base details</span>
          </a>
        ))}
      </section>
    </main>
  );
}
