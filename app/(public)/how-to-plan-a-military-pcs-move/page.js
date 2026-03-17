import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "How to Plan a Military PCS Move";
const description =
  "Plan a military PCS move in stages: orders and checklist work first, inventory second, logistics third, and destination base research before arrival.";

const planningStages = [
  {
    title: "1. Start with orders, dates, and the PCS checklist",
    copy: "Build the move around reporting dates, required briefings, finance decisions, DEERS updates, and the family tasks that cannot wait until the travel week.",
    href: "/military-pcs-checklist",
  },
  {
    title: "2. Build the inventory before pack-out",
    copy: "Capture rooms, labels, fragile items, and high-value records early enough that the inventory is useful during loading, delivery, and any follow-up claims work.",
    href: "/pcs-inventory-label-tracking",
  },
  {
    title: "3. Tie the move together with logistics planning",
    copy: "Keep movers, overnight stops, lodging, delivery windows, and arrival-week handoffs inside a single timeline so small misses do not compound.",
    href: "/pcs-move-logistics-planning",
  },
  {
    title: "4. Research the destination base before arrival",
    copy: "Save newcomer, housing, transportation, clinic, and lodging links before you need them from the car or the hotel parking lot.",
    href: "/bases",
  },
];

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/how-to-plan-a-military-pcs-move",
  keywords: [
    "how to plan a military PCS move",
    "PCS planning guide",
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

      <SiteHeader topBar={<LandingTopBar active="pcs-planning-guide" />}>
        <p className="eyebrow">PCS Planning Guide</p>
        <h1>How to plan a military PCS move without losing the thread</h1>
        <p className="subtitle">
          The easiest way to calm a PCS move is to work it in stages instead of treating orders,
          inventory, travel, and destination research as separate systems.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <section className="info-panel legal-page-section">
          <h2>A practical four-stage PCS framework</h2>
          <div className="card-grid">
            {planningStages.map((stage) => (
              <Link className="nav-card" href={stage.href} key={stage.href}>
                <h3>{stage.title}</h3>
                <p>{stage.copy}</p>
                <span className="card-link">Open this stage</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Where PCS Pal fits</h2>
          <p>
            PCS Pal is meant to give military families one place to hold the checklist, organizer,
            inventory, logistics notes, and destination base research that normally get fragmented
            across apps, paper, and browser tabs.
          </p>
          <p>
            The public planning pages explain the workflow. The protected planner surfaces exist to
            save that work to an account so it can be picked back up from another device.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Start with the highest-friction part of the move</h2>
          <p>
            If orders and deadlines feel fuzzy, start with the checklist. If the household itself
            feels chaotic, start with inventory. If the move dates are set and the handoffs are the
            hard part, go straight to logistics and destination research.
          </p>
          <p>
            The important thing is to connect those parts early enough that each one informs the next.
          </p>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">
          Use the public planning pages to understand the workflow, then sign in when you want the
          synced planner to carry the details.
        </p>
      </SiteFooter>
    </>
  );
}
