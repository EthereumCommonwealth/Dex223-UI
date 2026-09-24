"use client";

import debounce from "lodash.debounce";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

import PostsContent from "@/app/[locale]/components/PostsContent";
import { ContentType, Post } from "@/app/[locale]/types/Post";
import Container from "@/components/atoms/Container";
import { SearchInput } from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import ScrollToTopButton from "@/components/buttons/ScrollToTopButton";
import { IIFE } from "@/functions/iife";

const INITAL_LOAD = 10;
const POSTS_LIMIT = 6;

// The first request returns INITAL_LOAD posts and every later page POSTS_LIMIT more.
function loadedPostsCount(page: number) {
  return INITAL_LOAD + (page - 1) * POSTS_LIMIT;
}

function useAllTags() {
  const [tags, setTags] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    IIFE(async () => {
      const tagsRes = await fetch("https://api.dex223.io/v1/core/api/blog/tags/list");

      const _tags = await tagsRes.json();

      if (_tags) {
        const allCategoriesTag = { label: "All Categories", value: "all" };

        setTags([allCategoriesTag, ..._tags.map((_tag: string) => ({ label: _tag, value: _tag }))]);
      }
    });
  }, []);

  return tags;
}

async function getPosts({
  page,
  limit,
  skip,
  search,
  tags,
  contentType,
}: {
  page: number;
  limit: number;
  skip: number;
  search: string;
  tags: string;
  contentType: ContentType;
}) {
  const url = new URL(
    `https://api.dex223.io/v1/core/api/blog/list?lang=en&order_by=-created_at&page=${page}&limit=${limit}&skip=${skip}`,
  );

  if (search) {
    url.searchParams.set("search", search);
  }

  if (tags && tags !== "all") {
    url.searchParams.set("tags", tags);
  }

  if (contentType) {
    url.searchParams.set("content_type", contentType);
  }

  const res = await fetch(url);
  const posts: { data: Post[]; total: number; per_page: number } = await res.json();

  return posts;
}

