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
    "PCS Pal helps military families plan Permanent Change of Station moves with a checklist, inventory tracking, logistics planning, and base guides.",
  siteUrl: resolvedSiteUrl,
  locale: "en_US",
};

export const absoluteUrl = (pathname = "/") => {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, siteConfig.siteUrl).toString();
};

export const primaryPublicNavLinks = [
  { href: "/", label: "Home", key: "home" },
  { href: "/checklist", label: "Checklist", key: "pcs-checklist" },
  { href: "/inventory", label: "Inventory", key: "inventory" },
  { href: "/logistics", label: "Logistics", key: "logistics" },
  { href: "/bases", label: "Base Guides", key: "bases" },
];

export const publicResourceLinks = [
  {
    href: "/military-pcs-checklist",
    label: "Military PCS Checklist",
  },
  {
    href: "/pcs-inventory-label-tracking",
    label: "PCS Inventory and Label Tracking",
  },
  {
    href: "/pcs-move-logistics-planning",
    label: "PCS Move Logistics Planning",
  },
  {
    href: "/how-to-plan-a-military-pcs-move",
    label: "Start Here: Plan Your PCS Move",
  },
  {
    href: "/bases",
    label: "Military Base Guides",
  },
];

export const publicSiteLinks = [
  { href: "/", label: "Home" },
  ...publicResourceLinks,
  { href: "/pcs-glossary", label: "PCS Glossary" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export const topLevelIndexableSiteRoutes = [
  {
    pathname: "/",
    changeFrequency: "weekly",
    priority: "1.0",
  },
  {
    pathname: "/military-pcs-checklist",
    changeFrequency: "weekly",
    priority: "0.9",
  },
  {
    pathname: "/pcs-inventory-label-tracking",
    changeFrequency: "weekly",
    priority: "0.8",
  },
  {
    pathname: "/pcs-move-logistics-planning",
    changeFrequency: "weekly",
    priority: "0.8",
  },
  {
    pathname: "/how-to-plan-a-military-pcs-move",
    changeFrequency: "weekly",
    priority: "0.9",
  },
  {
    pathname: "/bases",
    changeFrequency: "weekly",
    priority: "0.8",
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
