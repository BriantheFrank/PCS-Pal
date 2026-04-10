import { notFound } from "next/navigation";

import { NativeBaseDetailPage } from "@/components/bases/detail/native-base-detail-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { getBaseDetailPageData } from "@/lib/bases/base-detail-data";
import { getDisplayBaseName } from "@/lib/bases/base-name-utils";
import { NATIVE_BASE_DETAIL_SLUGS, isNativeBaseDetailSlug } from "@/lib/bases/base-route-map";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

export function generateStaticParams() {
  return NATIVE_BASE_DETAIL_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const pageData = getBaseDetailPageData(params.slug);
  const displayName = getDisplayBaseName(params.slug, pageData?.installationName || "");
  if (!pageData) {
    return buildPageMetadata({
      title: "Destination Base",
      description: "Military destination base guide.",
      pathname: `/bases/${params.slug}`,
    });
  }

  return buildPageMetadata({
    title: `${displayName} PCS Guide`,
    description: pageData.overview,
    pathname: pageData.routePath,
    keywords: [
      `${displayName} PCS guide`,
      `${displayName} housing`,
      `${displayName} lodging`,
      `${displayName} transportation office`,
      "military destination base research",
    ],
  });
}

export default function BaseDetailPage({ params }) {
  if (!isNativeBaseDetailSlug(params.slug)) {
    notFound();
  }

  const pageData = getBaseDetailPageData(params.slug);
  const displayName = getDisplayBaseName(params.slug, pageData?.installationName || "");
  if (!pageData) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title: `${displayName} PCS Guide`,
          description: pageData.overview,
          pathname: pageData.routePath,
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="bases" />}>
        <p className="eyebrow">{pageData.eyebrow}</p>
        <h1>{getDisplayBaseName(params.slug, pageData.heading)}</h1>
        <p className="subtitle">{pageData.subtitle}</p>
        <p>
          This guide is meant to help your family get oriented faster before arrival and during the
          first few days at the installation.
        </p>
        <p>{pageData.overview}</p>
      </SiteHeader>

      <NativeBaseDetailPage pageData={pageData} />

      <SiteFooter>
        <p>Plan ahead for every duty station on your PCS journey.</p>
      </SiteFooter>
    </>
  );
}
