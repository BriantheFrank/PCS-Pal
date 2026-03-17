import Link from "next/link";

import { LandingAuthSections } from "@/components/auth/landing-auth-sections";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import {
  buildOrganizationSchema,
  buildWebPageSchema,
  buildWebSiteSchema,
} from "@/lib/structured-data";

const title = "Military PCS Planning Checklist and Move Organizer";
const description =
  "Plan a military PCS move with public checklist guidance, inventory and logistics planning pages, destination base research, and a synced organizer built for service members and families.";

const PRIMARY_SEARCH_LINKS = [
  {
    href: "/military-pcs-checklist",
    title: "Military PCS Checklist",
    description: "Use the public checklist guide to organize orders, briefings, travel prep, and arrival tasks.",
    cta: "Open the checklist guide",
  },
  {
    href: "/pcs-inventory-label-tracking",
    title: "PCS Inventory and Label Tracking",
    description: "See how to plan room-by-room inventory, label logic, and high-value item tracking before pack-out.",
    cta: "Open inventory planning",
  },
  {
    href: "/pcs-move-logistics-planning",
    title: "PCS Move Logistics Planning",
    description: "Keep movers, lodging, delivery windows, travel stops, and arrival-week handoffs in one plan.",
    cta: "Open logistics planning",
  },
  {
    href: "/bases",
    title: "Military Destination Base Research",
    description: "Research Army duty stations and save arrival, housing, transportation, and lodging links before you travel.",
    cta: "Open base research",
  },
  {
    href: "/how-to-plan-a-military-pcs-move",
    title: "How to Plan a Military PCS Move",
    description: "Follow a practical stage-by-stage framework for checklists, inventory, logistics, and destination prep.",
    cta: "Open the planning guide",
  },
];

