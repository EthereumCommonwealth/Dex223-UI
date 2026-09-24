export type OnrampFlow = "buy" | "sell";

export type OnrampAssetId = "d223" | "eth" | "usdc" | "usdt" | "any";

export type OnrampAsset = {
  id: OnrampAssetId;
  symbol: string;
  name: string;
  coinCode?: string;
  network?: string;
  logoURI?: string;
  featured?: boolean;
};

/** Prefill targets for Onramp.money. D223 is listed as coinCode d223 on ERC-223. */
export const BUY_ASSETS: OnrampAsset[] = [
  {
    id: "d223",
    symbol: "D223",
    name: "Dex223",
    coinCode: "d223",
    network: "erc223",
    logoURI: "/images/tokens/DEX.svg",
    featured: true,
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    coinCode: "eth",
    network: "erc20",
    logoURI: "/images/tokens/ETH.svg",
  },
  {
    id: "usdc",
    symbol: "USDC",
    name: "USD Coin",
    coinCode: "usdc",
    network: "erc20",
    logoURI: "/images/tokens/USDC.svg",
  },
  {
    id: "usdt",
    symbol: "USDT",
    name: "Tether",
    coinCode: "usdt",
    network: "erc20",
    logoURI: "/images/tokens/USDT.svg",
  },
  {
    id: "any",
    symbol: "More",
    name: "Other tokens",
  },
];

export const FLOW_TYPE_MAP: Record<OnrampFlow, number> = {
  buy: 1,
  sell: 2,
};

export const ONRAMP_THEME = {
  lightMode: {
    baseColor: "#8089BD",
    inputRadius: "12px",
    buttonRadius: "12px",
  },
  darkMode: {
    baseColor: "#8089BD",
    inputRadius: "12px",
    buttonRadius: "12px",
  },
  default: "darkMode" as const,
};
