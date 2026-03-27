import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { InfoTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Privacy Policy";
const description =
  "Review the current draft PCS Pal Privacy Policy covering account data, saved move-plan data, legal acceptance records, analytics, and consent choices.";

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
            <li>Account information such as name, email address, and authentication identifiers.</li>
            <li>Planning data you choose to enter, such as checklist progress, inventory details, and move logistics.</li>
            <li>Privacy settings and marketing consent choices that you submit.</li>
            <li>Coarse move-profile details that you save for planning and product-personalization purposes.</li>
            <li>Legal-acceptance records such as accepted document versions, acceptance time, user agent, and hashed IP snapshot when available.</li>
            <li>Analytics and referral data only when the relevant consent settings and explicit consent allows it.</li>
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
          <h2>4. Analytics and marketing choices</h2>
          <p>
            Marketing consent is optional and separate from required legal acknowledgment. Analytics
            collection is also handled separately from the legal clickwrap used for account creation.
          </p>
          <p>
            If you do not opt in to optional marketing, PCS Pal should not treat your legal
            acknowledgment as permission to send marketing messages. If you do not opt in to
            analytics, the product is designed to avoid the related event tracking path.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>5. Sharing and disclosures</h2>
          <p>
            PCS Pal is not designed as a raw personal-data marketplace. The current architecture
            separates explicit partner lead requests from passive browsing data.
          </p>
          <p>
            PCS Pal may share information with service providers that support hosting,
            authentication, storage, analytics, or explicitly requested partner introductions, but
            only as needed to operate the service and the consented process.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>6. Data minimization and retention</h2>
          <p>
            The product aims to avoid collecting exact street addresses, uploaded documents, or
            other sensitive data in analytics and monetization tables. Retention settings for
            certain raw analytics tables should remain limited and operationally pruned.
          </p>
          <p>
            Final retention windows, deletion processes, and legal-hold handling still require
            operator and legal review before production legal launch.
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
