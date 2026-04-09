"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

import { NativeAccountShell } from "@/components/auth/native-account-shell";
import { primaryPublicNavLinks } from "@/lib/site-config";

function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("pcspal-theme");
    if (stored) {
      document.documentElement.dataset.theme = stored;
      setTheme(stored);
      return;
    }

    const darkPreferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const preferredTheme = darkPreferred ? "dark" : "light";
    setTheme(preferredTheme);
    document.documentElement.dataset.theme = preferredTheme;
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("pcspal-theme", next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}

function PrimaryNav({ pathname, onNavigate }) {
  const navItems = useMemo(() => primaryPublicNavLinks, []);

  return (
    <nav className="primary-nav" aria-label="Primary">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pathname === item.href ? "is-active" : undefined}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function SiteTopBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  return (
    <div className="top-bar" data-mobile-open={mobileOpen}>
      <Link className="skip-link" href="#main-content">
        Skip to content
      </Link>

      <div className="top-bar-left">
        <Link className="brand" href="/" aria-label="PCS Pal home">
          <svg viewBox="0 0 180 28" className="brand-mark" role="img" aria-label="PCS Pal">
            <text x="0" y="20" fill="currentColor" fontSize="22" fontWeight="700">
              PCS Pal
            </text>
          </svg>
        </Link>
      </div>

      <div className="top-bar-center desktop-only">
        <PrimaryNav pathname={pathname} />
      </div>

      <div className="top-bar-right desktop-only">
        <ThemeToggle />
        <NativeAccountShell pathname={pathname} />
      </div>

      <button
        type="button"
        className="site-nav-toggle"
        aria-expanded={mobileOpen}
        aria-controls="mobile-site-nav"
        aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setMobileOpen((value) => !value)}
      >
        {mobileOpen ? "Close" : "Menu"}
      </button>

      <nav
        id="mobile-site-nav"
        className="site-nav"
        data-mobile-open={mobileOpen}
        aria-label="Mobile navigation"
      >
        <PrimaryNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        <div className="mobile-nav-controls">
          <ThemeToggle />
          <NativeAccountShell mobile pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </div>
      </nav>
    </div>
  );
}

export function LandingTopBar() {
  return <SiteTopBar />;
}

export function InfoTopBar() {
  return <SiteTopBar />;
}

export function SiteHeader({ topBar, children }) {
  return (
    <header className="site-header">
      <div className="container">
        {topBar || <SiteTopBar />}
        {children}
      </div>
    </header>
  );
}

export function SiteFooter({ children }) {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <section>
          <p className="eyebrow">PCS Pal</p>
          <p>Military move planning that keeps your family one step ahead.</p>
          <Link
            className="landing-secondary-action"
            href="/contact?topic=general_feedback&message=General%20feedback%3A%20"
          >
            Share Feedback
          </Link>
        </section>
        <nav aria-label="Plan your move">
          <h3>Plan Your Move</h3>
          <ul className="footer-link-list">
            <li><Link href="/how-to-plan-a-military-pcs-move">Start Here</Link></li>
            <li><Link href="/military-pcs-checklist">Checklist</Link></li>
            <li><Link href="/pcs-inventory-label-tracking">Inventory</Link></li>
            <li><Link href="/pcs-move-logistics-planning">Logistics</Link></li>
          </ul>
        </nav>
        <nav aria-label="Resources">
          <h3>Resources</h3>
          <ul className="footer-link-list">
            <li><Link href="/bases">Base Guides</Link></li>
            <li><Link href="/pcs-glossary">PCS Glossary</Link></li>
            <li><Link href="/military-pcs-checklist">Guides & Articles</Link></li>
          </ul>
        </nav>
        <nav aria-label="Account and company links">
          <h3>Account & About</h3>
          <ul className="footer-link-list">
            <li><Link href="/sign-in">Sign In</Link></li>
            <li><Link href="/create-account">Create Account</Link></li>
            <li><Link href="/dashboard">My Move</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/terms">Terms of Use</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
          </ul>
        </nav>
      </div>
      {children}
      <div className="footer-legal-links">
        PCS Pal is intended as an informational planning tool. Always confirm official requirements
        with your installation and command channels.
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
      <Script src="https://unpkg.com/lucide@latest" strategy="afterInteractive" />
    </>
  );
}
