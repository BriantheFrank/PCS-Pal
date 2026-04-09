import Link from "next/link";

import { GuidedPageIntro, PageStepNav } from "@/components/site/guided-page-intro";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "PCS Move Logistics Planning";
const description =
  "Use this page to map travel, lodging, arrival timing, and your first tasks at a new duty station.";

const relatedLinks = [
  {
    href: "/military-pcs-checklist",
    title: "Checklist",
    description: "Keep your admin timeline and family to-dos visible while travel plans change.",
  },
  {
    href: "/pcs-inventory-label-tracking",
    title: "Inventory",
    description: "Track what was packed so delivery and unpacking decisions are easier on arrival.",
  },
  {
    href: "/bases",
    title: "Base Guides",
    description: "Review lodging, housing, transportation, and key offices before travel day.",
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

      <SiteHeader topBar={<LandingTopBar active="logistics-guide" />}>
        <p className="eyebrow">Logistics</p>
        <h1>Plan travel and arrival details in one place</h1>
        <p className="subtitle">
          Travel dates, lodging, HHG timing, and first-week appointments are easier to manage when they are planned together in one timeline.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <GuidedPageIntro
          purpose="Coordinate travel windows, temporary lodging, and early in-processing tasks in one logistics plan."
          bestFor="Families coordinating travel days, temporary lodging, check-in timing, and arrival-week planning."
          startBy="Adding your expected travel window, temporary lodging plan, and first-day arrival priorities."
          nextStepLabel="Review base guides"
          nextStepHref="/bases"
        />

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
          previousLabel="Inventory"
          previousHref="/pcs-inventory-label-tracking"
          nextLabel="Base Guides"
          nextHref="/bases"
        />
      </main>

      <SiteFooter>
        <p className="footer-tip">Sign in when you want your travel and arrival plan saved across devices.</p>
      </SiteFooter>
    </>
  );
}
