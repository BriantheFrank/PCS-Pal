"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";

const LOADING_MESSAGE = "Loading your move organizer.";
const REDIRECT_MESSAGE = "Redirecting to sign in so you can open your organizer.";
const ERROR_MESSAGE = "Organizer access is unavailable right now. Please try again in a moment.";

const getPossessiveFirstName = (displayName) => {
  const firstName = String(displayName || "")
    .split(/\s+/)
    .filter(Boolean)[0];

  if (!firstName) {
    return "";
  }

  return firstName.endsWith("s") ? `${firstName}'` : `${firstName}'s`;
};

export function OrganizerHeading() {
  const { displayName } = useNativeAuth();
  const possessiveName = getPossessiveFirstName(displayName);
  const heading = possessiveName ? `${possessiveName} Move Organizer` : "Move Organizer";

  return <h1>{heading}</h1>;
}

export function NativeOrganizerPage() {
  const router = useRouter();
  const { status, user, errorMessage } = useNativeAuth();

  useEffect(() => {
    if (status === "ready" && !user) {
      router.replace("/sign-in?next=/organizer");
    }
  }, [router, status, user]);

  if (status === "loading") {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">Move Organizer</p>
          <h2>Loading your organizer</h2>
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
          <p className="eyebrow">Move Organizer</p>
          <h2>Organizer access is unavailable</h2>
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
          <p className="eyebrow">Move Organizer</p>
          <h2>Redirecting to sign in</h2>
          <p className="signup-page-status" aria-live="polite">
            {REDIRECT_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="card-grid">
        <a className="nav-card" href="/inventory">
          <h2>Move Inventory</h2>
          <p>Organize rooms, boxes, and household items for your move.</p>
          <span className="card-link">Open inventory -&gt;</span>
        </a>
        <a className="nav-card" href="/logistics">
          <h2>Move Logistics</h2>
          <p>Track movers, dates, and delivery details in one place.</p>
          <span className="card-link">Open logistics -&gt;</span>
        </a>
      </section>

      <section className="info-panel organizer-native-note">
        <p className="eyebrow">Organizer Status</p>
        <h2>The organizer hub, inventory, and logistics now run on the Next side.</h2>
        <p>
          Use this page as the protected hub for the native inventory and logistics workspaces.
          Inventory labels, itinerary planning, custom events, and logistics sync now stay under
          the migrated native shell while the rest of the legacy bridge continues covering the
          remaining tool phases.
        </p>
