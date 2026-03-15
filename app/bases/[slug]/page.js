import { notFound } from "next/navigation";

import { NativeBaseDetailPage } from "@/components/bases/detail/native-base-detail-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { getBaseDetailPageData } from "@/lib/bases/base-detail-data";
import { NATIVE_BASE_DETAIL_SLUGS, isNativeBaseDetailSlug } from "@/lib/bases/base-route-map";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

export function generateStaticParams() {
  return NATIVE_BASE_DETAIL_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const pageData = getBaseDetailPageData(params.slug);
  if (!pageData) {
    return buildPageMetadata({
      title: "Destination Base",
      description: "Protected destination base guide.",
      pathname: `/bases/${params.slug}`,
      noindex: true,
    });
  }

  return buildPageMetadata({
    title: pageData.heading,
    description: pageData.overview,
    pathname: pageData.routePath,
    noindex: true,
  });
}

export default function BaseDetailPage({ params }) {
  if (!isNativeBaseDetailSlug(params.slug)) {
    notFound();
  }

  const pageData = getBaseDetailPageData(params.slug);
  if (!pageData) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title: pageData.heading,
          description: pageData.overview,
          pathname: pageData.routePath,
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="bases" />}>
        <p className="eyebrow">{pageData.eyebrow}</p>
        <h1>{pageData.heading}</h1>
        <p className="subtitle">{pageData.subtitle}</p>
        <p>{pageData.overview}</p>
      </SiteHeader>

      <NativeBaseDetailPage pageData={pageData} />

      <SiteFooter>
        <p>Plan ahead for every duty station on your PCS journey.</p>
      </SiteFooter>
    </>
  );
}
