import DOMPurify from "isomorphic-dompurify";
import Image from "next/image";
import { PropsWithChildren } from "react";

import { PostDetails } from "@/app/[locale]/blog/types/Post";
import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import { Link, locales } from "@/i18n/routing";

// export const dynamic = "force-static";
// export async function generateStaticParams() {
//   const res = await fetch("https://api.dex223.io/v1/core/api/blog/list/ids");
//
//   const allIds: string[] = await res.json();
//
//   return allIds.flatMap((value) => locales.map((locale) => ({ id: value, lang: locale })));
// }

function PostContainer({ children }: PropsWithChildren<{}>) {
  return <div className="w-full max-w-[728px] mx-auto px-4">{children}</div>;
}
export default async function PostPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const res = await fetch(`https://api.dex223.io/v1/core/api/blog/detail/${id}`);
  const post: PostDetails = await res.json();

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "IFRAME") {
      const src = node.getAttribute("src") || "";
      if (!src.startsWith("https://www.youtube.com/embed/")) {
        node.remove(); // Remove iframe if it's not from YouTube
      }
    }
  });

  const sanitizedData = () => ({
    __html: DOMPurify.sanitize(post.content, {
      ALLOWED_TAGS: [
        "iframe",
        "p",
        "b",
        "i",
        "u",
        "a",
        "div",
        "span",
        "th",
        "td",
        "li",
        "ul",
        "ol",
        "table",
        "tr",
        "tbody",
        "thead",
      ], // Add 'iframe' to the allowed tags
      ALLOWED_ATTR: [
        "src",
        "width",
        "height",
        "allow",
        "allowfullscreen",
        "frameborder",
        "style",
        "href",
        "target",
      ], // Allow necessary iframe attributes
    }).replace(
      /<iframe([\s\S]*?)<\/iframe>/g,
      '<div class="aspect-w-16 aspect-h-9"><iframe$1</iframe></div>',
    ),
  });

  console.log(post);

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
            href="/blog"
            className="flex items-center gap-2 text-secondary-text py-2 hocus:text-green-hover duration-200 font-medium"
          >
            <Svg iconName="back" />
            Back to blog
          </Link>

          <div className="flex gap-3">
            {post.tags.map((tag) => {
              return (
                <div
                  key={tag}
                  className="rounded-2 border border-secondary-border text-secondary-text py-2 px-3"
                >
                  {tag}
                </div>
              );
            })}

            <div className="bg-tertiary-bg flex gap-1 items-center h-8 md:h-10 text-12 md:text-16 px-4 rounded-2">
              <Svg
                className="text-tertiary-text !w-4 !h-4 md:!w-5 md:!h-5"
                iconName="date"
                size={20}
              />
              <span className="text-tertiary-text">Publication date:</span>
              <span className="text-secondary-text">
                {new Date(post.createdAt)
                  .toLocaleString("en", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                  .replace(/\//g, ".")}
              </span>
            </div>

            {post.author && (
              <div className="bg-tertiary-bg flex gap-1 items-center py-2 px-4 rounded-2">
                <Svg
                  className="text-tertiary-text !w-4 !h-4 md:!w-5 md:!h-5"
                  iconName="author"
                  size={20}
                />
                <span className="text-tertiary-text">Author:</span>
                <span className="text-secondary-text">{post.author.email}</span>
              </div>
            )}
          </div>
        </div>

        <h1 className="mb-2 md:mb-5 text-24 md:text-32">{post.title}</h1>
        <p className="text-16 md:text-20 mb-8 md:mb-[60px]">{post.description}</p>
      </PostContainer>
      {!post.links[0]?.link && (
        <Container>
          <div className="w-full relative min-h-[203px] md:min-h-[400px] mb-8 md:mb-[60px]">
            <Image
              className="xl:rounded-3"
              objectFit="cover"
              layout="fill"
              src={post.thumbnail.link}
              alt={post.thumbnail.alt}
            />
          </div>
        </Container>
      )}
      <PostContainer>
        <div className="prose first:prose-th:pl-5 first:prose-td:pl-5 prose-table:rounded-5 prose-table:overflow-hidden prose-td:bg-primary-bg prose-tr:border-secondary-border prose-th:bg-quaternary-bg [&>p]:prose-li:my-2 text-primary-text prose-li:my-2 prose-li:text-secondary-text prose-li:marker:text-secondary-text hover:prose-a:text-green-hover prose-a:duration-200 prose-a:cursor-pointer prose-lg max-lg:prose-base prose-p:text-secondary-text prose-strong:text-inherit max-w-none prose-a:text-green prose-headings::text-primary-text  prose-a:font-normal">
          <div dangerouslySetInnerHTML={sanitizedData()} />
        </div>
      </PostContainer>
    </>
  );
}
