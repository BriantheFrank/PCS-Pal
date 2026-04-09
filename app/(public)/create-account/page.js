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
        <h1>Create an account</h1>
        <p className="subtitle">
          Create an account to save your checklist, inventory, and move plans so you can return to
          them later.
        </p>
      </SiteHeader>

      <main className="container" id="main-content">
        <section className="landing-hero signup-page-layout signup-page-layout-single">
          <CreateAccountForm />
          <p className="signup-page-inline-link">
            Already have an account? <Link href="/sign-in">Sign in</Link>.
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
