import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { InfoTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Privacy Policy";
const description =
  "This page explains what information PCS Pal collects, how it is used, and what choices users have regarding their information.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/privacy",
        })}
      />

      <SiteHeader topBar={<InfoTopBar active="privacy" />}>
        <p className="eyebrow">PCS Pal Legal</p>
        <h1>Privacy Policy</h1>
        <p className="subtitle">
          This page explains what information PCS Pal collects, how it is used, and what choices
          users have regarding their information.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <Link className="back-link" href="/">
          Back to PCS Pal
        </Link>

        <section className="info-panel legal-page-panel">
          <div className="legal-page-meta">
            <p>
              <strong>Version:</strong>{" "}
              <span data-legal-version="privacy_policy">2026-03-12</span>
            </p>
            <p>
              <strong>Effective date:</strong>{" "}
              <span data-legal-effective-date="privacy_policy">March 12, 2026</span>
            </p>
          </div>
          <p className="legal-page-intro">
            We may update this privacy information as the product changes or expands.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>1. Information we collect</h2>
          <ul className="legal-page-list">
            <li>Account details such as name and email address.</li>
            <li>Move-planning details you choose to save, including checklist and organizer data.</li>
            <li>Privacy and communication preferences you set in your account.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>2. How we use information</h2>
          <ul className="legal-page-list">
            <li>Provide sign-in and save your move information across sessions and devices.</li>
            <li>Improve planning features and maintain service reliability.</li>
            <li>Honor your privacy choices and required legal acknowledgments.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>3. Your choices</h2>
          <p>
            You can review and update privacy settings in your account. If you have a privacy-related
            question, use the PCS Pal <Link className="text-link" href="/contact">contact page</Link>.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>4. Updates to this policy</h2>
          <p>
            We may update this privacy information as the product changes or expands. Please review
            this page periodically for updates.
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
