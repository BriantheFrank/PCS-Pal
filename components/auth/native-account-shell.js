"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";

const AUTH_ENTRY_PATHS = new Set(["/sign-in", "/create-account", "/forgot-password"]);

export function NativeAccountShell({
  mobile = false,
  onNavigate,
  pathname = "",
  forcePublicActions = false,
}) {
  const { user, status, signOut } = useNativeAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const shellRef = useRef(null);
  const menuId = useId();

  const isAuthEntry = AUTH_ENTRY_PATHS.has(pathname);
  const shouldUsePublicMenu = forcePublicActions || isAuthEntry || status !== "ready" || !user;

  const menuItems = useMemo(
    () =>
      shouldUsePublicMenu
        ? [
            { href: "/sign-in", label: "Sign In" },
            { href: "/create-account", label: "Create Account" },
          ]
        : [
            { href: "/dashboard", label: "My Move Dashboard" },
            { href: "/account", label: "Settings" },
          ],
    [shouldUsePublicMenu]
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const closeOnOutside = (event) => {
      if (!shellRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("focusin", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("focusin", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
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
    router.push("/?signed_out=1");
  };

  return (
    <div
      className={`account-shell${mobile ? " is-mobile" : ""}`}
      ref={shellRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <button
        id={`${menuId}-trigger`}
        type="button"
        className="account-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={`${menuId}-menu`}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>Account</span>
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
      <div
        id={`${menuId}-menu`}
        className="account-menu"
        role="menu"
        aria-hidden={!open}
        hidden={!open}
      >
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
        {!shouldUsePublicMenu ? (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void handleSignOut();
            }}
          >
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
