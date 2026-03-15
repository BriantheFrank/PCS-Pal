import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { InfoTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Terms of Use";
const description =
  "Read the current draft PCS Pal Terms of Use, including plain-English service disclaimers, user responsibilities, and legal placeholders pending attorney review.";

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
              <strong>Version:</strong> <span data-legal-version="terms_of_use">2026-03-12</span>
            </p>
            <p>
              <strong>Effective date:</strong>{" "}
              <span data-legal-effective-date="terms_of_use">March 12, 2026</span>
            </p>
          </div>
          <p className="legal-page-intro">
            These Terms of Use explain the ground rules for using PCS Pal. They are written in plain
            English to reduce confusion, but they still need attorney review before production legal
            launch.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>1. What PCS Pal is</h2>
          <p>
            PCS Pal is an informational and organizational planning tool for service members and
            families managing a PCS move. It helps users organize checklists, move notes, inventory
            details, destination research, and other planning tasks.
          </p>
          <p>
            PCS Pal is not the government, not a transportation office, not legal counsel, not a tax
            advisor, and not a substitute for official military or government guidance.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>2. Informational-only disclaimer</h2>
          <p>
            Information in PCS Pal is provided for planning support and general awareness. It is not
            legal, tax, financial, relocation-office, or command-authorized advice.
          </p>
          <p>
            PCS rules, entitlements, reimbursement requirements, base procedures, availability, and
            timelines can change. PCS Pal may summarize public information, but that does not make it
            official guidance.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>3. Accuracy and no guarantee</h2>
          <p>
            PCS Pal tries to present useful planning information, but we do not guarantee that the
            service is always current, complete, error-free, or available without interruption.
          </p>
          <p>
            Users must confirm critical deadlines, entitlements, reimbursements, reporting
            instructions, orders, and local requirements through official or otherwise authoritative
            sources before acting on them.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>4. Your responsibilities</h2>
          <p>
            You are responsible for reviewing your own orders, protecting your account, keeping your
            email access current, and verifying any consequential PCS decision with the appropriate
            official source.
          </p>
          <p>
            You are also responsible for the content you enter into PCS Pal, including checklist
            notes, inventory details, logistics data, and any other material you submit.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>5. Accounts and security</h2>
          <p>
            You are responsible for safeguarding your login credentials and for activity that occurs
            through your account. Notify the operator if you believe your account has been accessed
            without permission.
          </p>
          <p>
            We may suspend or restrict access if needed to protect users, the service, or applicable
            legal obligations.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>6. Third-party links and services</h2>
          <p>
            PCS Pal may link to official government resources, partner services, military support
            sites, or other third-party tools. Those external services are controlled by their own
            operators, not by PCS Pal.
          </p>
          <p>
            We are not responsible for the availability, content, accuracy, privacy practices, or
            performance of external sites or services.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>7. No warranty</h2>
          <p>
            To the extent allowed by law, PCS Pal is provided &quot;as is&quot; and &quot;as
            available.&quot; We do not promise that the service will be uninterrupted, secure,
            complete, or error-free.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>8. Limitation of liability</h2>
          <p>
            To the extent legally enforceable, PCS Pal and its operators will not be liable for
            indirect, incidental, special, consequential, exemplary, or punitive damages arising from
            or related to your use of the service.
          </p>
          <p>
            To the extent a liability limit must be stated more specifically for your jurisdiction,
            attorney-reviewed language still needs to be inserted here before production legal launch.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>9. Changes to the service or these terms</h2>
          <p>
            PCS Pal may change features, content, or these Terms over time. When a material legal
            change is made, a new document version should be published and users may need to
            acknowledge the new version before continued use.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>10. Governing law and dispute process</h2>
          <p className="legal-placeholder-note">
            Placeholder only. Governing law, venue, dispute resolution, waiver, and arbitration
            language still require attorney review and jurisdiction-specific drafting before
            production legal launch.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>11. Contact</h2>
          <p>
            If you have questions about these Terms, use the PCS Pal{" "}
            <Link className="text-link" href="/contact">
              contact page
            </Link>
            . Final legal contact language still requires review before launch.
          </p>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">
          PCS Pal is a planning aid. Always verify orders, entitlements, reimbursement rules, and
          deadlines with official sources.
        </p>
      </SiteFooter>
    </>
  );
}
