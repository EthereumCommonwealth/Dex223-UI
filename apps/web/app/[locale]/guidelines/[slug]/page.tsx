import fs from "fs/promises";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import path from "path";
import React from "react";

import GuideCta from "@/app/[locale]/guidelines/components/GuideCta";
import { getGuide, isGuideSlug } from "@/app/[locale]/guidelines/guides";
import Container from "@/components/atoms/Container";
import { Link } from "@/i18n/routing";

const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-20 font-medium mt-6 mb-2" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-18 font-medium mt-4 mb-2" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-16 text-secondary-text mb-3 leading-relaxed" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-5 mb-3 text-secondary-text space-y-1" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-5 mb-3 text-secondary-text space-y-2" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-16 leading-relaxed" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="text-primary-text font-medium" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-green hocus:text-green-hover" {...props} />
  ),
};

async function readGuideSource(slug: string): Promise<string> {
  const filePath = path.join(process.cwd(), "content/guidelines", `${slug}.mdx`);
  return fs.readFile(filePath, "utf8");
}

export default async function GuidelineArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isGuideSlug(slug)) {
    notFound();
  }

  const guide = getGuide(slug);
  if (!guide) {
    notFound();
  }

  let source: string;
  try {
    source = await readGuideSource(slug);
  } catch {
    notFound();
  }

  return (
    <Container>
      <div className="md:py-5 py-4 max-w-3xl">
        <Link
          href="/guidelines"
          className="text-14 text-green hocus:text-green-hover duration-200 inline-block mb-4"
        >
          ← Guidelines
        </Link>

        <h1 className="text-24 lg:text-40 mb-2">{guide.title}</h1>
        <p className="text-secondary-text text-14 md:text-16 mb-5">{guide.description}</p>

        <div className="bg-primary-bg rounded-5 px-5 py-5 mb-5">
          <MDXRemote source={source} components={mdxComponents} />
        </div>

        <GuideCta href={guide.ctaHref} label={guide.ctaLabel} action={guide.ctaAction} />
      </div>
    </Container>
  );
}
