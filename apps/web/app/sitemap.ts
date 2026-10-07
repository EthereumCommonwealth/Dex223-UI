import type { MetadataRoute } from "next";

import { indexingOrigin } from "@/config/site";
import { locales } from "@/i18n/routing";

export const dynamic = "force-dynamic";

// Public product pages only. Portfolio, positions, payments, and id-keyed
// routes are private or unbounded, so they stay out of the sitemap and robots.ts.
const ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "swap", priority: 1, changeFrequency: "daily" },
  { path: "pools", priority: 0.9, changeFrequency: "daily" },
  { path: "add", priority: 0.8, changeFrequency: "monthly" },
  { path: "margin-trading", priority: 0.8, changeFrequency: "weekly" },
  { path: "margin-swap", priority: 0.7, changeFrequency: "weekly" },
  { path: "token-listing", priority: 0.7, changeFrequency: "weekly" },
  { path: "token-listing/contracts", priority: 0.6, changeFrequency: "weekly" },
  { path: "create-token", priority: 0.6, changeFrequency: "monthly" },
  { path: "buy-crypto", priority: 0.6, changeFrequency: "monthly" },
  { path: "converter", priority: 0.7, changeFrequency: "monthly" },
  { path: "statistics", priority: 0.7, changeFrequency: "daily" },
  { path: "markets", priority: 0.6, changeFrequency: "hourly" },
  { path: "revenue", priority: 0.6, changeFrequency: "weekly" },
  { path: "guidelines", priority: 0.4, changeFrequency: "yearly" },
  { path: "governance", priority: 0.3, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { url: siteUrl, indexable } = await indexingOrigin();
  if (!indexable) return [];

  const lastModified = new Date();
  const pageUrl = (locale: string, path: string) =>
    path ? `${siteUrl}/${locale}/${path}` : `${siteUrl}/${locale}`;

  return ROUTES.flatMap(({ path, priority, changeFrequency }) => {
    const languages = Object.fromEntries(locales.map((locale) => [locale, pageUrl(locale, path)]));

    return locales.map((locale) => ({
      url: pageUrl(locale, path),
      lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          ...languages,
          "x-default": pageUrl("en", path),
        },
      },
    }));
  });
}
