import { legacyHtmlAliasRedirects, noIndexRoutePaths } from "./lib/legacy-route-manifest.mjs";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return legacyHtmlAliasRedirects;
  },
  async headers() {
    return [
      ...noIndexRoutePaths.map((source) => ({
        source,
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, follow",
          },
        ],
      })),
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
