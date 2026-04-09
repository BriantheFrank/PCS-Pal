import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Forgot Password",
  description: "Reset your PCS Pal account password.",
  pathname: "/forgot-password",
  noindex: true,
});

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader topBar={<LandingTopBar />}>
        <p className="eyebrow">Account Recovery</p>
        <h1>Forgot password</h1>
        <p className="subtitle">Enter your account email and we will send a reset link.</p>
      </SiteHeader>
      <main className="container" id="main-content">
        <section className="info-panel legal-page-section">
          <ForgotPasswordForm />
          <Link className="text-link" href="/sign-in">
            Back to sign in
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
