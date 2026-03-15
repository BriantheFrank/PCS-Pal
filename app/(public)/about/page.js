import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { InfoTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "About PCS Pal";
const description =
  "Learn what PCS Pal covers, what stage the product is in today, and how it fits into a military PCS planning workflow.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/about",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/about",
        })}
      />

      <SiteHeader topBar={<InfoTopBar active="about" />}>
        <p className="eyebrow">About PCS Pal</p>
        <h1>Built to make PCS planning easier to hold together</h1>
        <p className="subtitle">
          PCS Pal is an MVP product focused on helping service members and families keep the moving
          pieces in one place without pretending to replace official guidance.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <section className="info-panel legal-page-section">
          <h2>What PCS Pal is trying to solve</h2>
          <p>
            A PCS move spreads deadlines, notes, household details, arrival planning, and local
            research across too many places at once. PCS Pal brings those pieces together so the move
            is easier to restart after interruptions.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>What is in the product today</h2>
          <ul className="legal-page-list">
            <li>A synced PCS checklist.</li>
            <li>A move organizer with inventory and logistics tools.</li>
            <li>Base research pages and arrival-focused resource links.</li>
            <li>Account, privacy, and legal-acknowledgment settings.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Current stage</h2>
          <p>
            PCS Pal is still in a founder-and-reviewer stage. The site is being refined for product
            clarity, workflow stability, and legal/compliance readiness before any broader launch.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>What PCS Pal is not</h2>
          <p>
            PCS Pal is not an official government service, not a transportation office, not legal
            counsel, and not a tax advisor. It is a planner and organizational aid that should be
            used alongside official sources.
          </p>
          <p>
            Review the <Link className="text-link" href="/terms">Terms of Use</Link> and{" "}
            <Link className="text-link" href="/privacy">Privacy Policy</Link> for the current draft
            legal framework.
          </p>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">
          Founder and reviewer feedback helps shape the current migration and product-hardening work.
        </p>
      </SiteFooter>
    </>
  );
}
