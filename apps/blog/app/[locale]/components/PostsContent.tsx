import Preloader from "@repo/ui/preloader";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import LatestPosts from "@/app/[locale]/components/LatestPosts";
import Posts from "@/app/[locale]/components/Posts";
import { ContentType, Post } from "@/app/[locale]/types/Post";

export default function PostsContent({
  posts,
  contentType,
  searchValue,
  tag,
  isLoading,
  isLoadingMore,
  getMorePosts,
  isAllLoaded,
  onResetFilters,
}: {
  posts: Post[] | undefined;
  contentType: ContentType;
  searchValue: string;
  tag: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  getMorePosts: any;
  isAllLoaded: boolean;
  onResetFilters?: () => void;
}) {
  const t = useTranslations("BlogFilters");

  const showLatestNews = useMemo(() => {
    return !searchValue && contentType === "vide_and_content" && tag === "all";
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
        <span className="text-secondary-text">
          {onResetFilters ? t("no_results") : t("no_posts")}
        </span>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-2 inline-flex items-center min-h-11 px-6 rounded-3 border border-green text-primary-text font-medium hocus:bg-green-bg duration-200"
          >
            {t("clear_filters")}
          </button>
        )}
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
