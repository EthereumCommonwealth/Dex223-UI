import { notFound } from "next/navigation";
import { getMessages } from "next-intl/server";
import { PropsWithChildren } from "react";

import { Providers } from "@/app/[locale]/providers";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import { SITE_NAME } from "@/config/seo";
import { SITE_URL } from "@/config/site";
import { Locale, routing } from "@/i18n/routing";

// Organization, WebSite and WebApplication entities so search engines show the
// brand, social profiles and app type correctly.
function structuredData(locale: Locale) {
  const org = `${SITE_URL}/#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": org,
        name: SITE_NAME,
        url: "https://dex223.io",
        logo: `${SITE_URL}/icon.svg`,
        sameAs: [
          "https://x.com/Dex_223",
          "https://t.me/Dex223_defi",
          "https://t.me/Dex_223",
          "https://discord.gg/t5bdeGC5Jk",
          "https://github.com/EthereumCommonwealth/Dex223-UI",
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
        <div className="grid h-[100dvh] grid-rows-layout grid-cols-[minmax(0,1fr)]">
          <Header />
          <div>{children}</div>
          <Footer />
        </div>
      </Providers>
    </>
  );
}
