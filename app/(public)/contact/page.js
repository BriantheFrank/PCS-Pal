import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { InfoTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Contact PCS Pal";
const description =
  "Use the PCS Pal contact page for founder and reviewer feedback, product questions, and launch-readiness notes.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/contact",
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

      <SiteHeader topBar={<InfoTopBar active="contact" />}>
        <p className="eyebrow">Contact PCS Pal</p>
        <h1>Questions, feedback, and reviewer notes</h1>
        <p className="subtitle">
          PCS Pal is still in an early product stage, so contact workflows are lightweight and still
          being formalized.
        </p>
      </SiteHeader>

      <main className="container legal-page-layout">
        <section className="info-panel legal-page-section">
          <h2>Best use of this contact path right now</h2>
          <ul className="legal-page-list">
            <li>Founder or reviewer product feedback.</li>
            <li>Bug reports tied to account, sync, or tool behavior.</li>
            <li>Questions about the current draft legal or privacy pages.</li>
            <li>Launch-readiness notes on clarity, trust, or workflow issues.</li>
          </ul>
        </section>

        <section className="info-panel legal-page-section">
          <h2>What to include</h2>
          <p>
            Include the page you were using, what you expected to happen, what happened instead, and
            any browser or device detail that may help reproduce the issue.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Security and privacy note</h2>
          <p>
            Do not send full orders, account credentials, Social Security numbers, or other
            sensitive documents through informal feedback channels. Use only the minimum detail needed
            to describe the issue.
          </p>
        </section>

        <section className="info-panel legal-page-section">
          <h2>Formal support commitments</h2>
          <p className="legal-placeholder-note">
            A final public support email address, response target, and formal privacy-request channel
            still need to be finalized before broader launch.
          </p>
          <p>
            In the meantime, the legal framework remains available through the{" "}
            <Link className="text-link" href="/terms">Terms of Use</Link> and{" "}
            <Link className="text-link" href="/privacy">Privacy Policy</Link>.
          </p>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">
          Keep feedback concise and avoid sharing more personal data than necessary.
        </p>
      </SiteFooter>
    </>
  );
}
