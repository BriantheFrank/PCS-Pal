import { NativeOrganizerPage, OrganizerHeading } from "@/components/organizer/native-organizer-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Move Organizer";
const description =
  "Open the protected PCS Pal organizer hub to jump into the native inventory and logistics workspaces while the remaining tool migrations continue through the existing bridge.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/organizer",
  noindex: true,
});

export default function OrganizerPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/organizer",
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="organizer" />}>
        <p className="eyebrow">U.S. Military PCS Toolkit</p>
        <OrganizerHeading />
        <p className="subtitle">
          Choose a move organizer tool to keep household details organized and easy to access
          offline.
        </p>
      </SiteHeader>

      <NativeOrganizerPage />

