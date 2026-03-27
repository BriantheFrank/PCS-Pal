import { AdminFeedbackPage } from "@/components/feedback/admin-feedback-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Feedback Review";
const description =
  "Internal PCS Pal feedback review console for triaging submitted bug reports, feature requests, and general product feedback.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/account/feedback",
  noindex: true,
});

export default function AccountFeedbackRoute() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/account/feedback",
        })}
      />

      <SiteHeader topBar={<LandingTopBar />}>
        <p className="eyebrow">PCS Pal Internal Feedback</p>
        <h1>Feedback review</h1>
        <p className="subtitle">
          Review submitted feedback, filter the queue by status, and review submissions and update status from inside the app.
        </p>
      </SiteHeader>

      <main className="container">
        <AdminFeedbackPage />
      </main>

      <SiteFooter>
        <p className="footer-tip">
          Internal-only route. Allowlisted operator accounts can review feedback here without leaving
          the native app shell.
        </p>
      </SiteFooter>
    </>
  );
}
