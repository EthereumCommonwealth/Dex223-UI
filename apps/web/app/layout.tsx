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

export default async function RootLayout({ children }: PropsWithChildren<{}>) {
  const initialState = cookieToInitialState(config, (await headers()).get("cookie"));

  return (
    <html suppressHydrationWarning>
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
