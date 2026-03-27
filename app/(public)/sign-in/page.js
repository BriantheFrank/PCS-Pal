import { Suspense } from "react";
import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Sign in";
const description =
  "Sign in to PCS Pal to pick up your checklist, move organizer, and planning details from any device.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/sign-in",
  noindex: true,
});

function SignInFormFallback() {
  return (
    <div className="info-panel signup-page-card">
      <p className="eyebrow">Sign In</p>
      <h2>Return to your PCS Pal workspace</h2>
      <p>Opening sign-in</p>
      <p className="signup-page-status" aria-live="polite">
        Getting sign-in ready
      </p>
    </div>
  );
}

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
        <h1>Sign in</h1>
        <p className="subtitle">
          Sign in to access your saved checklist, inventory, and move plans.
        </p>
        <p className="subtitle">You can still browse public guides without an account.</p>
        <p className="subtitle">An account helps keep your move information available across devices.</p>
      </SiteHeader>

      <main className="container">
        <section className="landing-hero signup-page-layout">
          <Suspense fallback={<SignInFormFallback />}>
            <SignInForm />
          </Suspense>

          <div className="info-panel signup-page-card signup-page-side">
            <p className="eyebrow">Need an account first?</p>
            <h2>Create an account</h2>
            <p>
              A PCS Pal account helps you save your move information and return to it later from any device.
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
