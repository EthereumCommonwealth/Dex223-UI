export type GuideMeta = {
  slug: string;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  ctaAction?: "token-lists";
};

export const GUIDES: GuideMeta[] = [
  {
    slug: "swap",
    title: "How to swap",
    description: "Trade tokens on Dex223 in a few steps.",
    ctaHref: "/swap",
    ctaLabel: "Open Swap",
  },
  {
    slug: "converter",
    title: "Convert ERC-20 and ERC-223",
    description: "Move any supported token between standards at a 1:1 rate.",
    ctaHref: "/converter",
    ctaLabel: "Open Converter",
  },
  {
    slug: "token-lists",
    title: "Manage token lists",
    description: "Enable, import, and organize the lists that power the token picker.",
    ctaHref: "#",
    ctaLabel: "Open Token lists",
    ctaAction: "token-lists",
  },
  {
    slug: "token-listing",
    title: "List a token",
    description: "Submit a token to an autolisting contract so it can trade on Dex223.",
    ctaHref: "/token-listing",
    ctaLabel: "Open Token listing",
  },
  {
    slug: "fiat",
    title: "Buy crypto with fiat",
    description: "Fund your wallet through Onramp without leaving Dex223.",
    ctaHref: "/buy-crypto",
    ctaLabel: "Open Fiat",
  },
];

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);

export function getGuide(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function isGuideSlug(value: string): boolean {
  return GUIDE_SLUGS.includes(value);
}
