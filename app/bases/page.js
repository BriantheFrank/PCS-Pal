import { baseIndexItems } from "@/lib/bases/base-index-data";
import { BasesHeading, NativeBasesPage } from "@/components/bases/native-bases-page";
import { JsonLd } from "@/components/seo/json-ld";
import { MetaSummary } from "@/components/site/meta-summary";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Base Guides";
const description =
  "Use this section to quickly find the most important arrival information for your installation, including lodging, housing, transportation, and key offices.";

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
        <p className="eyebrow">Destination Base Guides</p>
        <BasesHeading />
        <p className="subtitle">
          Use this section to quickly find the most important arrival information for your
          installation, including lodging, housing, transportation, and key offices.
        </p>
      </SiteHeader>

      <main id="main-content">
        <section className="container legal-page-layout">
          <MetaSummary
            purpose="Help you choose the right installation guide and surface first-week resources quickly."
            bestFor="Families getting familiar with a new duty station before travel or shortly after arrival."
            startBy="Choose your installation, then review lodging, housing, and first offices you expect to need."
            nextStepLabel="Open your dashboard"
            nextStepHref="/dashboard"
          />
        </section>
        <NativeBasesPage items={baseIndexItems} />
      </main>

      <SiteFooter>
        <p>
          Don&apos;t see your installation?{" "}
          <a
            className="text-link"
            href="/contact?topic=suggest_feature&message=I%27d%20like%20to%20request%20a%20base%20guide%20for%3A%20"
          >
            Request a base guide →
          </a>
        </p>
      </SiteFooter>
    </>
  );
}
