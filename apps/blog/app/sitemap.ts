import type { MetadataRoute } from "next";

import { locales } from "@/i18n/routing";

type Frequency = "daily" | "monthly";
const BASE_URL = "https://blog.dex223.io";

export const revalidate = 86400;

type SlimPost = { id: string };

async function publishedPosts(): Promise<SlimPost[]> {
  const posts: SlimPost[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= 20; page += 1) {
    const skip = (page - 1) * 100;
    const response = await fetch(
      `https://api.dex223.io/v1/core/api/blog/list-slim?page=${page}&limit=100&skip=${skip}`,
      { next: { revalidate: 86400 } },
    );
    if (!response.ok) break;

    const body = (await response.json()) as { data?: SlimPost[] };
    const batch = body.data ?? [];
    let added = 0;
    for (const post of batch) {
      if (!post.id || seen.has(post.id)) continue;
      seen.add(post.id);
      posts.push(post);
      added += 1;
    }
    if (added === 0 || batch.length < 100) break;
  }

  return posts;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const home = (locale: string) => `${BASE_URL}/${locale}`;

  const routes: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: home(locale),
    lastModified,
    changeFrequency: "daily" as Frequency,
    priority: locale === "en" ? 1 : 0.8,
    alternates: {
      languages: {
        ...Object.fromEntries(locales.map((item) => [item, home(item)])),
        "x-default": home("en"),
      },
    },
  }));

  try {
    const posts = await publishedPosts();
    for (const post of posts) {
      for (const locale of locales) {
        routes.push({
          url: `${BASE_URL}/${locale}/${post.id}`,
          lastModified,
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  } catch {
    // The index URLs are still worth publishing if the post list is down.
  }

  return routes;
}
