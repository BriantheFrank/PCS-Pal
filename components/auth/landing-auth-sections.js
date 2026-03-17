"use client";

import Link from "next/link";

import { useNativeAuth } from "@/components/auth/native-auth-provider";

export function LandingAuthSections() {
  const { user, displayName } = useNativeAuth();
  const firstName = displayName.split(/\s+/).filter(Boolean)[0] || "Your";

  return (
    <>
      <div className="info-panel landing-auth-panel">
        <p className="eyebrow">Account Access</p>
        <h2>{user ? "You are signed in and ready to keep moving" : "Pick up your plan where you left off"}</h2>
        <p>
          {user
            ? "Open your account settings to update the planning details tied to you, or jump straight back into the checklist, organizer, or base library."
            : "Sign in securely to keep your checklist, organizer, and destination research tied to your account across devices."}
        </p>
        <div className="landing-auth-actions">
          <Link className="landing-primary-action" href={user ? "/account" : "/sign-in"}>
            {user ? "Manage account" : "Sign in"}
          </Link>
          {!user ? (
            <Link className="auth-create-account-link signup-page-link" href="/create-account">
              Create account
            </Link>
          ) : null}
        </div>
        <p className="landing-note">
          {user
            ? "Your cloud account is active, so the workspace below is ready when you are."
            : "Once you are signed in, your PCS data stays with you across devices."}
        </p>
        {!user ? (
          <p className="landing-note">
            Start with the public <Link href="/military-pcs-checklist">PCS checklist guide</Link>,{" "}
            <Link href="/pcs-move-logistics-planning">logistics planning page</Link>, or{" "}
            <Link href="/bases">destination base research</Link> before you sign in.
          </p>
        ) : null}
      </div>

      {user ? (
        <section className="info-panel landing-workspace">
          <p className="eyebrow">Workspace Ready</p>
          <h2>{firstName}, your plan is ready when you are</h2>
          <p>
            Head into the part of the move you want to work on next. Your checklist, inventory, and
            logistics details will stay connected to your account.
          </p>
          <div className="card-grid landing-workspace-actions">
            <a className="nav-card" href="/checklist">
              <h3>PCS Checklist</h3>
              <p>Stay ahead of deadlines, paperwork, and the tasks that keep the move on track.</p>
              <span className="card-link">Open checklist</span>
            </a>
            <a className="nav-card" href="/organizer">
              <h3>Move Organizer</h3>
              <p>Keep inventory, labels, itinerary planning, and day-to-day move details in one place.</p>
              <span className="card-link">Open organizer</span>
            </a>
            <a className="nav-card" href="/bases">
              <h3>Destination Bases</h3>
              <p>Review base information while you prepare for the first days and weeks after arrival.</p>
              <span className="card-link">Open base library</span>
            </a>
          </div>
        </section>
      ) : null}
    </>
  );
}


