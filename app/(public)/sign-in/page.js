import { Suspense } from "react";
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
        <p className="subtitle">Sign in to access your saved checklist, inventory, and move plans.</p>
      </SiteHeader>

      <main className="container" id="main-content">
        <section className="landing-hero signup-page-layout signup-page-layout-single">
          <Suspense fallback={<SignInFormFallback />}>
            <SignInForm />
          </Suspense>
          <p className="signup-page-inline-link">
            Need an account? <Link href="/create-account">Create one</Link>.
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
