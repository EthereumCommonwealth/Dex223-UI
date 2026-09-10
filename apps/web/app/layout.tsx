import "../assets/styles/globals.css";
import "@repo/ui/styles.css";

import clsx from "clsx";
import { Golos_Text } from "next/font/google";
import { headers } from "next/headers";
import { PropsWithChildren } from "react";
import { cookieToInitialState } from "wagmi";

import Providers from "@/app/providers";
import { config } from "@/config/wagmi/config";

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
  const initialState = cookieToInitialState(config, (await headers()).get("cookie"));

  const locale = (await params).locale;

  return (
    <html suppressHydrationWarning lang={locale}>
      <body className={clsx(golos_text.className)}>
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}

export const metadata = {
  title: "Dex Exchange",
  description:
    "Next generation decentralized exchange for ERC-223 & ERC-20 tokens with margin trading, 15% cheaper GAS fees and transparent auto-listings for any tokens.",
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
