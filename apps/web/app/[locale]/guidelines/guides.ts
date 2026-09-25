import { IconName } from "@/config/types/IconName";

// Guide text lives in messages under Guidelines.guides.<slug>, so every guide is translatable.
export type GuideSlug = "swap" | "converter" | "token-lists" | "token-listing" | "fiat";

export type GuideMeta = {
  slug: GuideSlug;
  icon: IconName;
  ctaHref: string;
  ctaAction?: "token-lists";
};

export const GUIDES: GuideMeta[] = [
  { slug: "swap", icon: "swap", ctaHref: "/swap" },
  { slug: "converter", icon: "convert", ctaHref: "/converter" },
  { slug: "token-lists", icon: "list", ctaHref: "#", ctaAction: "token-lists" },
  { slug: "token-listing", icon: "list-tokens", ctaHref: "/token-listing" },
  { slug: "fiat", icon: "fiat", ctaHref: "/buy-crypto" },
];

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);

export function getGuide(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function isGuideSlug(value: string): value is GuideSlug {
  return (GUIDE_SLUGS as string[]).includes(value);
}
