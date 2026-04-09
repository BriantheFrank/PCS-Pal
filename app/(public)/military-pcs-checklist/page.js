import Link from "next/link";

import { GuidedPageIntro, PageStepNav } from "@/components/site/guided-page-intro";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { CardLink } from "@/components/site/card-link";
import { GUIDE_SLUGS, getGuidePageData } from "@/lib/guides/page-data";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Military PCS Checklist Guide";
const description =
  "Use this military PCS checklist guide to keep track of what happens before, during, and after your PCS move.";

const relatedLinks = [
  {
    href: "/pcs-inventory-label-tracking",
    title: "Inventory",
    description: "Keep your rooms, boxes, and high-priority items organized for pack-out and delivery.",
  },
  {
    href: "/pcs-move-logistics-planning",
    title: "Logistics",
    description: "Map travel days, temporary lodging, and arrival-week timing in one place.",
  },
  {
    href: "/bases",
    title: "Base Guides",
    description: "Review lodging, housing, transportation, and first-stop offices before you arrive.",
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
        <p className="eyebrow">Checklist</p>
        <h1>Keep your PCS tasks clear from orders to arrival</h1>
        <p className="subtitle">
          PCS moves add tasks fast. This checklist keeps critical actions visible from orders through your first week after arrival.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout" id="main-content">
        <GuidedPageIntro
          purpose="Track 34 core PCS tasks by phase so your move plan stays complete and organized."
          bestFor="First-time movers, families moving with kids, and anyone trying to stay organized before pack-out and arrival."
          startBy="Adding your orders date, report date, and the documents you know you will need to keep with you."
          nextStepLabel="Build your inventory"
          nextStepHref="/pcs-inventory-label-tracking"
        />

        <section className="info-panel legal-page-section">
          <h2>Checklist steps PCS Pal already covers in detail</h2>
          <div className="card-grid">
            {guideCards.map((guide) => (
              <CardLink
                key={guide.slug}
                href={guide.routePath}
                title={guide.title}
                description={guide.description}
                cta="Read this checklist step"
              />
            ))}
          </div>
        </section>

        <section className="info-panel legal-page-section">
          <h2>What a strong PCS checklist should cover</h2>
          <ul className="legal-page-list">
            <li>Orders review, reporting timelines, and transportation-office deadlines.</li>
            <li>Briefings, DEERS or RAPIDS updates, and admin tasks that often span multiple offices.</li>
            <li>Household prep, inventory planning, and travel-week coordination for the whole family.</li>
            <li>Arrival-week tasks such as lodging, housing, check-in, and first-stop office links.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Related pages</h2>
          <div className="card-grid">
            {relatedLinks.map((link) => (
              <CardLink
                key={link.href}
                href={link.href}
                title={link.title}
                description={link.description}
                cta="Open page"
              />
            ))}
          </div>
        </section>

        <PageStepNav
          previousLabel="Start Here"
          previousHref="/how-to-plan-a-military-pcs-move"
          nextLabel="Inventory"
          nextHref="/pcs-inventory-label-tracking"
        />
      </main>

      <SiteFooter>
        <p className="footer-tip">When you are ready, sign in to save checklist progress across devices.</p>
      </SiteFooter>
    </>
  );
}
