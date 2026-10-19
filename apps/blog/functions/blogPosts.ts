import { PostDetails } from "@/app/[locale]/types/Post";

const API = "https://api.dex223.io/v1/core/api/blog";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SlimPost = { id: string; slug: string };

// Next.js memoizes this GET, so a page and its metadata share one request.
export async function fetchPostById(id: string): Promise<PostDetails | null> {
  const res = await fetch(`${API}/detail/${id}`);
  if (!res.ok) return null;
  const post: PostDetails = await res.json();
  return post?.id ? post : null;
}

async function slimPosts(fresh: boolean): Promise<SlimPost[]> {
  const posts: SlimPost[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const skip = (page - 1) * 100;
    const res = await fetch(
      `${API}/list-slim?page=${page}&limit=100&skip=${skip}`,
      fresh ? { cache: "no-store" } : { next: { revalidate: 300 } },
    );
    if (!res.ok) break;
    const batch = ((await res.json()) as { data?: SlimPost[] }).data ?? [];
    posts.push(...batch);
    if (batch.length < 100) break;
  }
  return posts;
}

function sameSlug(a: string, b: string) {
  const decode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  return decode(a) === decode(b);
}

// A post URL segment is its slug. Old links used the post id (/en/<uuid>?slug=...); those
// still resolve, and the page redirects them to the slug URL.
export async function resolvePost(
  segment: string,
): Promise<{ post: PostDetails; legacyId: boolean } | null> {
  if (UUID.test(segment)) {
    const post = await fetchPostById(segment);
    return post ? { post, legacyId: true } : null;
  }

  // The list is cached for five minutes; a slug published since then is looked up fresh once.
  let match = (await slimPosts(false)).find((p) => p.slug && sameSlug(p.slug, segment));
  if (!match) match = (await slimPosts(true)).find((p) => p.slug && sameSlug(p.slug, segment));
  if (!match) return null;

  const post = await fetchPostById(match.id);
  return post ? { post, legacyId: false } : null;
}
