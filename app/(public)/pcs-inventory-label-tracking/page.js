import Link from "next/link";

import { GuidedPageIntro, PageStepNav } from "@/components/site/guided-page-intro";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "PCS Inventory and Label Tracking";
const description =
  "Use this page to keep track of what is packed, how boxes are labeled, and which items need better documentation for claims.";

const relatedLinks = [
  {
    href: "/military-pcs-checklist",
    title: "Checklist",
    description: "Track deadlines and must-do tasks before boxes start moving.",
  },
  {
    href: "/pcs-move-logistics-planning",
    title: "Logistics",
    description: "Plan travel, lodging, and arrival-week timing around your shipment windows.",
  },
  {
    href: "/bases",
    title: "Base Guides",
    description: "Save the local links you need for housing, transportation, and first-week offices.",
  },
  {
    href: "/pcs-glossary",
    title: "PCS glossary",
    description: "Look up military acronyms and PCS shorthand in plain English.",
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

      <SiteHeader topBar={<LandingTopBar active="inventory-guide" />}>
        <p className="eyebrow">Inventory</p>
        <h1>Track packed items and labels so unpacking is easier</h1>
        <p className="subtitle">
          Use this page to keep track of what is being packed, how boxes are labeled, and which items
          may need better documentation for claims.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <GuidedPageIntro
          purpose="Use this page to keep track of what is being packed, how boxes are labeled, and which items may need better documentation for claims."
          bestFor="Families trying to stay organized during pack-out, unpacking, and household goods delivery."
          startBy="Adding one room, then list the items you would struggle most to replace first."
          nextStepLabel="Plan travel and arrival"
          nextStepHref="/pcs-move-logistics-planning"
        />

        <section className="info-panel legal-page-section">
          <h2>What to capture in a PCS inventory</h2>
          <ul className="legal-page-list">
            <li>Room-by-room box groupings so unpacking is not guesswork at your next duty station.</li>
            <li>Label conventions that make it obvious which boxes matter most during your first week.</li>
            <li>High-value or fragile items that need extra documentation before the truck is loaded.</li>
            <li>Quick notes for missing pieces, warranty paperwork, or claims follow-up.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Related pages</h2>
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

        <PageStepNav
          previousLabel="Checklist"
          previousHref="/military-pcs-checklist"
          nextLabel="Logistics"
          nextHref="/pcs-move-logistics-planning"
        />
      </main>

      <SiteFooter>
        <p className="footer-tip">Sign in when you want to save your inventory across devices.</p>
      </SiteFooter>
    </>
  );
}
