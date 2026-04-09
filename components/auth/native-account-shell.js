"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function NativeAccountShell({ mobile = false, onNavigate }) {
  const { user, signOut } = useNativeAuth();
  const [open, setOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const shellRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const closeOnOutside = (event) => {
      if (!shellRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = shellRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!focusables?.length) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setStatusMessage("Signed out.");
    setOpen(false);
    onNavigate?.();
  };

  const menuItems = user
    ? [
        { href: "/dashboard", label: "My Move Dashboard" },
        { href: "/account", label: "Settings" },
      ]
    : [
        { href: "/sign-in", label: "Sign In" },
        { href: "/create-account", label: "Create Account" },
      ];

  return (
    <div className={`account-shell${mobile ? " is-mobile" : ""}`} ref={shellRef}>
      <button
        type="button"
        className="account-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
      >
        Account
        <svg
          className="account-chevron"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      <div className="account-menu" role="menu" hidden={!open}>
        {menuItems.map((item) => (
          <Link
            role="menuitem"
            key={item.href}
            href={item.href}
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            {item.label}
          </Link>
        ))}
        {user ? (
          <button type="button" role="menuitem" onClick={handleSignOut}>
            Sign Out
          </button>
        ) : null}
        {statusMessage ? (
          <p className="auth-status" data-tone="neutral">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
