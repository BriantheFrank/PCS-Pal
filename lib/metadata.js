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
}) => ({
  title,
  description,
  alternates: {
    canonical: pathname,
  },
  openGraph: {
    type: "website",
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
