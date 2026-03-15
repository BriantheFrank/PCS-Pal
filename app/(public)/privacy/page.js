import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { InfoTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Privacy Policy";
const description =
  "Review the current draft PCS Pal Privacy Policy covering account data, planner data, legal acceptance records, analytics, and consent choices.";

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
          Draft language for product and legal review. This page is not attorney-approved final copy
          yet.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <Link className="back-link" href="/">
          Back to PCS Pal
        </Link>

        <section className="info-panel legal-page-panel">
          <p className="legal-badge">Draft pending attorney review</p>
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
            This Privacy Policy describes what information PCS Pal collects, how it is used, and
            how consent-based data choices work in the current product design.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>1. What this policy covers</h2>
          <p>
            This Privacy Policy covers the PCS Pal website, account system, and the planning data a
            user chooses to store in the product. It is separate from the{" "}
            <Link className="text-link" href="/terms">
              Terms of Use
            </Link>
            .
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>2. Information we collect</h2>
          <p>PCS Pal may collect the following categories of information:</p>
          <ul className="legal-page-list">
            <li>Account information such as name, email address, and authentication identifiers.</li>
            <li>Planning data you choose to enter, such as checklist progress, inventory details, and move logistics.</li>
            <li>Privacy settings and marketing consent choices that you submit.</li>
            <li>Coarse move-profile details that you save for planning and product-personalization purposes.</li>
            <li>Legal-acceptance records such as accepted document versions, acceptance time, user agent, and hashed IP snapshot when available.</li>
            <li>Analytics and referral data only when the relevant consent settings and explicit workflows permit it.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>3. How we use information</h2>
          <p>PCS Pal may use collected information to:</p>
          <ul className="legal-page-list">
            <li>Provide account access and save your planning data across sessions and devices.</li>
            <li>Support checklist, inventory, logistics, and destination-planning features.</li>
            <li>Honor privacy settings, marketing preferences, and legal-acceptance audit requirements.</li>
            <li>Operate consent-based analytics and clearly disclosed partner referral flows.</li>
            <li>Protect the service, investigate abuse, and support legal compliance obligations.</li>
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
            only as needed to operate the service and the consented workflow.
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
            Final retention windows, deletion workflows, and legal-hold handling still require
            operator and legal review before production legal launch.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>7. Security</h2>
          <p>
            PCS Pal uses hosted infrastructure, authentication services, and access controls to
            protect account data, but no online system can promise absolute security.
          </p>
          <p>
            Users should choose strong passwords, protect account access, and avoid storing data in
            the service that is outside the intended planning scope.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>8. Your choices and rights</h2>
          <p className="legal-placeholder-note">
            Placeholder only. Consumer privacy rights, jurisdiction-specific disclosures, response
            timelines, and contact channels for privacy requests still require attorney review before
            production legal launch.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>9. Changes to this policy</h2>
          <p>
            When this Privacy Policy changes materially, PCS Pal should publish a new document
            version and, where appropriate, ask users to acknowledge the new version before continued
            use.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>10. Contact</h2>
          <p>
            If you have questions about this Privacy Policy, use the PCS Pal{" "}
            <Link className="text-link" href="/contact">
              contact page
            </Link>
            . Final privacy-contact language still needs review before launch.
          </p>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">
          Optional marketing consent and required legal acknowledgment are separate choices in the
          current product design.
        </p>
      </SiteFooter>
    </>
  );
}
