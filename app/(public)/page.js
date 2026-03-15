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

const title = "PCS Pal";
const description =
  "Keep your PCS checklist, household inventory, destination research, and move details together so the plan is easier to pick back up from any device.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/",
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
          Keep your checklist, household inventory, destination research, and move details in one
          place so you can pick the plan back up from any device.
        </p>
      </SiteHeader>

      <main className="container">
        <section className="landing-hero">
          <div className="info-panel landing-hero-copy">
            <p className="eyebrow">A Steady Starting Point</p>
            <h2>Start planning here, then move through the rest with more confidence</h2>
            <p>
              A PCS move asks a lot at once. PCS Pal keeps the moving pieces in one place so
              deadlines, household details, and arrival plans are easier to track when life is
              already full.
            </p>
            <p>
              When you sign in, your progress stays tied to your account, so the checklist,
              organizer, and logistics details are ready when you come back.
            </p>
          </div>

          <LandingAuthSections />
        </section>

        <section className="card-grid" id="what-is-inside">
          <article className="nav-card landing-preview-card">
            <h2>Checklist Tracking</h2>
            <p>Keep service-member and family tasks in one place so everyone can see what is next.</p>
          </article>
          <article className="nav-card landing-preview-card">
            <h2>Inventory and Labels</h2>
            <p>Build a room-by-room record before pack-out so important items are easier to track.</p>
          </article>
          <article className="nav-card landing-preview-card">
            <h2>Logistics and Travel</h2>
            <p>
              Keep tabs on packers, delivery windows, overnight stops, and the details that can slip
              through the cracks.
            </p>
          </article>
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
            open, while your planning details stay signed in and attached to your account.
          </p>
          <p>
            Learn more <Link className="text-link" href="/about">about PCS Pal</Link> or use the{" "}
            <Link className="text-link" href="/contact">contact page</Link> to share founder or
            reviewer feedback.
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
