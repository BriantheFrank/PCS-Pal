import Link from "next/link";

import { GuidedPageIntro } from "@/components/site/guided-page-intro";
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
        <h1>Built to help military families stay organized during a PCS</h1>
        <p className="subtitle">
          PCS Pal is built to help military families stay organized during a PCS move. The goal is
          simple: make it easier to keep track of tasks, documents, travel plans, and arrival
          information in one place.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <GuidedPageIntro
          purpose="Understand what PCS Pal is built to help with and how to use the core pages."
          bestFor="Military families who want a practical, step-by-step way to plan a move without juggling multiple apps and notes."
          startBy="Opening the checklist page, then move to inventory, logistics, and base guides as your move details become clearer."
          nextStepLabel="Go to Checklist"
          nextStepHref="/military-pcs-checklist"
        />

        <section className="info-panel legal-page-section">
          <h2>What is included right now</h2>
          <ul className="legal-page-list">
            <li>A checklist for before, during, and after your move.</li>
            <li>An inventory tool for rooms, labels, and important items.</li>
            <li>A logistics page for travel, lodging, and arrival-week planning.</li>
            <li>Base guides focused on the first information families usually need.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>How to start</h2>
          <p>
            Start with the public <Link className="text-link" href="/military-pcs-checklist">checklist</Link>, then
            use <Link className="text-link" href="/pcs-inventory-label-tracking"> inventory</Link>,{" "}
            <Link className="text-link" href="/pcs-move-logistics-planning">logistics</Link>, and{" "}
            <Link className="text-link" href="/bases">base guides</Link> as your plan takes shape.
          </p>
          <p>
            You can sign in to save your move plan across devices. Public guides stay available even
            without an account.
          </p>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">PCS Pal supports your planning but does not replace official military guidance.</p>
      </SiteFooter>
    </>
  );
}
