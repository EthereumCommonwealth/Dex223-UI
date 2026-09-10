import type { MetadataRoute } from "next";

import { SITE_URL } from "@/config/site";
import { locales } from "@/i18n/routing";

// Public, crawlable surfaces only. Routes keyed by a position or pool id are
// per-user and unbounded, so they are excluded here and in robots.ts.
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] =
  [
    { path: "swap", priority: 1, changeFrequency: "daily" },
    { path: "pools", priority: 0.9, changeFrequency: "daily" },
    { path: "pools/positions", priority: 0.6, changeFrequency: "weekly" },
    { path: "add", priority: 0.8, changeFrequency: "monthly" },
    { path: "margin-trading", priority: 0.8, changeFrequency: "weekly" },
    { path: "portfolio", priority: 0.6, changeFrequency: "weekly" },
    { path: "token-listing", priority: 0.7, changeFrequency: "weekly" },
    { path: "buy-crypto", priority: 0.6, changeFrequency: "monthly" },
    { path: "guidelines", priority: 0.4, changeFrequency: "yearly" },
  ];

const url = (locale: string, path: string) => `${SITE_URL}/${locale}/${path}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  // One entry per locale per route, each carrying the full alternates set. The
  // previous sitemap emitted `languages: {}` - an empty hreflang map - so search
  // engines had no way to associate the translated pages with each other and were
  // free to treat them as duplicates.
  return ROUTES.flatMap(({ path, priority, changeFrequency }) => {
    const languages = Object.fromEntries(locales.map((l) => [l, url(l, path)]));

    return locales.map((locale) => ({
      url: url(locale, path),
      lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          ...languages,
          "x-default": url("en", path),
        },
      },
    }));
  });
}
