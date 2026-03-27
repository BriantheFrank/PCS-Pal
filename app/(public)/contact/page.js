import { ContactPageForm } from "@/components/contact/contact-page-form";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Contact";
const description =
  "Use the PCS Pal contact page for questions, feedback, and bug reports.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/contact",
  keywords: ["contact PCS Pal", "PCS planning support", "PCS bug report", "PCS feedback"],
});

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/contact",
          type: "ContactPage",
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="contact" />}>
        <p className="eyebrow">Contact</p>
        <h1>Contact</h1>
        <p className="subtitle">
          PCS Pal is still in an early product stage, so the contact process is simple right now.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <section className="info-panel legal-page-section">
          <h2>What can we help with?</h2>
          <ul className="legal-page-list">
            <li>Founder or reviewer product feedback.</li>
            <li>Bug reports tied to account, sync, or tool behavior.</li>
            <li>Questions about the current draft legal or privacy pages.</li>
            <li>Notes on clarity, trust, or common problems.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>What to include</h2>
          <p>
            Include the page you were using, what you expected to happen, what happened instead, and
            any browser or device detail that may help reproduce the issue.
          </p>
          <p>
            If the question is really about move-planning steps rather than a site issue, start
            with the public <Link className="text-link" href="/how-to-plan-a-military-pcs-move">Start Here guide</Link>,{" "}
            <Link className="text-link" href="/military-pcs-checklist">checklist guide</Link>, or{" "}
            <Link className="text-link" href="/bases">base guides</Link> pages first.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Security and privacy note</h2>
          <p>
            Please do not include Social Security numbers, full orders, account credentials, or other
            sensitive documents. Share only what is needed so we can review your request.
          </p>
        </section>

        <ContactPageForm />
      </main>

      <SiteFooter />
    </>
  );
}
