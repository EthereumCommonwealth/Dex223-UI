import "../assets/styles/globals.css";
import "@repo/ui/styles.css";

import clsx from "clsx";
import type { Metadata } from "next";
import { Golos_Text } from "next/font/google";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { PropsWithChildren } from "react";
import { cookieToInitialState } from "wagmi";

import Providers from "@/app/providers";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { SITE_NAME, X_HANDLE } from "@/config/seo";
import { SITE_URL } from "@/config/site";
import { config } from "@/config/wagmi/config";
const golos_text = Golos_Text({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
  adjustFontFallback: false,
});

export default async function RootLayout({ children }: PropsWithChildren) {
  const initialState = cookieToInitialState(config, (await headers()).get("cookie"));

  // This layout sits outside app/[locale], so it has no locale param; read it from next-intl.
  const locale = await getLocale();

  return (
    <html suppressHydrationWarning lang={locale}>
      <body className={clsx(golos_text.className)}>
        <Providers initialState={initialState}>{children}</Providers>
        <GoogleAnalytics />
      </body>
    </html>
  );
}

const DEFAULT_TITLE = "DEX223: Trade ERC-20 and ERC-223 Tokens";
const DEFAULT_DESCRIPTION =
  "The decentralized exchange built for ERC-223 and ERC-20. Swap, provide concentrated liquidity, lend, borrow and trade on margin with permissionless token listing.";

// Defaults for every route. Each route layout adds a localized title, description,
// canonical and hreflang alternates through pageMetadata() in config/seo.ts.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "DEX223",
    "ERC-223",
    "ERC-20",
    "decentralized exchange",
    "DEX",
    "token swap",
    "token converter",
    "concentrated liquidity",
    "margin trading",
    "crypto lending",
    "token listing",
    "Ethereum",
  ],
  authors: [{ name: SITE_NAME, url: "https://dex223.io" }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "finance",
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    site: X_HANDLE,
    creator: X_HANDLE,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
};

// Next.js supplies width=device-width, initial-scale=1 by default but nothing else.
// viewportFit=cover lets the layout extend into the safe areas on notched phones,
// and themeColor stops the browser chrome rendering a light bar above a dark app.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#0F0F0F",
};
