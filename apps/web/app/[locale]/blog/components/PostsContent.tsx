import React, { useMemo } from "react";

import LatestPosts from "@/app/[locale]/blog/components/LatestPosts";
import Posts from "@/app/[locale]/blog/components/Posts";
import { ContentType, Post } from "@/app/[locale]/blog/types/Post";
import Preloader from "@/components/atoms/Preloader";

export default function PostsContent({
  posts,
  contentType,
  searchValue,
  tag,
  isLoading,
  isLoadingMore,
  getMorePosts,
  isAllLoaded,
}: {
  posts: Post[] | undefined;
  contentType: ContentType;
  searchValue: string;
  tag: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  getMorePosts: any;
  isAllLoaded: boolean;
}) {
  const showLatestNews = useMemo(() => {
    return !searchValue && contentType === "vide_and_content" && !tag;
  }, [searchValue, contentType, tag]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Preloader />
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <div className="rounded-5 bg-primary-bg flex flex-col items-center justify-center min-h-[400px] gap-2 bg-empty-article-not-found bg-right-top bg-no-repeat max-md:bg-size-180">
        <span className="text-secondary-text">Article not found</span>
      </div>
    );
  }

  return (
    <>
      {showLatestNews && (
        <>
          <LatestPosts posts={posts.slice(0, 4) as [Post, Post, Post, Post]} />
          <div className="h-px bg-secondary-border mt-6 mb-4 md:mt-10 md:mb-8" />
          <h2 className="text-24 md:text-32 mb-5 ">All news</h2>
        </>
      )}
      <Posts posts={showLatestNews ? posts.slice(4) : posts} />
      {!isAllLoaded && (
        <div className="flex justify-center my-5">
          {!isLoadingMore ? <span id="getMore" /> : <Preloader size={40} />}
        </div>
      )}
    </>
  );
}
