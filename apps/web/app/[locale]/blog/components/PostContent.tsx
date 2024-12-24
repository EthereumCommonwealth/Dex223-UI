"use client";

import { MDXRemote } from "next-mdx-remote";

export default function PostContent({ mdxSource }: any) {
  return <MDXRemote {...mdxSource} />;
}
