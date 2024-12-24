"use client";

import clsx from "clsx";
import debounce from "lodash.debounce";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { ContentType, Post } from "@/app/[locale]/blog/types/Post";
import Container from "@/components/atoms/Container";
import { SearchInput } from "@/components/atoms/Input";
import Popover from "@/components/atoms/Popover";
import SelectButton from "@/components/atoms/SelectButton";
import SelectOption from "@/components/atoms/SelectOption";
import { IIFE } from "@/functions/iife";

const contents: ContentType[] = ["video", "vide_and_content", "content"];

import PostsContent from "@/app/[locale]/blog/components/PostsContent";

const INITAL_LOAD = 10;
const POSTS_LIMIT = 6;

function useAllTags() {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    IIFE(async () => {
      const tagsRes = await fetch("https://api.dex223.io/v1/core/api/blog/tags/list");

      const _tags = await tagsRes.json();

      if (_tags) {
        setTags(_tags);
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
    `https://api.dex223.io/v1/core/api/blog/list?lang=en&page=${page}&limit=${limit}&skip=${skip}`,
  );

  if (search) {
    url.searchParams.set("search", search);
  }

  if (tags) {
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

      if (posts.total < INITAL_LOAD + pageRef.current * POSTS_LIMIT) {
        setAllLoaded(true);
      } else {
        setAllLoaded(false);
      }
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

          if (postsResponse.total < INITAL_LOAD + pageRef.current * POSTS_LIMIT) {
            setAllLoaded(true);
          } else {
            setAllLoaded(false);
          }
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

export default function BlogPage() {
  const [searchValue, setSearchValue] = useState("");
  const [tag, setTag] = useState("");
  const [contentType, setContentType] = useState<ContentType>("vide_and_content");
  const [isLoading, setIsLoading] = useState(true);

  const { getMorePosts, posts, isLoadingMore, internalSearchValue, isAllLoaded } = useAllPosts({
    searchValue,
    tag,
    contentType,
    setIsLoading,
  });

  const tags = useAllTags();

  const [isOpened, setIsOpened] = useState(false);
  const [isOpenedContentType, setIsOpenedContentType] = useState(false);

  return (
    <Container className="px-4">
      <div className="flex items-center justify-between pb-6 pt-4 md:py-10 flex-wrap max-lg:flex-col max-lg:items-start gap-2">
        <h1 className="text-24 md:text-40">Blog</h1>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 max-lg:flex-col-reverse max-lg:w-full">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 max-md:grid-cols-1 max-lg:grid-cols-2 max-lg:grid max-lg:w-full">
            <Popover
              placement="bottom"
              isOpened={isOpenedContentType}
              setIsOpened={setIsOpenedContentType}
              trigger={
                <SelectButton
                  onClick={() => setIsOpenedContentType(!isOpenedContentType)}
                  className="flex-shrink-0 h-10 md:h-12 justify-between max-lg:w-full"
                >
                  {filterMap[contentType]}
                </SelectButton>
              }
            >
              <div className="w-full py-1 bg-primary-bg rounded-2 shadow-popover shadow-black/70">
                <ul>
                  {contents.map((content) => {
                    return (
                      <li className="w-full min-w-[200px]" key={content}>
                        <SelectOption
                          onClick={() => {
                            setContentType(content);
                            setIsOpenedContentType(false);
                            setIsLoading(true);
                          }}
                          isActive={contentType === content}
                        >
                          {filterMap[content]}
                        </SelectOption>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Popover>

            <Popover
              placement="bottom"
              isOpened={isOpened}
              setIsOpened={setIsOpened}
              trigger={
                <SelectButton
                  className={clsx("px-3 flex-shrink-0 h-10 md:h-12 max-lg:w-full justify-between")}
                  isOpen={isOpened}
                  onClick={() => setIsOpened(!isOpened)}
                >
                  {!!tag ? tag : "All categories"}
                </SelectButton>
              }
            >
              <div className="w-full py-1 bg-primary-bg rounded-2 shadow-popover shadow-black/70">
                <ul>
                  <li className="min-w-[200px]">
                    <SelectOption
                      onClick={() => {
                        setTag("");
                        setIsOpened(false);
                        setIsLoading(true);
                      }}
                      isActive={tag === ""}
                    >
                      All categories
                    </SelectOption>
                  </li>
                  {tags.map((_tag) => {
                    return (
                      <li className="min-w-[200px]" key={_tag}>
                        <SelectOption
                          onClick={() => {
                            setTag(_tag);
                            setIsOpened(false);
                            setIsLoading(true);
                          }}
                          isActive={tag === _tag}
                        >
                          {_tag}
                        </SelectOption>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Popover>
          </div>

          <div className="max-lg:w-full lg:w-[386px]">
            <SearchInput
              className="bg-primary-bg h-10 md:h-12"
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
      />
    </Container>
  );
}
