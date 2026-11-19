import { notFound } from "next/navigation";
import { getMessages } from "next-intl/server";
import { PropsWithChildren } from "react";

import { Providers } from "@/app/[locale]/providers";
import SwapTracker from "@/app/[locale]/swap/components/SwapTracker";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import { SITE_NAME } from "@/config/seo";
import { SITE_URL } from "@/config/site";
import { Locale, routing } from "@/i18n/routing";

// Organization, WebSite and WebApplication entities so search engines show the
// brand, social profiles and app type correctly. The Organization is the one www.dex223.io
// publishes, so the site, the app and the blog describe a single DEX223 entity.
function structuredData(locale: Locale) {
  const org = "https://www.dex223.io/#organization";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": org,
        name: SITE_NAME,
        legalName: "DEX223 DAO LLC",
        url: "https://www.dex223.io",
        logo: "https://www.dex223.io/dex.png",
        sameAs: [
          "https://x.com/Dex_223",
          "https://t.me/Dex223_defi",
          "https://t.me/Dex_223",
          "https://discord.gg/t5bdeGC5Jk",
          "https://github.com/EthereumCommonwealth",
          "https://blog.dex223.io",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: locale,
        publisher: { "@id": org },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#app`,
        name: "DEX223 Exchange",
        url: `${SITE_URL}/${locale}/swap`,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires a Web3 wallet such as MetaMask or WalletConnect",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@id": org },
      },
    ],
  };
}

interface Props {
  params: Promise<{
    locale: Locale;
  }>;
}

export default async function RootLayout({ children, params }: PropsWithChildren<Props>) {
  const locale = (await params).locale;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <>
      <script
        type="application/ld+json"
        // Static, server-built JSON; no user input reaches it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(locale)) }}
      />
      <Providers messages={messages} locale={locale}>
        <div className="grid min-h-[100dvh] grid-rows-layout grid-cols-[minmax(0,1fr)] pb-[var(--bottom-notifications-height,0px)]">
          <Header />
          <div>{children}</div>
          <Footer />
        </div>
        <SwapTracker />
      </Providers>
    </>
  );
}
