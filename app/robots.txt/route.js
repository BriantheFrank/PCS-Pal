import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const dynamic = "force-static";

export function GET() {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    `Host: ${siteConfig.siteUrl}`,
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
  ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
