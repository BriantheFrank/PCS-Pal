import "../styles.css";

import { NativeAuthProvider } from "@/components/auth/native-auth-provider";
import { LegacyRuntimeScripts } from "@/components/site/chrome";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
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
      <body>
        <NativeAuthProvider>{children}</NativeAuthProvider>
        <LegacyRuntimeScripts />
      </body>
    </html>
  );
}
