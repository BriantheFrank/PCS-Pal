import Link from "next/link";

import { CreateAccountForm } from "@/components/auth/create-account-form";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Create an account";
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
        <h1>Create an account</h1>
        <p className="subtitle">
          Create an account to save your checklist, inventory, and move plans so you can return to
          them later.
        </p>
        <p className="subtitle">
          You can explore the public guides without an account, but sign-in is helpful if you want
          to save your progress.
        </p>
      </SiteHeader>

      <main className="container">
        <section className="landing-hero signup-page-layout">
          <CreateAccountForm />

          <div className="info-panel signup-page-card signup-page-side">
            <p className="eyebrow">What Comes Next</p>
            <h2>Why create an account</h2>
            <p>
              After you sign in, your checklist, inventory, and move plans stay connected to your account.
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
