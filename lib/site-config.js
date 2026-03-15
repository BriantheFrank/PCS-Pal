const FALLBACK_SITE_URL = "https://pcs-pal-live.vercel.app";

const normalizeSiteUrl = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }

  return `https://${trimmed.replace(/\/+$/, "")}`;
};

const resolvedSiteUrl =
  normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
  normalizeSiteUrl(process.env.SITE_URL) ||
  normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  FALLBACK_SITE_URL;

export const siteConfig = {
  name: "PCS Pal",
  shortName: "PCS Pal",
  description:
    "PCS Pal helps military families keep PCS checklists, inventory, logistics, and destination research organized in one place.",
  siteUrl: resolvedSiteUrl,
};

export const absoluteUrl = (pathname = "/") => {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, siteConfig.siteUrl).toString();
};
