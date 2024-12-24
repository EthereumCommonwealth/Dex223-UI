import clsx from "clsx";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

import { CategoryTag, YoutubeTag } from "@/app/[locale]/blog/components/PostTag";
import { Post } from "@/app/[locale]/blog/types/Post";
import { Link } from "@/i18n/routing";

export default function LatestPosts({ posts }: { posts: [Post, Post, Post, Post] }) {
  const latestPost = useMemo(() => {
    return posts[0];
  }, [posts]);

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
    }
  }, []);

  return (
    <div>
      <h2 className="text-20 md:text-32 mb-4 md:mb-5">Latest news</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[6fr_4fr] xl:grid-cols-[7fr_4fr] gap-5">
        <Link
          href={`/blog/${latestPost.id}?slug=${latestPost.slug}`}
          className={clsx("flex flex-col cursor-pointer", !isTouchDevice && "group")}
        >
          <div className="w-full flex-grow relative aspect-[16/9] md:aspect-[unset]">
            {!!latestPost.links[0] && <YoutubeTag />}
            {!!latestPost.tags[0] && <CategoryTag tag={latestPost.tags[0]} />}
            <Image
              className="rounded-t-3 md:rounded-t-5 object-cover"
              src={latestPost.thumbnail.link}
              layout="fill"
              priority={true}
              // objectFit="cover"
              alt={latestPost.thumbnail.alt}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 70vw"
            />
          </div>
          <div className="px-5 pt-4 pb-6 flex flex-col gap-1 bg-primary-bg rounded-b-5 group-hocus:bg-tertiary-bg duration-200">
            <h3 className="font-medium md:line-clamp-3 lg:line-clamp-1 text-20 md:text-24 group-hocus:text-green duration-200">
              {latestPost.title}
            </h3>
            <p className="md:line-clamp-5 lg:line-clamp-3 text-secondary-text text-72 max-md:text-14">
              {latestPost.description}
            </p>
          </div>
        </Link>

        <div className="flex flex-col gap-5">
          {posts.slice(1).map((post) => {
            return (
              <Link
                href={`/blog/${post.id}?slug=${post.slug}`}
                key={post.id}
                className={clsx("flex max-md:flex-col cursor-pointer", !isTouchDevice && "group")}
              >
                <div className="md:h-[132px] aspect-[16/9] md:aspect-[1/1] lg:aspect-[16/9] relative flex-shrink-0">
                  {!!post.links[0] && <YoutubeTag />}
                  <Image
                    className="rounded-t-3 md:rounded-tr-0 md:rounded-l-5 object-cover"
                    src={post.thumbnail.link}
                    layout="fill"
                    alt={post.thumbnail.alt}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />{" "}
                </div>
                <div className="px-5 pt-4 pb-6 flex flex-col gap-1 bg-primary-bg rounded-b-3 md:rounded-bl-0 md:rounded-r-5  group-hocus:bg-tertiary-bg duration-200">
                  <h3 className="font-medium md:line-clamp-2 lg:line-clamp-2 group-hocus:text-green duration-200">
                    {post.title}
                  </h3>
                  <p className="line-clamp-2 text-secondary-text text-14">{post.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
