import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { GUIDE_SLUGS, getGuidePageData } from "@/lib/guides/page-data";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Military PCS Checklist Guide";
const description =
  "Use this military PCS checklist guide to organize orders, briefings, DEERS updates, advance pay decisions, travel prep, and arrival-week tasks before your next duty-station move.";

const relatedLinks = [
  {
    href: "/how-to-plan-a-military-pcs-move",
    title: "How to plan a military PCS move",
    description: "Use a stage-by-stage PCS planning framework before the moving parts stack up.",
  },
  {
    href: "/pcs-inventory-label-tracking",
    title: "PCS inventory and label tracking",
    description: "Build the room, box, and high-value-item record before pack-out day.",
  },
  {
    href: "/pcs-move-logistics-planning",
    title: "PCS move logistics planning",
    description: "Keep movers, lodging, travel stops, and delivery dates tied to the same plan.",
  },
  {
    href: "/bases",
    title: "Military destination base research",
    description: "Research installation arrival resources before you reach the first reporting week.",
  },
];

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/military-pcs-checklist",
  keywords: [
    "military PCS checklist",
    "Permanent Change of Station checklist",
    "PCS move checklist",
    "military relocation checklist",
    "PCS planning guide",
  ],
});

export default function MilitaryPcsChecklistPage() {
  const guideCards = GUIDE_SLUGS.map((slug) => getGuidePageData(slug)).filter(Boolean);

  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/military-pcs-checklist",
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="pcs-checklist-guide" />}>
        <p className="eyebrow">Military PCS Checklist</p>
        <h1>Build a PCS checklist before the move becomes reactive</h1>
        <p className="subtitle">
          A Permanent Change of Station move is easier to control when orders, briefing steps, money
          decisions, family prep, and arrival tasks all sit in one visible sequence.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <section className="info-panel legal-page-section">
          <h2>What a strong PCS checklist should cover</h2>
          <ul className="legal-page-list">
            <li>Orders review, reporting timelines, and transportation-office deadlines.</li>
            <li>Briefings, DEERS or RAPIDS updates, and admin tasks that usually get split across offices.</li>
            <li>Household prep, inventory planning, and travel-week coordination for spouses and families.</li>
            <li>Arrival-week tasks such as lodging, housing, check-in, and first-stop resource links.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Checklist steps PCS Pal already covers in detail</h2>
          <div className="card-grid">
            {guideCards.map((guide) => (
              <Link className="nav-card" href={guide.routePath} key={guide.slug}>
                <h3>{guide.title}</h3>
                <p>{guide.description}</p>
                <span className="card-link">Read this checklist step</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="info-panel legal-page-section">
          <h2>How to use this checklist in practice</h2>
          <ol className="legal-page-list">
            <li>Start with the steps tied directly to orders and reporting dates.</li>
            <li>Move next into household prep so inventory and pack-out planning start early enough.</li>
            <li>Layer travel and arrival details only after the early admin deadlines are visible.</li>
            <li>Keep official links close so the checklist stays useful when you are away from a desk.</li>
          </ol>
          <p>
            When you want the synced version of the checklist, open the protected{" "}
            <Link className="text-link" href="/checklist">
              PCS checklist workspace
            </Link>{" "}
            after signing in.
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
          Checklist guidance is public here, while the synced planning workspace remains available
          after sign-in.
        </p>
      </SiteFooter>
    </>
  );
}
