import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { CardLink } from "@/components/site/card-link";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Dashboard",
  description: "Your PCS move dashboard.",
  pathname: "/dashboard",
  noindex: true,
});

const summaryCards = [
  { title: "Checklist progress", value: "0 of 34 complete", note: "Start with your next required task." },
  { title: "Inventory rooms", value: "0 rooms tracked", note: "Add one room to begin your inventory." },
  { title: "Upcoming logistics", value: "0 events scheduled", note: "Add travel and arrival milestones." },
];

const quickLinks = [
  { href: "/military-pcs-checklist", title: "Checklist", description: "Track required tasks by phase.", cta: "Open checklist" },
  { href: "/pcs-inventory-label-tracking", title: "Inventory", description: "Capture rooms, labels, and high-value items.", cta: "Open inventory" },
  { href: "/pcs-move-logistics-planning", title: "Logistics", description: "Plan travel, lodging, and first-week tasks.", cta: "Open logistics" },
  { href: "/bases", title: "Base Guides", description: "Research your destination installation.", cta: "View base guides" },
];

export default function DashboardPage() {
  return (
    <>
      <SiteHeader topBar={<LandingTopBar />}>
        <p className="eyebrow">My Move</p>
        <h1>Your PCS Move Dashboard</h1>
        <p className="subtitle">Track progress, dates, and jump back into your next planning step.</p>
      </SiteHeader>
      <main className="container legal-page-layout" id="main-content">
        <section className="info-panel">
          <h2>Move snapshot</h2>
          <div className="card-grid dashboard-summary-grid">
            {summaryCards.map((card) => (
              <article className="nav-card dashboard-stat-card" key={card.title}>
                <p className="eyebrow">{card.title}</p>
                <h3>{card.value}</h3>
                <p>{card.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Quick access</h2>
          <div className="card-grid">
            {quickLinks.map((link) => (
              <CardLink
                key={link.href}
                href={link.href}
                title={link.title}
                description={link.description}
                cta={link.cta}
              />
            ))}
          </div>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Recent activity</h2>
          <p>No recent updates yet. Once you start checking off tasks and adding plans, activity will appear here.</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
