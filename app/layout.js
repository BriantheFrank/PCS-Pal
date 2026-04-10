import "../styles.css";

import { NativeAuthProvider } from "@/components/auth/native-auth-provider";
import { FeedbackLauncher } from "@/components/feedback/feedback-launcher";
import { LegacyRuntimeScripts } from "@/components/site/chrome";
import { defaultSiteRobots } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "military PCS planning",
    "Permanent Change of Station",
    "military move checklist",
    "PCS inventory tracking",
    "PCS logistics planning",
    "military destination base research",
    "PCS move organizer",
    "Army duty station guides",
  ],
  robots: defaultSiteRobots,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.siteUrl,
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700&f[]=satoshi@400,500,700&display=swap"
        />
      </head>
      <body>
        <NativeAuthProvider>
          {children}
          <FeedbackLauncher />
        </NativeAuthProvider>
        <LegacyRuntimeScripts />
      </body>
    </html>
  );
}
