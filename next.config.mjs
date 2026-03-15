import { migratedPublicHtmlRewrites, noIndexLegacyPaths } from "./lib/legacy-route-manifest.mjs";

const headers = noIndexLegacyPaths.map((source) => ({
  source,
  headers: [
    {
      key: "X-Robots-Tag",
      value: "noindex, nofollow",
    },
  ],
}));

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: migratedPublicHtmlRewrites,
    };
  },
  async headers() {
    return headers;
  },
};

export default nextConfig;
