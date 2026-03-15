import { baseIndexItems } from "@/lib/bases/base-index-data";
import { BasesHeading, NativeBasesPage } from "@/components/bases/native-bases-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Destination Bases";
const description =
  "Browse the protected PCS Pal base library to search Army installations by name, location, or major unit before opening the detailed arrival guides.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/bases",
  noindex: true,
});

export default function BasesPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/bases",
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="bases" />}>
        <p className="eyebrow">U.S. Army Duty Stations</p>
        <BasesHeading />
        <p className="subtitle">
          Browse the 20 largest Army installations in the United States to get a quick sense of
          where Soldiers are stationed and who calls each post home.
        </p>
      </SiteHeader>

      <NativeBasesPage items={baseIndexItems} />

      <SiteFooter>
        <p>More duty station tools are coming soon.</p>
      </SiteFooter>
    </>
  );
}
