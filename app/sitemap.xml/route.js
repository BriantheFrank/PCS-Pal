import { absoluteUrl } from "@/lib/site-config";

export const dynamic = "force-static";

const publicRoutes = [
  {
    pathname: "/",
    changeFrequency: "weekly",
    priority: "1.0",
  },
  {
    pathname: "/about",
    changeFrequency: "monthly",
    priority: "0.7",
  },
  {
    pathname: "/contact",
    changeFrequency: "monthly",
    priority: "0.7",
  },
  {
    pathname: "/terms",
    changeFrequency: "monthly",
    priority: "0.5",
  },
  {
    pathname: "/privacy",
    changeFrequency: "monthly",
    priority: "0.5",
  },
];

export function GET() {
  const lastModified = new Date().toISOString();
  const entries = publicRoutes
    .map(
      (route) => `<url>
  <loc>${absoluteUrl(route.pathname)}</loc>
  <lastmod>${lastModified}</lastmod>
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
