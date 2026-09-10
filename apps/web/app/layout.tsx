import "../assets/styles/globals.css";
import "@repo/ui/styles.css";

import clsx from "clsx";
import { Golos_Text } from "next/font/google";
import { headers } from "next/headers";
import { PropsWithChildren } from "react";
import { cookieToInitialState } from "wagmi";

import Providers from "@/app/providers";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { config } from "@/config/wagmi/config";
import { Locale } from "@/i18n/routing";

const golos_text = Golos_Text({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
  adjustFontFallback: false,
});

interface Props {
  params: Promise<{
    locale: Locale;
  }>;
}

export default async function RootLayout({ children, params }: PropsWithChildren<Props>) {
  const initialState = cookieToInitialState(config, (await headers()).get("cookie"));

  const locale = (await params).locale;

  return (
    <html suppressHydrationWarning lang={locale}>
      <body className={clsx(golos_text.className)}>
        <Providers initialState={initialState}>{children}</Providers>
        <GoogleAnalytics />
      </body>
    </html>
  );
}

export const metadata = {
  title: "Dex Exchange",
  description:
    "Next generation decentralized exchange for ERC-223 & ERC-20 tokens with margin trading, 15% cheaper GAS fees and transparent auto-listings for any tokens.",
};
