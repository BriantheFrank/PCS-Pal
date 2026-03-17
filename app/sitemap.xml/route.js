import { getMigratedBaseDetailPageData } from "@/lib/bases/base-detail-data";
import { GUIDE_SLUGS, getGuidePageData } from "@/lib/guides/page-data";
import { absoluteUrl, topLevelIndexableSiteRoutes } from "@/lib/site-config";

export const dynamic = "force-static";

const buildUrlEntry = ({ loc, changeFrequency, priority }) => `<url>
  <loc>${loc}</loc>
  <changefreq>${changeFrequency}</changefreq>
  <priority>${priority}</priority>
</url>`;

export function GET() {
  const topLevelEntries = topLevelIndexableSiteRoutes.map((route) =>
    buildUrlEntry({
      loc: absoluteUrl(route.pathname),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })
  );

  const guideEntries = GUIDE_SLUGS.map((slug) => getGuidePageData(slug))
    .filter(Boolean)
    .map((pageData) =>
      buildUrlEntry({
        loc: absoluteUrl(pageData.routePath),
        changeFrequency: "monthly",
        priority: "0.7",
      })
    );

  const baseEntries = getMigratedBaseDetailPageData().map((pageData) =>
    buildUrlEntry({
      loc: absoluteUrl(pageData.routePath),
      changeFrequency: "monthly",
      priority: "0.75",
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...topLevelEntries, ...guideEntries, ...baseEntries].join("\n")}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
