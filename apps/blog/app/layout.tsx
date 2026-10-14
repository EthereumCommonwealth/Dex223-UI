import "../assets/styles/globals.css";
import "@repo/ui/styles.css";

import { GoogleAnalytics } from "@next/third-parties/google";
import clsx from "clsx";
import { Golos_Text } from "next/font/google";
import { getLocale } from "next-intl/server";
import { PropsWithChildren } from "react";

import Providers from "@/app/providers";
import ClientOnly from "@/components/common/ClientOnly";
import SEOAgent from "@/components/common/SEOAgent";

const isProd = process.env.NODE_ENV === "production";

const golos_text = Golos_Text({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

export default async function RootLayout({ children }: PropsWithChildren) {
  // This layout sits outside app/[locale], so it has no locale param; read it from next-intl.
  const locale = await getLocale();
  return (
    <html suppressHydrationWarning lang={locale}>
      <head>
        {isProd ? (
          <ClientOnly>
            <SEOAgent />
          </ClientOnly>
        ) : null}
      </head>

      <body className={clsx(golos_text.className)}>
        <Providers>{children}</Providers>
      </body>
      <GoogleAnalytics gaId="G-E9D88G4XGB" />
    </html>
  );
}

export const metadata = {
  metadataBase: new URL("https://blog.dex223.io"),
  title: "DEX223 Blog: ERC-223, DeFi and Development Updates",
  description:
    "News, development reports and guides from DEX223, the decentralized exchange for ERC-223 and ERC-20 tokens: token standards, DeFi security and product updates.",
};
