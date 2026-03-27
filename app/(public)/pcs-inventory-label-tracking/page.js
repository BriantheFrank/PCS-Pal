import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "PCS Inventory and Label Tracking";
const description =
  "Plan your PCS inventory before pack-out with room-by-room tracking, label logic, high-value-item records, and claims-ready notes for military moves.";

const relatedLinks = [
  {
    href: "/military-pcs-checklist",
    title: "Military PCS checklist guide",
    description: "Map the admin and family tasks that need to happen before boxes start moving.",
  },
  {
    href: "/logistics",
    title: "Move logistics workspace",
    description: "Open the calendar workspace for packers, delivery dates, and travel plans.",
  },
  {
    href: "/how-to-plan-a-military-pcs-move",
    title: "How to plan a military PCS move",
    description: "See how inventory work fits inside the full move-planning sequence.",
  },
];

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/pcs-inventory-label-tracking",
  keywords: [
    "PCS inventory",
    "military move inventory",
    "PCS label tracking",
    "household goods inventory",
    "pack-out inventory checklist",
  ],
});

export default function InventoryLandingPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/pcs-inventory-label-tracking",
        })}
      />

      <SiteHeader topBar={<LandingTopBar />}>
        <p className="eyebrow">PCS Inventory Planning</p>
        <h1>Track rooms, labels, and high-value items before pack-out day</h1>
        <p className="subtitle">
          A clear PCS inventory helps families know what is going, what needs special handling, and
          what will be hardest to track after the movers leave.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <section className="info-panel legal-page-section">
          <h2>What to capture in a PCS inventory</h2>
          <ul className="legal-page-list">
            <li>Room-by-room box groupings so unpacking is not guesswork at the next duty station.</li>
            <li>Label conventions that make it obvious which boxes matter during the first week.</li>
            <li>High-value or fragile items that need extra documentation before the truck is loaded.</li>
            <li>Quick notes for missing pieces, warranty paperwork, or claims follow-up.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>How inventory tracking supports the rest of the move</h2>
          <p>
            Inventory work is easiest when it starts before the movers arrive. It gives the checklist
            more concrete household tasks, gives logistics planning a better sense of what matters on
            travel day, and reduces confusion during delivery and unpacking.
          </p>
          <p>
            PCS Pal keeps the synced inventory workspace behind sign-in, but the planning model is
            straightforward: rooms first, labels second, special items third, then follow-up notes as
            the move progresses.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>When you are ready for the working inventory</h2>
          <p>
            Open the protected <Link className="text-link" href="/inventory">PCS inventory workspace</Link>{" "}
            to save rooms, boxes, high-value items, and label notes to your account.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Related PCS planning pages</h2>
          <div className="card-grid">
            {relatedLinks.map((link) => (
              <Link className="nav-card" href={link.href} key={link.href}>
                <h3>{link.title}</h3>
                <p>{link.description}</p>
                <span className="card-link">Open page</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">
          Inventory tracking works best when it starts before movers arrive and stays connected to the
          checklist and logistics plan.
        </p>
      </SiteFooter>
    </>
  );
}
