"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";

const LOADING_MESSAGE = "Loading your plans";
const REDIRECT_MESSAGE = "Opening sign-in";
const ERROR_MESSAGE = "We could not load this section right now. Please refresh and try again. If the problem continues, use the contact page to let us know.";

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
          <h2>We could not load your organizer</h2>
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
        <p className="eyebrow">Move Organizer</p>
        <h2>Choose where to continue your move plan</h2>
        <p>
          Sign in to save your plans and return to them later. Use Inventory for room-by-room item
          tracking and Logistics for dates, contacts, and arrival-week coordination.
        </p>
      </section>
    </main>
  );
}