function useAllPosts({
  searchValue,
  tag,
  contentType,
  setIsLoading,
}: {
  searchValue: string;
  tag: string;
  contentType: ContentType;
  setIsLoading: (isLoading: boolean) => void;
}) {
  const [posts, setPosts] = useState<Post[]>([]);

  const pageRef = useRef(1);
  const isLoadingMoreRef = useRef(false);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [internalSearchValue, setInternalSearchValue] = useState("");
  const [isAllLoaded, setAllLoaded] = useState(false);

  const getMorePosts = useCallback(async () => {
    isLoadingMoreRef.current = true; // ref changes without rerender
    setIsLoadingMore(true); // state changes for UI
    const posts = await getPosts({
      page: pageRef.current + 1,
      limit: POSTS_LIMIT,
      skip: 4,
      search: searchValue,
      contentType,
      tags: tag,
    });
    if (posts.data) {
      setPosts((_posts) => [..._posts, ...posts.data]);
      pageRef.current += 1;

      setAllLoaded(posts.total <= loadedPostsCount(pageRef.current));
    }

    isLoadingMoreRef.current = false;
    setIsLoadingMore(false);
  }, [contentType, searchValue, tag]);

  useEffect(() => {
    function checkAndGetMore() {
      if (isLoadingMoreRef.current) return;
      const element = document.getElementById("getMore");

      if (element) {
        const rect = element.getBoundingClientRect();

        if (
          rect.top >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        ) {
          getMorePosts();
        }
      }
    }

    window.addEventListener("scroll", checkAndGetMore);

    return () => window.removeEventListener("scroll", checkAndGetMore);
  }, [getMorePosts]);

  const getPostsDebounced = useCallback(
    debounce(async (searchValue, contentType, tag) => {
      setIsLoading(true);
      setInternalSearchValue(searchValue);
      try {
        const postsResponse = await getPosts({
          page: 1,
          limit: INITAL_LOAD,
          skip: 0,
          search: searchValue,
          contentType: contentType,
          tags: tag,
        });

        if (postsResponse.data) {
          setPosts(postsResponse.data);
          // A new search or filter starts again from the first page.
          pageRef.current = 1;

          setAllLoaded(postsResponse.total <= loadedPostsCount(pageRef.current));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, 500), // Debounce time of 500ms
    [], // Empty dependency array means this debounced function will stay stable across renders
  );

  useEffect(() => {
    getPostsDebounced(searchValue, contentType, tag);
  }, [searchValue, contentType, tag, getPostsDebounced]);

  return {
    posts,
    latestPosts: posts?.slice(0, 4),
    isAllLoaded,
    isLoadingMore,
    getMorePosts,
    internalSearchValue,
  };
}

const filterMap: Record<ContentType, string> = {
  video: "Video",
  content: "Articles",
  vide_and_content: "Articles and video",
};

const DEFAULT_TAG = "all";
const DEFAULT_CONTENT_TYPE: ContentType = "vide_and_content";

function isContentType(value: string | null): value is ContentType {
  return !!value && value in filterMap;
}

export default function BlogPage() {
  // Filters live in the URL so they survive opening a post and coming back,
  // and a filtered view can be shared.
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(() => searchParams.get("q") ?? "");
  const [tag, setTag] = useState(() => searchParams.get("tag") || DEFAULT_TAG);
  const [contentType, setContentType] = useState<ContentType>(() => {
    const type = searchParams.get("type");
    return isContentType(type) ? type : DEFAULT_CONTENT_TYPE;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setOrDelete = (key: string, value: string, defaultValue: string) => {
      if (value && value !== defaultValue) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    };

    setOrDelete("q", searchValue.trim(), "");
    setOrDelete("tag", tag, DEFAULT_TAG);
    setOrDelete("type", contentType, DEFAULT_CONTENT_TYPE);

    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, [searchValue, tag, contentType]);

  const hasActiveFilters =
    !!searchValue.trim() || tag !== DEFAULT_TAG || contentType !== DEFAULT_CONTENT_TYPE;

  const resetFilters = useCallback(() => {
    setSearchValue("");
    setTag(DEFAULT_TAG);
    setContentType(DEFAULT_CONTENT_TYPE);
  }, []);

  const { getMorePosts, posts, isLoadingMore, internalSearchValue, isAllLoaded } = useAllPosts({
    searchValue,
    tag,
    contentType,
    setIsLoading,
  });

  const tags = useAllTags();

  return (
    <Container className="px-4">
      <div className="flex items-center justify-between pb-6 pt-4 md:py-10 flex-wrap max-lg:flex-col max-lg:items-start gap-2">
        <h1 className="text-24 md:text-40">Blog</h1>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 max-lg:flex-col-reverse max-lg:w-full">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 max-md:grid-cols-1 max-lg:grid-cols-2 max-lg:grid max-lg:w-full">
            <Select
              optionsHeight={380}
              options={Object.keys(filterMap).map((key) => ({
                label: filterMap[key as ContentType],
                value: key,
              }))}
              value={contentType}
              onChange={(contentType) => setContentType(contentType as ContentType)}
              extendWidth
            />

            <Select
              optionsHeight={380}
              options={tags}
              value={tag}
              onChange={(tag) => setTag(tag)}
              extendWidth
            />
          </div>

          <div className="max-lg:w-full lg:w-[386px]">
            <SearchInput
              className="bg-primary-bg rounded-2 md:rounded-3 h-10 md:h-12"
              placeholder="Search article or video"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
              }}
            />
          </div>
        </div>
      </div>

      <PostsContent
        posts={posts}
        contentType={contentType}
        isLoading={isLoading}
        tag={tag}
        searchValue={internalSearchValue}
        getMorePosts={getMorePosts}
        isLoadingMore={isLoadingMore}
        isAllLoaded={isAllLoaded}
        onResetFilters={hasActiveFilters ? resetFilters : undefined}
      />
      <ScrollToTopButton />
    </Container>
  );
}
