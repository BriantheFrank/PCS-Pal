import Link from "next/link";
import { notFound } from "next/navigation";

import { NativeGuidePage } from "@/components/guides/native-guide-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { GUIDE_SLUGS, getGuidePageData } from "@/lib/guides/page-data";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

export const dynamicParams = false;

const isExternalHref = (href) => /^https?:\/\//i.test(String(href || ""));

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const pageData = getGuidePageData(params.slug);
  if (!pageData) {
    return {};
  }

  return buildPageMetadata({
    title: pageData.title,
    description: pageData.description,
    pathname: pageData.routePath,
    keywords: [
      "military PCS checklist",
      "PCS planning guide",
      "Permanent Change of Station checklist",
      pageData.title,
    ],
    openGraphType: "article",
  });
}

export default function GuideArticlePage({ params }) {
  const pageData = getGuidePageData(params.slug);
  if (!pageData) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title: pageData.title,
          description: pageData.description,
          pathname: pageData.routePath,
          type: "Article",
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="pcs-checklist-guide" />}>
        <p className="eyebrow">PCS Checklist Step</p>
        <h1>{pageData.title}</h1>
        <p className="subtitle">{pageData.description}</p>
        <Link className="text-link" href={pageData.backLink.href}>
          {pageData.backLink.label}
        </Link>
      </SiteHeader>

      <NativeGuidePage pageData={pageData} />

      <SiteFooter>
        {pageData.footerLinks.map((link) => (
          <p key={link.href}>
            {isExternalHref(link.href) ? (
              <a className="text-link" href={link.href} rel="noreferrer" target="_blank">
                {link.label}
              </a>
            ) : (
              <Link className="text-link" href={link.href}>
                {link.label}
              </Link>
            )}
          </p>
        ))}
        <p>{pageData.footerDisclaimer}</p>
      </SiteFooter>
    </>
  );
}
