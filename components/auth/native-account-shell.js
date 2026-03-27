"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";

const WORKSPACE_LINKS = [
  { href: "/checklist", label: "PCS Checklist" },
  { href: "/inventory", label: "Move Inventory" },
  { href: "/logistics", label: "Move Logistics" },
  { href: "/organizer", label: "Organizer Hub" },
  { href: "/bases", label: "Destination Bases" },
];

export function NativeAccountShell() {
  const { status, user, displayName, providerLabel, errorMessage, signOut } = useNativeAuth();
  const [open, setOpen] = useState(false);
  const [logoutStatus, setLogoutStatus] = useState({
    message: "",
    tone: "neutral",
  });
  const detailsRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!detailsRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!user) {
      setLogoutStatus({
        message: "",
        tone: "neutral",
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    setLogoutStatus({
      message: "Signing out...",
      tone: "neutral",
    });

    const { error } = await signOut();
    if (error) {
      setLogoutStatus({
        message: error.message,
        tone: "error",
      });
      return;
    }

    setLogoutStatus({
      message: "Signed out. Local mode remains available.",
      tone: "neutral",
    });
    setOpen(false);
  };

  return (
    <div className="auth-panel">
      <details className="auth-details" open={open} ref={detailsRef}>
        <summary
          className="auth-summary"
          onClick={(event) => {
            event.preventDefault();
            setOpen((current) => !current);
          }}
        >
          Account
        </summary>
        <div className="auth-card">
          {!user ? (
            <>
              <p className="auth-status" data-tone={status === "error" ? "error" : "neutral"}>
                {status === "error"
                  ? errorMessage || "Cloud sign-in is unavailable right now. Please try again later."
                  : "Sign in with email to sync your checklist, inventory, and logistics across devices."}
              </p>
              <div className="auth-shell-links">
                <Link
                  className="auth-create-account-link"
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  className="auth-create-account-link auth-create-account-link-secondary"
                  href="/create-account"
                  onClick={() => setOpen(false)}
                >
                  Create account
                </Link>
              </div>
            </>
          ) : (
            <>
              <section className="account-summary">
                <h3>Signed in</h3>
                <dl className="account-meta">
                  <div>
                    <dt>Name</dt>
                    <dd>{displayName}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{user.email || ""}</dd>
                  </div>
                  <div>
                    <dt>Access</dt>
                    <dd>{providerLabel}</dd>
                  </div>
                </dl>
              </section>
              <div className="auth-shell-links">
                <Link className="auth-create-account-link" href="/account" onClick={() => setOpen(false)}>
                  Account settings
                </Link>
                {WORKSPACE_LINKS.map((link) => (
                  <a
                    key={link.href}
                    className="auth-create-account-link auth-create-account-link-secondary"
                    href={link.href}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <p className="auth-status" data-tone={logoutStatus.tone}>
                {logoutStatus.message || `Signed in as ${displayName}.`}
              </p>
              <button type="button" className="auth-shell-button" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          )}
        </div>
      </details>
    </div>
  );
}
