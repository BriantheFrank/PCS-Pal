import { absoluteUrl, indexableSiteRoutes } from "@/lib/site-config";

export const dynamic = "force-static";

export function GET() {
  const entries = indexableSiteRoutes
    .map(
      (route) => `<url>
  <loc>${absoluteUrl(route.pathname)}</loc>
  <changefreq>${route.changeFrequency}</changefreq>
  <priority>${route.priority}</priority>
</url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
