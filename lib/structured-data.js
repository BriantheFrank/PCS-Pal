import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const buildOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.siteUrl,
  description: siteConfig.description,
});

export const buildWebSiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.siteUrl,
  description: siteConfig.description,
});

export const buildWebPageSchema = ({
  title,
  description,
  pathname,
}) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: title,
  description,
  url: absoluteUrl(pathname),
  isPartOf: {
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
  },
});
