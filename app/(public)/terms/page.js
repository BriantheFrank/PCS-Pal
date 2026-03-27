import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { InfoTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Terms of Use";
const description =
  "These terms explain the basic rules for using PCS Pal, what users should expect, and the limits of the information provided.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/terms",
        })}
      />

      <SiteHeader topBar={<InfoTopBar active="terms" />}>
        <p className="eyebrow">PCS Pal Legal</p>
        <h1>Terms of Use</h1>
        <p className="subtitle">
          These terms explain the basic rules for using PCS Pal. They describe what the site is for,
          what users should expect, and the limits of the information provided here.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <Link className="back-link" href="/">
          Back to PCS Pal
        </Link>

        <section className="info-panel legal-page-panel">
          <div className="legal-page-meta">
            <p>
              <strong>Version:</strong> <span data-legal-version="terms_of_use">2026-03-12</span>
            </p>
            <p>
              <strong>Effective date:</strong>{" "}
              <span data-legal-effective-date="terms_of_use">March 12, 2026</span>
            </p>
          </div>
          <p className="legal-page-intro">
            PCS Pal is continuing to evolve, and these terms may be updated as features change.
            Please review them periodically for updates.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>1. What PCS Pal is</h2>
          <p>
            PCS Pal is an informational and organizational planning tool for service members and
            families managing a PCS move.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>2. Informational-only disclaimer</h2>
          <p>
            PCS Pal is intended as an informational planning tool. Always confirm time-sensitive or
            official requirements with the appropriate installation or military office.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>3. Your responsibilities</h2>
          <p>
            You are responsible for protecting your account, reviewing your orders, and verifying
            important deadlines and requirements through official sources.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>4. Third-party links and services</h2>
          <p>
            PCS Pal may link to official government resources and third-party services. Those sites
            are operated by their own organizations.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>5. Changes to these terms</h2>
          <p>
            These terms may be updated as the product evolves. Please review them periodically for
            changes.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>6. Contact</h2>
          <p>
            If you have questions about these terms, use the PCS Pal{" "}
            <Link className="text-link" href="/contact">
              contact page
            </Link>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
