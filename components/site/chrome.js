"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

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
    setTheme(darkPreferred ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("pcspal-theme", next);
  };

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

function SiteTopBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = primaryPublicNavLinks;

  return (
    <div className="top-bar">
      <Link className="skip-link" href="#main-content">
        Skip to content
      </Link>
      <Link className="brand" href="/" aria-label="PCS Pal home">
        <svg viewBox="0 0 180 28" className="brand-mark" role="img" aria-label="PCS Pal">
          <text x="0" y="20" fill="currentColor" fontSize="22" fontWeight="700">
            PCS Pal
          </text>
        </svg>
      </Link>
      <button
        type="button"
        className="site-nav-toggle"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
      >
        ☰
      </button>
      <nav className="site-nav" data-mobile-open={mobileOpen}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? "is-active" : undefined}
            onClick={() => setMobileOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <ThemeToggle />
        <NativeAccountShell mobile onNavigate={() => setMobileOpen(false)} />
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
        <div>
          <p className="eyebrow">PCS Pal</p>
          <p>Military move planning that keeps your family one step ahead.</p>
          <Link
            className="landing-secondary-action"
            href="/contact?topic=general_feedback&message=General%20feedback%3A%20"
          >
            Share Feedback
          </Link>
        </div>
        <div>
          <h3>Plan Your Move</h3>
          <Link href="/how-to-plan-a-military-pcs-move">Start Here</Link>
          <Link href="/military-pcs-checklist">Checklist</Link>
          <Link href="/pcs-inventory-label-tracking">Inventory</Link>
          <Link href="/pcs-move-logistics-planning">Logistics</Link>
        </div>
        <div>
          <h3>Resources</h3>
          <Link href="/bases">Base Guides</Link>
          <Link href="/pcs-glossary">PCS Glossary</Link>
          <Link href="/military-pcs-checklist">Guides & Articles</Link>
        </div>
        <div>
          <h3>Account & About</h3>
          <Link href="/sign-in">Sign In</Link>
          <Link href="/create-account">Create Account</Link>
          <Link href="/dashboard">My Move</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/terms">Terms of Use</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </div>
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
