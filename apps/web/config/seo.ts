import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { type Locale, locales } from "@/i18n/routing";

export const SITE_NAME = "DEX223";
export const X_HANDLE = "@Dex_223";

const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  es: "es_ES",
  zh: "zh_CN",
  ko: "ko_KR",
  fr: "fr_FR",
  pt: "pt_BR",
  ru: "ru_RU",
};

/** Keys of the `Seo` namespace in messages/*.json. Each has a title and a description. */
export type SeoPage =
  | "swap"
  | "margin_swap"
  | "margin_trading"
  | "pools"
  | "pool"
  | "positions"
  | "add"
  | "converter"
  | "create_token"
  | "buy_crypto"
  | "token_listing"
  | "token_listing_contracts"
  | "token_listing_add"
  | "statistics"
  | "guidelines"
  | "portfolio"
  | "revenue"
  | "markets"
  | "governance"
  | "multisig"
  | "send"
  | "pay";

/**
 * Localized title, description, canonical, hreflang alternates, Open Graph and
 * Twitter card for one route. `path` is the route without the locale prefix.
 * The share image comes from app/opengraph-image.tsx, which Next applies to every route.
 */
export async function pageMetadata(
  locale: Locale,
  page: SeoPage,
  path: string,
  { noindex = false }: { noindex?: boolean } = {},
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Seo" });
  const title = t(`${page}.title`);
  const description = t(`${page}.description`);
  const url = `/${locale}/${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}/${path}`])),
        "x-default": `/en/${path}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
    },
    twitter: {
      card: "summary_large_image",
      site: X_HANDLE,
      title,
      description,
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** Layout helper: `export const generateMetadata = seoFor("swap", "swap")`. */
export function seoFor(page: SeoPage, path: string, options?: { noindex?: boolean }) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: Locale }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    return pageMetadata(locale, page, path, options);
  };
}
