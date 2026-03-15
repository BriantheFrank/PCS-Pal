import Link from "next/link";

import { CreateAccountForm } from "@/components/auth/create-account-form";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Create Account";
const description =
  "Create your PCS Pal account to keep your checklist, move inventory, and logistics details tied to you across devices.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/create-account",
  noindex: true,
});

export default function CreateAccountPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/create-account",
        })}
      />

      <SiteHeader topBar={<LandingTopBar />}>
        <p className="eyebrow">PCS Pal Account Setup</p>
        <h1>Create your PCS Pal account</h1>
        <p className="subtitle">
          A few details now, so your checklist, move inventory, and logistics stay with you from
          one device to the next.
        </p>
      </SiteHeader>

      <main className="container">
        <section className="landing-hero signup-page-layout">
          <CreateAccountForm />

          <div className="info-panel signup-page-card signup-page-side">
            <p className="eyebrow">What Comes Next</p>
            <h2>One account, one place to keep the move together</h2>
            <p>
              After you confirm your email and sign in, the landing page becomes your starting point
              for the checklist, organizer, and base library.
            </p>
            <ul className="signup-page-list">
              <li>Keep checklist progress synced across browsers and devices</li>
              <li>Hold onto your move inventory in one account-linked workspace</li>
              <li>Track logistics details without scattering them across notes and tabs</li>
              <li>
                Review the public <Link href="/terms">Terms of Use</Link> and{" "}
                <Link href="/privacy">Privacy Policy</Link> before account creation
              </li>
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">
          Tip: After account creation, confirm your email, then use the sign-in page to return to
          your workspace.
        </p>
      </SiteFooter>
    </>
  );
}
