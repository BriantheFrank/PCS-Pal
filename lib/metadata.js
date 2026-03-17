import { absoluteUrl, siteConfig } from "@/lib/site-config";

const buildRobots = (noindex) => ({
  index: !noindex,
  follow: true,
  googleBot: {
    index: !noindex,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
});

export const defaultSiteRobots = buildRobots(false);

export const buildPageMetadata = ({
  title,
  description,
  pathname,
  noindex = false,
  keywords = [],
  openGraphType = "website",
}) => ({
  title,
  description,
  keywords,
  alternates: {
    canonical: pathname,
  },
  openGraph: {
    type: openGraphType,
    locale: siteConfig.locale,
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
  robots: buildRobots(noindex),
});
