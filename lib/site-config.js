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
    "PCS Pal helps military families organize Permanent Change of Station checklists, inventory, destination research, and move logistics in one place.",
  siteUrl: resolvedSiteUrl,
  locale: "en_US",
};

export const absoluteUrl = (pathname = "/") => {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, siteConfig.siteUrl).toString();
};

export const publicSiteLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export const indexableSiteRoutes = [
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
