import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DEX223 Exchange",
    short_name: "DEX223",
    description:
      "The decentralized exchange built for ERC-223 and ERC-20. Swap, provide liquidity, lend, borrow and trade on margin.",
    start_url: "/en/swap",
    scope: "/",
    display: "standalone",
    background_color: "#0F0F0F",
    theme_color: "#0F0F0F",
    categories: ["finance"],
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
