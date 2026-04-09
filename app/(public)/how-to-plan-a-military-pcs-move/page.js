import Link from "next/link";

import { GuidedPageIntro } from "@/components/site/guided-page-intro";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Start Here: Plan Your Military PCS Move";
const description =
  "Start your PCS plan with a simple order: checklist first, inventory second, logistics third, and base guides before arrival.";

const planningStages = [
  {
    title: "1. Checklist",
    copy: "Start with dates, must-do tasks, and documents you need to keep with you.",
    href: "/military-pcs-checklist",
  },
  {
    title: "2. Inventory",
    copy: "Track rooms, labels, and high-priority items before pack-out.",
    href: "/pcs-inventory-label-tracking",
  },
  {
    title: "3. Logistics",
    copy: "Map travel days, lodging, and arrival-week handoffs.",
    href: "/pcs-move-logistics-planning",
  },
  {
    title: "4. Base Guides",
    copy: "Save local housing, lodging, and first-stop office links before you travel.",
    href: "/bases",
  },
];

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/how-to-plan-a-military-pcs-move",
  keywords: [
    "start PCS move",
    "PCS getting started",
    "military relocation planning",
    "Permanent Change of Station planning",
    "PCS move guide",
  ],
});

export default function PcsPlanningGuidePage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/how-to-plan-a-military-pcs-move",
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="home" />}>
        <p className="eyebrow">Start Here</p>
        <h1>New to PCS planning? Use this simple order.</h1>
        <p className="subtitle">You do not need to solve everything today. Start with one step, then move to the next.</p>
      </SiteHeader>

      <main className="container legal-page-layout" id="main-content">
        <GuidedPageIntro
          purpose="Give you a clear PCS sequence from orders to arrival so nothing critical is missed."
          bestFor="First-time movers and experienced families who want a calm reset plan."
          startBy="Completing the first 24-48 hour actions, then moving through checklist, inventory, logistics, and base research."
          nextStepLabel="Open Checklist"
          nextStepHref="/military-pcs-checklist"
        />
        <section className="info-panel legal-page-section">
          <h2>How long do I have?</h2>
          <p>Many CONUS PCS moves run roughly 30-90 days from orders to report date, but timelines can move faster.</p>
          <p>Start immediately with orders review, transportation scheduling, and document prep.</p>
        </section>
        <section className="info-panel legal-page-section">
          <h2>What to do right now (first 24-48 hours)</h2>
          <ul className="legal-page-list">
            <li>Review report date, gaining unit, and transportation instructions.</li>
            <li>Notify your household and begin collecting must-carry documents.</li>
            <li>Set your next planning checkpoint on the checklist page.</li>
          </ul>
        </section>
        <section className="info-panel legal-page-section">
          <h2>Your four-step PCS plan</h2>
          <div className="card-grid">
            {planningStages.map((stage) => (
              <Link className="nav-card" href={stage.href} key={stage.href}>
                <h3>{stage.title}</h3>
                <p>{stage.copy}</p>
                <span className="card-link">Open this step</span>
              </Link>
            ))}
          </div>
        </section>
        <section className="info-panel legal-page-section">
          <h2>PCS timeline at a glance</h2>
          <ol className="legal-page-list">
            <li>Orders received</li>
            <li>Pre-pack-out prep</li>
            <li>Travel week</li>
            <li>In-processing at new station</li>
          </ol>
          <p>
            New to acronyms? Open the <Link className="text-link" href="/pcs-glossary">PCS Glossary</Link>.
          </p>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">Use this page as your quick guide whenever the move starts to feel overwhelming.</p>
      </SiteFooter>
    </>
  );
}
