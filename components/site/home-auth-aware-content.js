"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useNativeAuth } from "@/components/auth/native-auth-provider";

export function HomeAuthAwareContent({ compact = false }) {
  const { status, user } = useNativeAuth();
  const params = useSearchParams();
  const isSignedIn = status === "ready" && Boolean(user);

  if (compact) {
    if (isSignedIn) {
      return (
        <div className="landing-workspace-actions">
          <Link className="landing-primary-action" href="/dashboard">My Dashboard</Link>
        </div>
      );
    }
    return (
      <div className="landing-workspace-actions">
        <Link className="landing-primary-action" href="/create-account">Get started</Link>
        <Link className="landing-secondary-action" href="/sign-in">Sign in</Link>
      </div>
    );
  }

  return (
    <>
      {params.get("signed_out") === "1" ? (
        <p className="auth-status" data-tone="success">You’re signed out. We’ll be here when you’re ready.</p>
      ) : null}
      <p className="eyebrow">PCS Pal</p>
      <h1>You’re carrying the move. PCS Pal keeps you organized.</h1>
      <p className="subtitle">
        Built for military spouses juggling kids, schedules, and orders — keep checklist tasks,
        inventory, logistics, and base details in one calm workspace.
      </p>
      <div className="landing-workspace-actions">
        {isSignedIn ? (
          <Link className="landing-primary-action" href="/dashboard">My Dashboard</Link>
        ) : (
          <>
            <Link className="landing-primary-action" href="/create-account">Create Account</Link>
            <Link className="landing-secondary-action" href="/sign-in">Sign In</Link>
          </>
        )}
      </div>
    </>
  );
}
