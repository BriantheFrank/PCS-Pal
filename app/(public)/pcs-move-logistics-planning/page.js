import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "PCS Move Logistics Planning";
const description =
  "Use this PCS move logistics planning guide to keep packers, lodging, travel stops, delivery dates, and arrival-week coordination organized during a military move.";

const relatedLinks = [
  {
    href: "/how-to-plan-a-military-pcs-move",
    title: "How to plan a military PCS move",
    description: "See where logistics planning fits in the larger PCS timeline.",
  },
  {
    href: "/inventory",
    title: "Move inventory workspace",
    description: "Open inventory to track rooms, labels, and special items tied to move logistics.",
  },
  {
    href: "/bases",
    title: "Military destination base research",
    description: "Save installation lodging, housing, transportation, and newcomer links before travel day.",
  },
  {
    href: "/pcs-glossary",
    title: "PCS glossary",
    description: "Decode terms like HHG, PPM, DEERS, and RAPIDS in plain English.",
  },
];

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/pcs-move-logistics-planning",
  keywords: [
    "PCS logistics",
    "military move logistics",
    "PCS travel planning",
    "PCS lodging planning",
    "household goods delivery planning",
  ],
});

export default function LogisticsLandingPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/pcs-move-logistics-planning",
        })}
      />

      <SiteHeader topBar={<LandingTopBar />}>
        <p className="eyebrow">PCS Logistics Planning</p>
        <h1>Keep movers, travel dates, and arrival-week handoffs in one plan</h1>
        <p className="subtitle">
          PCS logistics gets easier when packing, travel, delivery, lodging, and first-week base
          tasks all live in the same timeline instead of scattered notes.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <section className="info-panel legal-page-section">
          <h2>Core logistics details to track</h2>
          <ul className="legal-page-list">
            <li>Packing and delivery windows from the transportation or HHG (household goods) workflow.</li>
            <li>Travel-day dates, overnight stops, and arrival timing for family members and pets.</li>
            <li>Temporary lodging plans while housing, shipment delivery, or check-in details settle.</li>
            <li>Installation-specific first-week tasks such as reporting, transportation, and DEERS (family benefits and ID records system) or ID-card support.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Why PCS logistics breaks down</h2>
          <p>
            Families usually know the big dates, but the move becomes stressful when small handoffs
            get buried: the packer window, the lodging confirmation, the delivery estimate, the base
            check-in address, and the backup stop if arrival day changes.
          </p>
          <p>
            PCS Pal’s logistics workspace is meant to keep those details visible together, while the
            public planning layer here helps clarify what needs to be tracked in the first place.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Use base research before the travel week</h2>
          <p>
            The public <Link className="text-link" href="/bases">destination base research</Link> pages
            are designed to support logistics planning. Save lodging, housing, transportation, clinic,
            and newcomer links before the move starts moving quickly.
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
          Public logistics guidance is here; the working logistics planner stays available behind sign-in.
        </p>
      </SiteFooter>
    </>
  );
}
