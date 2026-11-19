import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, setRequestLocale } from "next-intl/server";
import { PropsWithChildren } from "react";

import { Providers } from "@/app/[locale]/providers";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import { BLOG_URL } from "@/functions/postUrl";
import { Locale, locales, routing } from "@/i18n/routing";
interface Props {
  params: Promise<{
    locale: Locale;
  }>;
}

export default async function RootLayout({ children, params }: PropsWithChildren<Props>) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  setRequestLocale(locale);

  return (
    <>
      <Providers messages={messages} locale={locale}>
        <div className="grid h-[100svh] grid-rows-layout">
          <Header />
          <div className="pb-4 lg:pb-[80px]">{children}</div>
          <Footer />
        </div>
      </Providers>
    </>
  );
}

const SHARE_IMAGE = "https://www.dex223.io/social-link.png";
const TITLE = "DEX223 Blog: ERC-223, DeFi and Development Updates";
const DESCRIPTION =
  "News, development reports and guides from DEX223, the decentralized exchange for ERC-223 and ERC-20 tokens: token standards, DeFi security and product updates.";

// The blog index for each language. Posts set their own metadata, which overrides this.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const url = `${BLOG_URL}/${locale}`;

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `${BLOG_URL}/${l}`])),
        "x-default": `${BLOG_URL}/en`,
      },
    },
    openGraph: {
      type: "website",
      siteName: "DEX223 Blog",
      title: TITLE,
      description: DESCRIPTION,
      url,
      images: [{ url: SHARE_IMAGE, width: 1600, height: 900 }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@Dex_223",
      title: TITLE,
      description: DESCRIPTION,
      images: [SHARE_IMAGE],
    },
  };
}
