import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const buildPageMetadata = ({
  title,
  description,
  pathname,
  noindex = false,
}) => ({
  title,
  description,
  alternates: {
    canonical: pathname,
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title,
    description,
    url: absoluteUrl(pathname),
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  robots: noindex
    ? {
        index: false,
        follow: false,
      }
    : {
        index: true,
        follow: true,
      },
});
