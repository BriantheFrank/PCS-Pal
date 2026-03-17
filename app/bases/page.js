import { baseIndexItems } from "@/lib/bases/base-index-data";
import { BasesHeading, NativeBasesPage } from "@/components/bases/native-bases-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Military Destination Base Research";
const description =
  "Research major Army duty stations, compare installation overviews, and open PCS arrival guides for housing, lodging, transportation, medical, and first-week planning.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/bases",
  keywords: [
    "military base research",
    "PCS destination bases",
    "Army duty stations",
    "PCS arrival guides",
    "military relocation research",
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
        <p className="eyebrow">U.S. Army Duty Stations</p>
        <BasesHeading />
        <p className="subtitle">
          Research major Army installations, compare locations, and open public arrival guides for
          housing, lodging, transportation, and first-week PCS planning.
        </p>
      </SiteHeader>

      <NativeBasesPage items={baseIndexItems} />

      <SiteFooter>
        <p>More duty station tools are coming soon.</p>
      </SiteFooter>
    </>
  );
}
