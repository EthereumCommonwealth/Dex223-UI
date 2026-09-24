import DOMPurify from "isomorphic-dompurify";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PropsWithChildren } from "react";

import CopyLinkButton from "@/app/[locale]/components/CopyLinkButton";
import { PostDetails } from "@/app/[locale]/types/Post";
import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import ScrollToTopButton from "@/components/buttons/ScrollToTopButton";
import { formatPostDate } from "@/functions/formatPostDate";
import { Link } from "@/i18n/routing";

function PostContainer({ children }: PropsWithChildren<{}>) {
  return <div className="w-full max-w-[728px] mx-auto px-4">{children}</div>;
}
export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations("Post");
  const res = await fetch(`https://api.dex223.io/v1/core/api/blog/detail/${id}`);
  const post: PostDetails = await res.json();

  DOMPurify.addHook("afterSanitizeAttributes", (node: Element) => {
    // Restrict iframe sources
    if (node.tagName === "IFRAME") {
      const src = node.getAttribute("src") || "";
      if (!src.startsWith("https://www.youtube.com/embed/")) {
        node.remove();
      } else {
        node.setAttribute("sandbox", "allow-same-origin allow-scripts allow-popups");
        node.setAttribute("referrerpolicy", "no-referrer");
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

    // Secure external links
    if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
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
    }).replace(
      /<iframe([\s\S]*?)<\/iframe>/gi,
      '<div class="aspect-w-16 aspect-h-9"><iframe$1</iframe></div>',
    ),
  });

  if (!post) {
    return (
      <div>
        <h1>Post not found</h1>
      </div>
    );
  }
  return (
    <>
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

        <h1 className="mb-2 md:mb-5 text-24 md:text-32">{post.title}</h1>
        <p className="text-16 md:text-20 mb-8 md:mb-[60px]">{post.description}</p>
      </PostContainer>
      <Container>
        <div className="w-full relative min-h-[203px] md:min-h-[400px] mb-8 md:mb-[60px]">
          <Image
            className="xl:rounded-3"
            objectFit="cover"
            layout="fill"
            src={post.thumbnail?.link || ""}
            alt={post.thumbnail?.alt || ""}
          />
        </div>
      </Container>
      <PostContainer>
        <div className="prose last:prose-th:pr-4 last:prose-td:pr-4 prose-th:align-top prose-th:py-2 prose-headings:text-primary-text first:prose-th:pl-5 first:prose-td:pl-5 prose-table:rounded-5 prose-table:overflow-hidden prose-td:bg-primary-bg prose-tr:border-secondary-border prose-th:bg-quaternary-bg [&>p]:prose-li:my-2 text-primary-text prose-li:my-2 prose-li:text-secondary-text prose-li:marker:text-secondary-text hover:prose-a:text-green-hover prose-a:duration-200 prose-a:cursor-pointer prose-lg max-lg:prose-base prose-p:text-secondary-text prose-strong:text-inherit max-w-none prose-a:text-green prose-headings::text-primary-text  prose-a:font-normal">
          <div dangerouslySetInnerHTML={sanitizedData()} />
        </div>
      </PostContainer>
      <ScrollToTopButton />
    </>
  );
}
