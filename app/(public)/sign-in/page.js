import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Sign In";
const description =
  "Sign in to PCS Pal to pick up your checklist, move organizer, and planning details from any device.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/sign-in",
  noindex: true,
});

export default function SignInPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/sign-in",
        })}
      />

      <SiteHeader topBar={<LandingTopBar />}>
        <p className="eyebrow">PCS Pal Account Access</p>
        <h1>Sign in to PCS Pal</h1>
        <p className="subtitle">
          Return to the planning details already tied to your account so you can pick the move back
          up without starting over.
        </p>
      </SiteHeader>

      <main className="container">
        <section className="landing-hero signup-page-layout">
          <SignInForm />

          <div className="info-panel signup-page-card signup-page-side">
            <p className="eyebrow">Need an account first?</p>
            <h2>Create one secure place for the move</h2>
            <p>
              A PCS Pal account keeps your checklist, organizer, and logistics details tied to you
              across browsers and devices.
            </p>
            <ul className="signup-page-list">
              <li>Use the same email account you created during setup</li>
              <li>
                Need a new account? <Link href="/create-account">Create one here</Link>
              </li>
              <li>
                Review the public <Link href="/terms">Terms of Use</Link> and{" "}
                <Link href="/privacy">Privacy Policy</Link> any time
              </li>
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter>
        <p className="footer-tip">
          Tip: Sign in from the same email you used during account creation so PCS Pal can reconnect
          your planning details.
        </p>
      </SiteFooter>
    </>
  );
}
