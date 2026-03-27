import { baseIndexItems } from "@/lib/bases/base-index-data";
import { BasesHeading, NativeBasesPage } from "@/components/bases/native-bases-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Military Base Guides";
const description =
  "Use base guides to find lodging, housing, transportation, and key office information before and after your PCS arrival.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/bases",
  keywords: [
    "military base guides",
    "PCS duty stations",
    "Army installations",
    "PCS arrival guides",
    "military relocation planning",
  ],
});

export default function BasesPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/bases",
          type: "CollectionPage",
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="bases" />}>
        <p className="eyebrow">Base Guides</p>
        <BasesHeading />
        <p className="subtitle">
          Use this page to quickly find the most important arrival information for your installation,
          including lodging, housing, transportation, and key offices.
        </p>
      </SiteHeader>

      <NativeBasesPage items={baseIndexItems} />

      <SiteFooter>
        <p>More base guides are coming soon.</p>
      </SiteFooter>
    </>
  );
}
