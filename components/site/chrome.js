"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { NativeAccountShell } from "@/components/auth/native-account-shell";
import { useNativeAuth } from "@/components/auth/native-auth-provider";

const DESKTOP_NAV_QUERY = "(min-width: 861px)";

const LANDING_LINKS = [
  { href: "/checklist", label: "PCS Checklist", key: "checklist", protected: true },
  { href: "/organizer", label: "Move Organizer", key: "organizer", protected: true },
  { href: "/bases", label: "Destination Bases", key: "bases", protected: true },
];

const INFO_LINKS = [
  { href: "/", label: "Home", key: "home" },
  { href: "/about", label: "About", key: "about" },
  { href: "/contact", label: "Contact", key: "contact" },
  { href: "/terms", label: "Terms", key: "terms" },
  { href: "/privacy", label: "Privacy", key: "privacy" },
];

function SiteTopBar({ navItems }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const topBarRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_NAV_QUERY);
    const handleChange = (event) => {
      if (event.matches) {
        setMobileOpen(false);
      }
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!topBarRef.current?.contains(event.target)) {
        setMobileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  return (
    <div className="top-bar" ref={topBarRef}>
      <Link className="brand" href="/">
        PCS Pal
      </Link>
      <button
        type="button"
        className="site-nav-toggle"
        aria-expanded={mobileOpen}
        aria-controls="site-primary-nav"
        onClick={() => setMobileOpen((current) => !current)}
      >
        {mobileOpen ? "Close" : "Menu"}
      </button>
      <nav className="site-nav" id="site-primary-nav" data-mobile-open={mobileOpen ? "true" : "false"}>
        {navItems.map((item) =>
          item.disabled ? (
            <a
              key={item.label}
              href="#"
              className="is-disabled"
              aria-disabled="true"
              onClick={(event) => {
                event.preventDefault();
                setMobileOpen(false);
              }}
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={item.active ? "is-active" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          )
        )}
      </nav>
      <NativeAccountShell />
    </div>
  );
}

export function LandingTopBar({ active = "" }) {
  const { user } = useNativeAuth();

  return (
    <SiteTopBar
      navItems={LANDING_LINKS.map((item) => ({
        href: item.href,
        label: item.label,
        active: item.key === active,
        disabled: item.protected && !user,
      }))}
    />
  );
}

export function InfoTopBar({ active = "" }) {
  return (
    <SiteTopBar
      navItems={INFO_LINKS.map((item) => ({
        href: item.href,
        label: item.label,
        active: item.key === active,
      }))}
    />
  );
}

export function SiteHeader({ topBar, children }) {
  return (
    <header className="site-header">
      <div className="container">
        {topBar}
        {children}
      </div>
    </header>
  );
}

export function SiteFooter({ children }) {
  return (
    <footer className="site-footer">
      <div className="container">
        {children}
        <div className="footer-legal-links" data-footer-legal-links="native">
          <Link href="/terms">Terms of Use</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <span className="footer-legal-review">Draft legal pages pending attorney review</span>
        </div>
      </div>
    </footer>
  );
}

export function LegacyRuntimeScripts() {
  return (
    <>
      <Script id="vercel-analytics-queue" strategy="afterInteractive">
        {`window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };`}
      </Script>
      <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
    </>
  );
}

