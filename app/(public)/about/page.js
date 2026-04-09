import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "About PCS Pal";
const description =
  "Learn how PCS Pal helps military families track move tasks, documents, travel plans, and arrival information in one place.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/about",
  keywords: [
    "about PCS Pal",
    "military PCS planning",
    "PCS checklist and inventory",
    "military relocation support",
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
        <h1>Built from real PCS stress, not generic move templates</h1>
        <p className="subtitle">
          PCS Pal was built to reduce the overwhelm that hits when orders drop and every task feels urgent at once.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <section className="info-panel legal-page-section">
          <h2>Why PCS Pal exists</h2>
          <p>
            Too many military families are forced to juggle paper checklists, social posts, and scattered bookmarks during a PCS. PCS Pal brings that workflow into one planning space designed for real move timelines and family pressure.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>What makes this different</h2>
          <ul className="legal-page-list">
            <li>Built around PCS-specific decisions, not generic household moves.</li>
            <li>Combines checklist, inventory, logistics, and base research in one flow.</li>
            <li>Designed to supplement official guidance, not replace it.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>We&apos;re working on next</h2>
          <ul className="legal-page-list">
            <li>More multi-branch and OCONUS base guides.</li>
            <li>Expanded dashboard progress tracking and reminders.</li>
            <li>Better account-level sync and planning exports.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Trust and data</h2>
          <p>
            Questions? Use the <Link className="text-link" href="/contact">contact page</Link>. Review data handling in the{" "}
            <Link className="text-link" href="/privacy">Privacy Policy</Link>. PCS Pal is a planning companion and does not replace official command, transportation, or finance guidance.
          </p>
          <Link className="landing-primary-action" href="/create-account">Create account</Link>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">PCS Pal supports your planning but does not replace official military guidance.</p>
      </SiteFooter>
    </>
  );
}
