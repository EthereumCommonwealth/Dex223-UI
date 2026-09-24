"use client";

import ExternalTextLink from "@repo/ui/external-text-link";
import React from "react";

import Container from "@/components/atoms/Container";

function GuidelineCard({
  title,
  subtitle,
  links,
}: {
  title: string;
  subtitle: string;
  links: { title: string; href: string }[];
}) {
  return (
    <div className="bg-primary-bg py-4 px-5 rounded-5">
      <h2 className="text-24 font-medium mb-1">{title}</h2>
      <p className="text-secondary-text mb-3">{subtitle}</p>

      <div className="flex flex-col gap-4">
        {links.map((link) => {
          return <ExternalTextLink key={link.title} text={link.title} href={link.href} />;
        })}
      </div>
    </div>
  );
}

export default function GuidelinesPage() {
  return null;

  return (
    <>
      <Container>
        <div className="md:py-5 py-4">
          <h1 className="mb-3 text-24 lg:text-40">Guidelines</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <GuidelineCard
            title="Getting started "
            subtitle="Your first steps on the platform"
            links={[
              {
                title: "Leverage your trades",
                href: "#",
              },
              {
                title: "How to open a margin account",
                href: "#",
              },
              {
                title: "Managing risk in margin trading",
                href: "#",
              },
            ]}
          />
          <GuidelineCard
            title="Margin trading "
            subtitle="Leverage your trading power"
            links={[
              {
                title: "Leverage your trades",
                href: "#",
              },
              {
                title: "How to open a margin account",
                href: "#",
              },
              {
                title: "Managing risk in margin trading",
                href: "#",
              },
              {
                title: "Understanding margin calls",
                href: "#",
              },
              {
                title: "Calculating margin requirements",
                href: "#",
              },
            ]}
          />
        </div>
      </Container>
    </>
  );
}
