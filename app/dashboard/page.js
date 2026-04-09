import Link from "next/link";

import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Dashboard",
  description: "Your PCS move dashboard.",
  pathname: "/dashboard",
  noindex: true,
});

export default function DashboardPage() {
  return (
    <>
      <SiteHeader topBar={<LandingTopBar />}>
        <p className="eyebrow">My Move</p>
        <h1>Your PCS Move Dashboard</h1>
        <p className="subtitle">Track progress, dates, and jump back into your next planning step.</p>
      </SiteHeader>
      <main className="container" id="main-content">
        <section className="info-panel legal-page-section">
          <h2>Quick access</h2>
          <div className="card-grid">
            <Link className="nav-card" href="/military-pcs-checklist">Checklist</Link>
            <Link className="nav-card" href="/pcs-inventory-label-tracking">Inventory</Link>
            <Link className="nav-card" href="/pcs-move-logistics-planning">Logistics</Link>
            <Link className="nav-card" href="/bases">Base Guides</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