const SUPPORTING_PUBLIC_LINKS = [
  {
    href: "/about",
    title: "About PCS Pal",
    description: "See how PCS Pal fits into a military move-planning workflow and what is live today.",
    cta: "Read the product overview",
  },
  {
    href: "/contact",
    title: "Contact",
    description: "Use the public contact path for reviewer notes, bug reports, and launch-readiness questions.",
    cta: "Open the contact page",
  },
  {
    href: "/terms",
    title: "Terms of Use",
    description: "Review the current draft rules, disclaimers, and scope of the service before relying on it.",
    cta: "Review the terms",
  },
  {
    href: "/privacy",
    title: "Privacy Policy",
    description: "Read how account data, planning data, and consent choices are handled in the current product.",
    cta: "Read the privacy policy",
  },
];

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/",
  keywords: [
    "military PCS planning",
    "PCS checklist",
    "PCS move organizer",
    "PCS inventory",
    "military base research",
    "PCS logistics planning",
  ],
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd data={buildWebSiteSchema()} />
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/",
        })}
      />

      <SiteHeader topBar={<LandingTopBar />}>
        <p className="eyebrow">PCS Pal - An Athenaeum Group Solution</p>
        <h1>A calmer place to plan your PCS move</h1>
        <p className="subtitle">
          Plan a military PCS move with public guides for checklist, inventory, logistics, and base
          research, then save the working details to a synced planner when you sign in.
        </p>
      </SiteHeader>

      <main className="container">
        <section className="landing-hero">
          <div className="info-panel landing-hero-copy">
            <p className="eyebrow">A Steady Starting Point</p>
            <h2>Start planning here, then move through the rest with more confidence</h2>
            <p>
              A Permanent Change of Station move asks a lot at once. PCS Pal keeps the checklist,
              household details, inventory, travel notes, and destination research closer together so
              the move is easier to restart after interruptions.
            </p>
            <p>
              Start with the public planning pages below, then sign in when you want the synced
              checklist, organizer, inventory, logistics workspace, and account-linked progress.
            </p>
          </div>

          <LandingAuthSections />
        </section>

        <section className="card-grid" id="what-is-inside">
          <Link className="nav-card landing-preview-card" href="/military-pcs-checklist">
            <h2>Checklist Tracking</h2>
            <p>Map service-member and family tasks in a public PCS checklist before deadlines start stacking up.</p>
            <span className="card-link">Open the checklist guide</span>
          </Link>
          <Link className="nav-card landing-preview-card" href="/pcs-inventory-label-tracking">
            <h2>Inventory and Labels</h2>
            <p>Build a room-by-room record before pack-out so boxes, labels, and high-value items are easier to track.</p>
            <span className="card-link">Open inventory planning</span>
          </Link>
          <Link className="nav-card landing-preview-card" href="/pcs-move-logistics-planning">
            <h2>Logistics and Travel</h2>
            <p>
              Keep tabs on packers, delivery windows, overnight stops, and the arrival-week details
              that can slip through the cracks.
            </p>
            <span className="card-link">Open logistics planning</span>
          </Link>
        </section>

        <section className="info-panel landing-link-hub" aria-labelledby="public-pages-title">
          <div className="landing-link-hub-heading">
            <p className="eyebrow">Public PCS Planning Pages</p>
            <h2 id="public-pages-title">Use the public pages as search-friendly entry points into PCS planning</h2>
            <p>
              These pages are the crawlable reference points for military PCS checklist work,
              inventory planning, logistics coordination, base research, and the broader product story.
            </p>
          </div>
          <div className="card-grid">
            {PRIMARY_SEARCH_LINKS.map((link) => (
              <Link className="nav-card" href={link.href} key={link.href}>
                <h3>{link.title}</h3>
                <p>{link.description}</p>
                <span className="card-link">{link.cta}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="info-panel landing-link-hub" aria-labelledby="supporting-pages-title">
          <div className="landing-link-hub-heading">
            <p className="eyebrow">Supporting Public Pages</p>
            <h2 id="supporting-pages-title">Product context, contact, and legal pages</h2>
            <p>
              These supporting pages explain what PCS Pal is, how to contact the team, and how the
              current legal framework is structured while the product is still being refined.
            </p>
          </div>
          <div className="card-grid">
            {SUPPORTING_PUBLIC_LINKS.map((link) => (
              <Link className="nav-card" href={link.href} key={link.href}>
                <h3>{link.title}</h3>
                <p>{link.description}</p>
                <span className="card-link">{link.cta}</span>
              </Link>
            ))}
          </div>
        </section>

        <details
          className="recommended-order mobile-disclosure"
          id="how-it-works"
          data-mobile-collapse="true"
          open
        >
          <summary className="mobile-disclosure-summary">
            <div>
              <h2>A simple way to work through the move</h2>
              <p>Most families get the clearest plan by working through the move in stages.</p>
            </div>
            <span className="mobile-disclosure-hint" aria-hidden="true"></span>
          </summary>
          <div className="mobile-disclosure-body">
            <div className="recommended-list landing-steps">
              <div>
                <h3>1. Start with the checklist</h3>
                <p>
                  Map the deadlines, admin tasks, and family to-dos so everyone knows what comes
                  next.
                </p>
              </div>
              <div>
                <h3>2. Build the inventory as you go</h3>
                <p>
                  Capture rooms, boxes, and high-value items before pack-out so the inventory is
                  useful for planning and claims.
                </p>
              </div>
              <div>
                <h3>3. Tie it together with logistics</h3>
                <p>
                  Keep movers, travel plans, and key handoff dates aligned so the move feels more
                  manageable.
                </p>
              </div>
            </div>
          </div>
        </details>

        <section className="info-panel">
          <h2>Built for service members and families in transition</h2>
          <p>
            PCS Pal is meant to make a demanding move feel more organized. The landing page stays
            open, while the synced planning details stay signed in and attached to your account.
          </p>
          <p>
            Start with the <Link className="text-link" href="/how-to-plan-a-military-pcs-move">PCS planning guide</Link>, the{" "}
            <Link className="text-link" href="/military-pcs-checklist">military PCS checklist</Link>, and the{" "}
            <Link className="text-link" href="/bases">destination base research</Link> pages. Learn more{" "}
            <Link className="text-link" href="/about">about PCS Pal</Link>, use the{" "}
            <Link className="text-link" href="/contact">contact page</Link> to share founder or
            reviewer feedback, and review the public{" "}
            <Link className="text-link" href="/terms">Terms of Use</Link> and{" "}
            <Link className="text-link" href="/privacy">Privacy Policy</Link> before creating an
            account.
          </p>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">
          Tip: Sign in early if you want to pick your plan back up from another device later.
        </p>
        <p className="footer-disclaimer">
          PCS Pal supports planning, but it does not replace official guidance from transportation
          offices, housing, finance, or your command.
        </p>
      </SiteFooter>
    </>
  );
}
