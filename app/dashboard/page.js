import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { CardLink } from "@/components/site/card-link";
import { DashboardSnapshotCards } from "@/components/site/dashboard-snapshot";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Dashboard",
  description: "Your PCS move dashboard.",
  pathname: "/dashboard",
  noindex: true,
});

const primaryTools = [
  { href: "/checklist", title: "Checklist", description: "Track what needs to be done next.", cta: "Open checklist" },
  { href: "/inventory", title: "Inventory", description: "Manage rooms, boxes, and labels.", cta: "Open inventory" },
  { href: "/logistics", title: "Logistics", description: "Track travel dates and key appointments.", cta: "Open logistics" },
];

const secondaryTools = [
  { href: "/bases", title: "Base Guides", description: "Research your duty station quickly.", cta: "View guides" },
  { href: "/account", title: "Account", description: "Update profile and saved move settings.", cta: "Open account" },
  { href: "/organizer", title: "Organizer Hub", description: "Use the legacy organizer workspace.", cta: "Open organizer" },
];

export default function DashboardPage() {
  return (
    <>
      <SiteHeader topBar={<LandingTopBar />}>
        <p className="eyebrow">My Move</p>
        <h1>Your PCS operations hub</h1>
        <p className="subtitle">Pick up your checklist, inventory, or logistics plan in one tap.</p>
      </SiteHeader>
      <main className="container" id="main-content">
        <section className="info-panel" aria-labelledby="primary-tools-title">
          <h2 id="primary-tools-title">Primary move tools</h2>
          <div className="card-grid">
            {primaryTools.map((link) => (
              <CardLink key={link.href} href={link.href} title={link.title} description={link.description} cta={link.cta} />
            ))}
          </div>
        </section>

        <section className="info-panel" aria-labelledby="snapshot-title">
          <h2 id="snapshot-title">Current move snapshot</h2>
          <DashboardSnapshotCards />
        </section>

        <section className="info-panel" aria-labelledby="secondary-tools-title">
          <h2 id="secondary-tools-title">Supporting tools</h2>
          <div className="card-grid">
            {secondaryTools.map((link) => (
              <CardLink key={link.href} href={link.href} title={link.title} description={link.description} cta={link.cta} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
