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

const CORE_TOOLS = [
  {
    href: "/checklist",
    title: "PCS Checklist",
    body: "Track what must get done before, during, and after your move.",
    cta: "Open checklist",
  },
  {
    href: "/inventory",
    title: "Inventory & Labels",
    body: "Keep rooms, boxes, and high-value items organized with printable labels.",
    cta: "Open inventory",
  },
  {
    href: "/logistics",
    title: "Logistics Planner",
    body: "Track travel days, appointments, and arrival milestones in one timeline.",
    cta: "Open logistics",
  },
  {
    href: "/bases",
    title: "Base Guides",
    body: "Research your next duty station with practical arrival info.",
    cta: "Browse bases",
  },
];

const MOVE_STAGES = [
  { title: "Before the move", detail: "Start your checklist and collect key documents." },
  { title: "Packing and inventory", detail: "Track rooms, boxes, and high-value items." },
  { title: "Travel and arrival", detail: "Plan route, lodging, and check-in appointments." },
  { title: "Settling in", detail: "Use base guides for housing, services, and local setup." },
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
        <h1>Plan your military move in one place.</h1>
        <p className="subtitle">
          PCS Pal helps military families stay organized with a checklist, inventory tracking, logistics planning, and base research.
        </p>
        <div className="landing-workspace-actions">
          <Link className="landing-primary-action" href="/create-account">
            Create account
          </Link>
          <Link className="landing-secondary-action" href="/dashboard">
            Open move planner
          </Link>
        </div>
      </SiteHeader>

      <main className="container" id="main-content">
        <section className="info-panel landing-link-hub" aria-labelledby="tools-title">
          <div className="landing-link-hub-heading">
            <h2 id="tools-title">Core tools for your move</h2>
            <p>Start with one tool now and pick up where you left off anytime.</p>
          </div>
          <div className="card-grid">
            {CORE_TOOLS.map((card) => (
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

        <section className="info-panel" aria-labelledby="stages-title">
          <h2 id="stages-title">How PCS Pal helps through each move stage</h2>
          <div className="card-grid">
            {MOVE_STAGES.map((stage) => (
              <article className="nav-card" key={stage.title}>
                <h3>{stage.title}</h3>
                <p>{stage.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="info-panel" aria-labelledby="base-preview-title">
          <h2 id="base-preview-title">Destination research without the guesswork</h2>
          <p>
            Base guides highlight housing, nearby towns, key offices, and practical links so you can prepare before travel day.
          </p>
          <Link className="text-link" href="/bases">
            Explore destination base guides →
          </Link>
        </section>

        <section className="info-panel" aria-labelledby="closing-cta-title">
          <h2 id="closing-cta-title">Ready to start your move plan?</h2>
          <p>Create an account to save progress across checklist, inventory, logistics, and base research.</p>
          <div className="landing-workspace-actions">
            <Link className="landing-primary-action" href="/create-account">
              Get started
            </Link>
            <Link className="landing-secondary-action" href="/sign-in">
              Sign in
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
