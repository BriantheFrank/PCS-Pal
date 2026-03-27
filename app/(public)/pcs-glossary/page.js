import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "PCS Glossary";
const description =
  "PCS moves come with a lot of acronyms and military shorthand. This glossary explains common terms in plain English so it is easier to understand what people mean and what may matter for your move.";

const entries = [
  {
    term: "PCS",
    short: "Permanent Change of Station.",
    detail: "A military relocation to a new duty station.",
  },
  {
    term: "HHG",
    short: "Household Goods.",
    detail: "Your shipped household items, usually handled through transportation offices or contracted movers.",
  },
  {
    term: "PPM",
    short: "Personally Procured Move.",
    detail: "You handle some or all of the move yourself rather than using a full government-managed shipment.",
  },
  {
    term: "DITY",
    short: "Do-It-Yourself move (older term for PPM).",
    detail: "Some families still say DITY even when official offices now use PPM.",
  },
  {
    term: "DEERS",
    short: "Defense Enrollment Eligibility Reporting System.",
    detail: "Tracks family member eligibility for benefits and ID-related records.",
  },
  {
    term: "RAPIDS",
    short: "Real-Time Automated Personnel Identification System.",
    detail: "ID card office system commonly used with DEERS records.",
  },
  {
    term: "EFMP",
    short: "Exceptional Family Member Program.",
    detail: "Program supporting military families with special medical or educational needs.",
  },
  { term: "On-post housing", short: "Housing located on the installation.", detail: "Usually managed through installation housing offices or partners." },
  { term: "Off-post housing", short: "Housing located off the installation.", detail: "Includes rentals and homes in nearby communities." },
  {
    term: "Temporary lodging",
    short: "Short-term lodging during transition.",
    detail: "Used when you arrive before permanent housing is ready.",
  },
  {
    term: "Pack-out",
    short: "The day or period movers box and load your HHG shipment.",
    detail: "Families often prepare photos and labels before pack-out starts.",
  },
  {
    term: "Claims process",
    short: "Formal process to report missing or damaged items.",
    detail: "Clear labels, condition notes, and photos can help if you file a claim.",
  },
  { term: "MPD", short: "Military Personnel Division.", detail: "Handles many installation personnel and in-processing functions." },
  { term: "S1", short: "Unit personnel/admin office.", detail: "Supports unit-level administrative processing and records." },
  { term: "TLE", short: "Temporary Lodging Expense.", detail: "A CONUS lodging-related reimbursement program for qualifying PCS periods." },
  { term: "TLA", short: "Temporary Lodging Allowance.", detail: "Typically tied to OCONUS temporary lodging situations." },
  { term: "CIF", short: "Central Issue Facility.", detail: "Installation facility for issuing and turning in military gear." },
  { term: "AAFES", short: "Army & Air Force Exchange Service.", detail: "Provides exchange retail, fuel, and service operations on many installations." },
];

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/pcs-glossary",
  keywords: ["PCS glossary", "military acronyms", "DEERS RAPIDS", "HHG PPM", "military relocation terms"],
});

export default function PcsGlossaryPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/pcs-glossary",
        })}
      />

      <SiteHeader topBar={<LandingTopBar />}>
        <p className="eyebrow">PCS Reference</p>
        <h1>PCS Glossary</h1>
        <p className="subtitle">
          PCS moves come with a lot of acronyms and military shorthand. This glossary explains common
          terms in plain English so it is easier to understand what people mean and what may matter
          for your move.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <section className="info-panel legal-page-section">
          <h2>Common terms in plain English</h2>
          <p>
            Plain English: People sometimes say &ldquo;go to DEERS&rdquo; when they mean going to an ID
            card office that handles those records.
          </p>
          {entries.map((entry) => (
            <article key={entry.term}>
              <h3>{entry.term}</h3>
              <p>{entry.short}</p>
              <p>{entry.detail}</p>
            </article>
          ))}
        </section>
        <section className="info-panel legal-page-section">
          <h2>Use glossary terms inside planning pages</h2>
          <p>
            When terms first appear in major pages, PCS Pal now includes plain-language context such
            as HHG (household goods shipment) and DEERS (family benefits and ID records system).
          </p>
          <p>
            Continue planning with <Link className="text-link" href="/pcs-move-logistics-planning">Move Logistics</Link>,{" "}
            <Link className="text-link" href="/pcs-inventory-label-tracking">Move Inventory</Link>, and{" "}
            <Link className="text-link" href="/bases">Base Guides</Link>.
          </p>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">Keep this glossary open while planning if acronyms start to pile up.</p>
      </SiteFooter>
    </>
  );
}
