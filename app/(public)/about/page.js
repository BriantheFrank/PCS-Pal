import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "About PCS Pal";
const description =
  "Learn what PCS Pal covers, how it helps military families stay organized, and how to use it alongside official resources.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/about",
  keywords: [
    "about PCS Pal",
    "military PCS planning app",
    "PCS checklist and move organizer",
    "military relocation planning tool",
  ],
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/about",
          type: "AboutPage",
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="about" />}>
        <p className="eyebrow">About PCS Pal</p>
        <h1>Built to make PCS planning easier to hold together</h1>
        <p className="subtitle">
          PCS Pal is designed to help families stay organized during a move without replacing official guidance.
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
          <p>
            Start with the public <Link className="text-link" href="/military-pcs-checklist">PCS checklist guide</Link>,{" "}
            <Link className="text-link" href="/pcs-inventory-label-tracking">inventory planning page</Link>,{" "}
            <Link className="text-link" href="/pcs-move-logistics-planning">logistics planning page</Link>, and{" "}
            <Link className="text-link" href="/bases">destination base research</Link> before you open the synced planner.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>How to use PCS Pal today</h2>
          <p>
            Start with the public guides, then sign in when you want to save your checklist, inventory, and move plans for later.
          </p>
          <p>
            Official links are included to help you get to the right installation resources faster.
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
            <Link className="text-link" href="/privacy">Privacy Policy</Link> for details on how PCS Pal works.
          </p>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">
          Use the contact page if you want to report a problem, ask a question, or suggest an improvement.
        </p>
      </SiteFooter>
    </>
  );
}
