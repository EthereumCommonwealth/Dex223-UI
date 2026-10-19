import DOMPurify from "isomorphic-dompurify";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PropsWithChildren } from "react";

import CopyLinkButton from "@/app/[locale]/components/CopyLinkButton";
import { PostDetails } from "@/app/[locale]/types/Post";
import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import ScrollToTopButton from "@/components/buttons/ScrollToTopButton";
import { HIDDEN_POST_IDS, POST_REDIRECTS } from "@/config/curation";
import { resolvePost } from "@/functions/blogPosts";
import { formatPostDate } from "@/functions/formatPostDate";
import { EXTERNAL_LINK_REL, isExternalHref } from "@/functions/linkTarget";
import { postPath, postUrl } from "@/functions/postUrl";
import { Link } from "@/i18n/routing";

function PostContainer({ children }: PropsWithChildren<{}>) {
  return <div className="w-full max-w-[728px] mx-auto px-4">{children}</div>;
}
type PostPageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolvePost(slug);

  // Old id URLs and merged posts redirect from the page itself; they need no metadata of their own.
  if (!resolved || resolved.legacyId || POST_REDIRECTS[resolved.post.id]) {
    return {};
  }
  const { post } = resolved;
  // Curated out of search (config/curation.ts): still reachable by link, but not indexed.
  const robots = HIDDEN_POST_IDS.has(post.id) ? { index: false, follow: true } : undefined;

  const url = postUrl(post);
  const images = post.thumbnail?.link
    ? [{ url: post.thumbnail.link, alt: post.thumbnail.alt || post.title }]
    : undefined;

  return {
    robots,
    title: `${post.title} | Dex223 Blog`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: "Dex223 Blog",
      title: post.title,
      description: post.description,
      url,
      images,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      site: "@Dex_223",
      title: post.title,
      description: post.description,
      images: images?.map((image) => image.url),
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations("Post");
  const resolved = await resolvePost(slug);

  // Unknown slugs and ids show the not-found page instead of an empty post.
  if (!resolved) {
    notFound();
  }

  // Old links (/en/<id>?slug=..., often with tracking parameters) move permanently to the
  // post's slug URL, so their links and search ranking carry over.
  // Merged explainers move permanently to the post they were folded into (config/curation.ts).
  const mergedInto = POST_REDIRECTS[resolved.post.id];
  if (mergedInto) {
    permanentRedirect(`/en/${encodeURIComponent(mergedInto)}`);
  }

  if (resolved.legacyId) {
    permanentRedirect(postPath(resolved.post));
  }

  const { post } = resolved;

  // DOMPurify is a module singleton on the server: drop the hook from the previous
  // request before adding it again, or every render stacks one more copy.
  DOMPurify.removeHooks("afterSanitizeAttributes");
  DOMPurify.addHook("afterSanitizeAttributes", (node: Element) => {
    // Restrict iframe sources
    if (node.tagName === "IFRAME") {
      const src = node.getAttribute("src") || "";
      if (!src.startsWith("https://www.youtube.com/embed/")) {
        node.remove();
      } else {
        node.setAttribute("sandbox", "allow-same-origin allow-scripts allow-popups");
        // YouTube refuses to play without a referrer (error 153), so send the origin only.
        node.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      }
    }

    // Restrict style properties
    if (node.hasAttribute("style")) {
      const safeProperties = [
        "color",
        "background-color",
        "text-align",
        "font-weight",
        "font-style",
        "text-decoration",
      ];

      const style = node
        .getAttribute("style")
        ?.split(";")
        .map((rule) => rule.trim())
        .filter((rule) => {
          const [property] = rule.split(":").map((s) => s.trim());
          return safeProperties.includes(property);
        })
        .join(";");
      if (style) {
        node.setAttribute("style", style);
      }
    }

    // Dex223 links stay in this tab; other sites open in a new tab with the opener detached
    if (node.tagName === "A") {
      if (isExternalHref(node.getAttribute("href"))) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", EXTERNAL_LINK_REL);
      } else {
        node.removeAttribute("target");
      }
    }
  });

  const sanitizedData = () => ({
    __html: DOMPurify.sanitize(post.content, {
      ALLOWED_TAGS: [
        "b",
        "strong",
        "i",
        "em",
        "u",
        "s",
        "strike",
        "del",
        "mark",
        "sup",
        "sub",
        "small",
        "code",
        "pre",
        "kbd",
        "var",
        "samp",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "br",
        "hr",
        "div",
        "span",
        "ul",
        "ol",
        "li",
        "dl",
        "dt",
        "dd",
        "a",
        "img",
        "figure",
        "figcaption",
        "video",
        "audio",
        "source",
        "iframe",
        "table",
        "thead",
        "tbody",
        "tfoot",
        "tr",
        "td",
        "th",
        "caption",
        "colgroup",
        "col",
        "form",
        "input",
        "textarea",
        "button",
        "select",
        "option",
        "label",
        "fieldset",
        "legend",
        "article",
        "section",
        "aside",
        "nav",
        "blockquote",
        "cite",
        "q",
        "address",
        "time",
        "abbr",
        "dfn",
        "details",
        "summary",
        "progress",
        "meter",
        "ruby",
        "rt",
        "rp",
      ],
      ALLOWED_ATTR: [
        "src",
        "width",
        "height",
        "allow",
        "allowfullscreen",
        "frameborder",
        "href",
        "target",
        "alt",
        "title",
        "rel",
        "controls",
        "autoplay",
        "style",
      ],
    })
      .replace(
        /<iframe([\s\S]*?)<\/iframe>/gi,
        '<div class="aspect-w-16 aspect-h-9"><iframe$1</iframe></div>',
      )
      // Let wide tables scroll sideways on phones instead of crushing their columns.
      .replace(/<table([\s\S]*?)<\/table>/gi, '<div class="table-scroll"><table$1</table></div>'),
  });

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url: postUrl(post),
    mainEntityOfPage: postUrl(post),
    inLanguage: post.language_code || "en",
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    image: post.thumbnail?.link || undefined,
    keywords: post.tags?.length ? post.tags.join(", ") : undefined,
    author: post.author
      ? { "@type": "Person", name: post.author.username }
      : { "@id": "https://www.dex223.io/#organization" },
    publisher: {
      "@type": "Organization",
      "@id": "https://www.dex223.io/#organization",
      name: "DEX223",
      logo: { "@type": "ImageObject", url: "https://www.dex223.io/dex.png" },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Built from the post's own fields; "<" is escaped so text cannot close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }}
      />
      <PostContainer>
        <div className="flex justify-between my-4 md:my-10 flex-wrap gap-y-2 ">
          <Link
            href="/"
            className="flex items-center gap-2 text-secondary-text py-2 hocus:text-green-hover duration-200 font-medium"
          >
            <Svg iconName="back" />
            {t("back_to_blog")}
          </Link>

          <div className="flex gap-3 flex-wrap">
            {post.tags?.map((tag: string | undefined) => {
              return (
                <div
                  key={tag}
                  className="rounded-2 border border-secondary-border text-secondary-text flex items-center px-3 h-8 md:h-10 text-14 md:text-16 "
                >
                  {tag}
                </div>
              );
            })}

            <div className="flex-shrink-0 bg-tertiary-bg flex gap-1 items-center h-8 md:h-10 text-12 md:text-16 px-4 rounded-2">
              <Svg
                className="text-tertiary-text !w-4 !h-4 md:!w-5 md:!h-5"
                iconName="date"
                size={20}
              />
              <span className="text-tertiary-text">{t("published")}</span>
              <time dateTime={post.createdAt} className="text-secondary-text">
                {formatPostDate(post.createdAt, locale)}
              </time>
            </div>

            {post.author && (
              <div className="bg-tertiary-bg flex gap-1 items-center py-2 px-4 h-8 md:h-10 text-12 md:text-16 rounded-2">
                <Svg
                  className="text-tertiary-text !w-4 !h-4 md:!w-5 md:!h-5"
                  iconName="author"
                  size={20}
                />
                <span className="text-tertiary-text">{t("author")}</span>
                <span className="text-secondary-text">{post.author.username}</span>
              </div>
            )}

            <CopyLinkButton />
          </div>
        </div>

        <h1 className="mb-3 md:mb-5 text-[28px] leading-[36px] md:text-40 md:leading-[52px] font-semibold text-balance">
          {post.title}
        </h1>
        <p className="text-18 md:text-20 text-secondary-text mb-8 md:mb-[60px]">
          {post.description}
        </p>
      </PostContainer>
      {post.thumbnail?.link && (
        <Container>
          <div className="w-full relative min-h-[203px] md:min-h-[400px] mb-8 md:mb-[60px]">
            <Image
              className="xl:rounded-3 object-cover"
              fill
              priority
              sizes="(max-width: 1406px) 100vw, 1406px"
              src={post.thumbnail.link}
              alt={post.thumbnail.alt ?? ""}
            />
          </div>
        </Container>
      )}
      <PostContainer>
        <div className="post-content prose last:prose-th:pr-4 last:prose-td:pr-4 prose-th:align-top prose-th:py-2 prose-headings:text-primary-text first:prose-th:pl-5 first:prose-td:pl-5 prose-table:rounded-5 prose-table:overflow-hidden prose-td:bg-primary-bg prose-tr:border-secondary-border prose-th:bg-quaternary-bg [&>p]:prose-li:my-2 text-primary-text prose-li:my-2 prose-li:text-secondary-text prose-li:marker:text-secondary-text hover:prose-a:text-green-hover prose-a:duration-200 prose-a:cursor-pointer prose-lg max-lg:prose-base prose-p:text-secondary-text prose-strong:text-inherit max-w-none prose-a:text-green prose-headings::text-primary-text  prose-a:font-normal">
          <div dangerouslySetInnerHTML={sanitizedData()} />
        </div>
      </PostContainer>
      <ScrollToTopButton />
    </>
  );
}
