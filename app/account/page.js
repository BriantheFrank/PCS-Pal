import { AccountSettingsPage } from "@/components/auth/account-settings-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Account Settings";
const description =
  "Review your PCS Pal account details, privacy settings, move profile, and legal acceptance status.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/account",
  noindex: true,
});

export default function AccountPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/account",
        })}
      />

      <SiteHeader topBar={<LandingTopBar />}>
        <p className="eyebrow">PCS Pal Account</p>
        <h1>Account settings</h1>
        <p className="subtitle">
          Keep your name, privacy choices, legal acknowledgments, and coarse move details current in
          one place.
        </p>
      </SiteHeader>

      <main className="container">
        <AccountSettingsPage />
      </main>

      <SiteFooter>
        <p className="footer-tip">
          Tip: Save account settings here first, then continue into the bridged checklist and organizer
          tools with the same session.
        </p>
      </SiteFooter>
    </>
  );
}
