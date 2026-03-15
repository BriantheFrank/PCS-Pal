import { noIndexLegacyPaths } from "@/lib/legacy-route-manifest.mjs";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-static";

export function GET() {
  const lines = [
    "User-agent: *",
    "Allow: /",
    ...noIndexLegacyPaths.map((path) => `Disallow: ${path.replace(":path*", "")}`),
    `Sitemap: ${siteConfig.siteUrl}/sitemap.xml`,
    `Host: ${siteConfig.siteUrl}`,
  ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
