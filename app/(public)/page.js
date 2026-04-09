import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { CardLink } from "@/components/site/card-link";
import { buildPageMetadata } from "@/lib/metadata";
import {
  buildOrganizationSchema,
  buildWebPageSchema,
  buildWebSiteSchema,
} from "@/lib/structured-data";

const title = "Military PCS Move Planning Guide";
const description =
  "PCS Pal helps military families plan a PCS with a clear checklist, inventory tracker, travel and arrival planning, and base guides.";

const START_HERE_CARDS = [
  {
    href: "/military-pcs-checklist",
    title: "Checklist",
    body: "Track what needs to happen before pack-out, during travel, and after arrival.",
    cta: "Start with the checklist",
  },
  {
    href: "/pcs-inventory-label-tracking",
    title: "Inventory",
    body: "Keep room-by-room lists, label boxes, and note high-value items for easier unpacking and claims.",
    cta: "Organize your inventory",
  },
  {
    href: "/pcs-move-logistics-planning",
    title: "Logistics",
    body: "Plan travel, lodging, arrival timing, and the first tasks you need to handle at the new duty station.",
    cta: "Plan travel and arrival",
  },
  {
    href: "/bases",
    title: "Base Guides",
    body: "Find the most useful arrival information for your installation, including lodging, housing, transportation, and important offices.",
    cta: "Explore base guides",
  },
];

const COMMON_QUESTIONS = [
  {
    label: "What should I hand-carry instead of packing?",
    href: "/guides/hand-carry-essentials",
  },
  {
    label: "What documents do I need for housing, medical, and school?",
    href: "/guides/pcs-documents-checklist",
  },
  {
    label: "What happens if household goods are delayed?",
    href: "/pcs-move-logistics-planning",
  },
  {
    label: "How do I prepare for a move with kids or pets?",
    href: "/guides/moving-with-kids-and-pets",
  },
  {
    label: "What should I do in the first week after arrival?",
    href: "/bases",
  },
];

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/",
  keywords: [
    "military PCS planning",
    "PCS checklist",
    "PCS inventory",
    "PCS logistics planning",
    "military base guides",
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

      <SiteHeader topBar={<LandingTopBar active="home" />}>
        <p className="eyebrow">PCS Pal</p>
        <h1>Plan your PCS move with less stress and fewer surprises</h1>
        <p className="subtitle">
          PCS Pal helps military families organize the move, keep track of household goods, plan travel and
          arrival, and quickly find the base information they will actually need.
        </p>
      </SiteHeader>

      <main className="container" id="main-content">
        <section className="landing-hero info-panel">
          <div className="landing-hero-copy">
            <div className="landing-workspace-actions">
              <Link className="landing-primary-action" href="/military-pcs-checklist">
                Start your move plan
              </Link>
              <Link className="landing-secondary-action" href="/bases">
                Explore base guides
              </Link>
            </div>
            <p className="landing-note">
              New to PCS moves? Start with the checklist. It walks you through what to do first, what to
              keep with you, and what families commonly forget.
            </p>
          </div>
        </section>

        <section className="info-panel landing-link-hub" aria-labelledby="start-here-title">
          <div className="landing-link-hub-heading">
            <h2 id="start-here-title">Not sure where to begin? Start here.</h2>
            <p>You do not need to solve the whole move today. Just start with the next step.</p>
          </div>
          <div className="card-grid">
            {START_HERE_CARDS.map((card) => (
              <CardLink
                key={card.href}
                href={card.href}
                title={card.title}
                description={card.body}
                cta={card.cta}
              />
            ))}
          </div>
        </section>

        <section className="info-panel home-questions" aria-labelledby="common-questions-title">
          <h2 id="common-questions-title">Common PCS questions, answered</h2>
          <ul className="home-question-list">
            {COMMON_QUESTIONS.map((question) => (
              <li key={question.label}>
                <Link className="text-link" href={question.href}>
                  {question.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="info-panel" aria-labelledby="value-block-title">
          <h2 id="value-block-title">Built for real PCS stress points</h2>
          <ul className="legal-page-list">
            <li>Keep major move tasks in one place.</li>
            <li>Track what was packed and where it went.</li>
            <li>Save important arrival links and base information.</li>
            <li>Reduce the odds of forgotten documents, missing items, or last-minute scrambling.</li>
          </ul>
        </section>

        <section className="info-panel" aria-labelledby="account-title">
          <h2 id="account-title">Create an account to save your move</h2>
          <p>
            Use an account if you want your checklist, inventory, and plans to stay synced across devices.
          </p>
          <div className="landing-workspace-actions">
            <Link className="landing-primary-action" href="/create-account">
              Create account
            </Link>
            <Link className="landing-secondary-action" href="/sign-in">
              Sign in
            </Link>
          </div>
          <p className="landing-note">You can still browse the public guides without an account.</p>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">
          Start with the checklist, then move through inventory, logistics, and base guides one step at a
          time.
        </p>
      </SiteFooter>
    </>
  );
}
