import "../assets/styles/globals.css";
import "@repo/ui/styles.css";

import { GoogleAnalytics } from "@next/third-parties/google";
import clsx from "clsx";
import { Golos_Text } from "next/font/google";
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

interface Props {
  params: Promise<{
    locale: "es" | "en" | "zh";
  }>;
}

export default async function RootLayout({ children, params }: PropsWithChildren<Props>) {
  const locale = (await params).locale;
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
  title: "Dex223 Blog",
  description:
    "Explore in-depth insights, updates, and guides on Dex223 – your go-to source for decentralized exchange (DEX) development, token standards, and blockchain innovations. Stay ahead in the Web3 ecosystem!",
};
