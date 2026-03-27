import { ContactPageForm } from "@/components/contact/contact-page-form";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Contact";
const description =
  "Questions, feedback, or a problem with the site? Use the PCS Pal contact page to ask for help, report issues, and share suggestions.";

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
          Questions, feedback, or a problem with the site? Use this page to get in touch. Whether
          you found something confusing, noticed an error, or want to suggest a feature, we want to
          hear about it.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <section className="info-panel legal-page-section">
          <h2>What can we help with?</h2>
          <ul className="legal-page-list">
            <li>Ask a question</li>
            <li>Report a problem</li>
            <li>Suggest a feature</li>
            <li>Request a correction</li>
            <li>General feedback</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Before you send</h2>
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
