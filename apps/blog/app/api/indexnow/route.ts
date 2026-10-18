import { BLOG_URL, postUrl } from "@/functions/postUrl";

// IndexNow tells Bing (which feeds ChatGPT search, Copilot and DuckDuckGo) and Yandex about new or
// changed pages right away instead of waiting for a re-crawl. Vercel Cron calls this once a day
// (apps/blog/vercel.json) and it reports the posts updated in the last two days.
const INDEXNOW_KEY = "b6c6e8f9d6c5986958a3fd758bd1af3c";
const WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

type SlimPost = { id: string; slug: string; language_code?: string; updatedAt?: string };

async function recentPosts(since: number): Promise<SlimPost[]> {
  const posts: SlimPost[] = [];
  // The list is newest first, so a few pages cover any two-day window.
  for (let page = 1; page <= 3; page += 1) {
    const skip = (page - 1) * 100;
    const response = await fetch(
      `https://api.dex223.io/v1/core/api/blog/list-slim?page=${page}&limit=100&skip=${skip}`,
      { cache: "no-store" },
    );
    if (!response.ok) break;
    const batch = ((await response.json()) as { data?: SlimPost[] }).data ?? [];
    posts.push(...batch.filter((post) => Date.parse(post.updatedAt ?? "") >= since));
    if (batch.length < 100) break;
  }
  return posts;
}

export async function GET(request: Request) {
  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>" when the project defines it.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const posts = await recentPosts(Date.now() - WINDOW_MS);
  const urlList = posts.filter((post) => post.slug).map((post) => postUrl(post));
  if (!urlList.length) {
    return Response.json({ submitted: 0 });
  }
  // The index pages list the new posts, so they changed too.
  urlList.push(`${BLOG_URL}/en`);

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(BLOG_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: `${BLOG_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });

  return Response.json({ submitted: urlList.length, indexNowStatus: response.status });
}
