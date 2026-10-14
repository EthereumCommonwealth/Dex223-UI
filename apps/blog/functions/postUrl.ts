import { locales } from "@/i18n/routing";

export const BLOG_URL = "https://blog.dex223.io";

// A post's one canonical address: its own language, its id and its slug. Every locale can render
// any post, so without this one article shows up under seven URLs.
export function postPath(post: { id: string; slug: string; language_code?: string | null }) {
  const language = locales.includes(post.language_code as (typeof locales)[number])
    ? post.language_code
    : "en";
  return `/${language}/${post.id}?slug=${encodeURIComponent(post.slug)}`;
}

export function postUrl(post: { id: string; slug: string; language_code?: string | null }) {
  return `${BLOG_URL}${postPath(post)}`;
}
