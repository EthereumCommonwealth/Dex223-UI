import type { MetadataRoute } from "next";

import { isListed } from "@/config/curation";
import { postUrl } from "@/functions/postUrl";
import { locales } from "@/i18n/routing";

type Frequency = "daily" | "monthly";
const BASE_URL = "https://blog.dex223.io";

export const revalidate = 86400;

type SlimPost = { id: string; slug: string; language_code?: string; updatedAt?: string };

async function publishedPosts(): Promise<SlimPost[]> {
  const posts: SlimPost[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= 20; page += 1) {
    // The API offsets by (page - 1) * limit + skip, so page alone walks the list; skip stays 0.
    const response = await fetch(
      `https://api.dex223.io/v1/core/api/blog/list-slim?page=${page}&limit=100&skip=0`,
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
  const home = (locale: string) => `${BASE_URL}/${locale}`;

  let posts: SlimPost[] = [];
  try {
    posts = await publishedPosts();
  } catch {
    // The index URLs are still worth publishing if the post list is down.
  }

  // Real dates only: a lastModified that is always "now" teaches crawlers to ignore it.
  const postDates = posts.map((post) => Date.parse(post.updatedAt ?? "")).filter(Number.isFinite);
  const newest = postDates.length ? new Date(Math.max(...postDates)) : undefined;

  const routes: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: home(locale),
    lastModified: newest,
    changeFrequency: "daily" as Frequency,
    priority: locale === "en" ? 1 : 0.8,
    alternates: {
      languages: {
        ...Object.fromEntries(locales.map((item) => [item, home(item)])),
        "x-default": home("en"),
      },
    },
  }));

  // One entry per post, at the same URL its page declares as canonical (its own language).
  for (const post of posts) {
    // Hidden and merged posts stay out of the sitemap (config/curation.ts).
    if (!post.slug || !isListed(post.id)) continue;
    routes.push({
      url: postUrl(post),
      lastModified: post.updatedAt ? new Date(post.updatedAt) : undefined,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return routes;
}
