import { DEX_SUPPORTED_CHAINS, DexChainId } from "@/sdk_bi/chains";

const networkInfo: Record<DexChainId, { name: string; symbol: string; logo: string }> = {
  [DexChainId.MAINNET]: {
    name: "Ethereum",
    symbol: "ETH",
    logo: "/images/chains/ethereum.svg",
  },
  [DexChainId.SEPOLIA]: {
    name: "Sepolia",
    symbol: "SEP",
    logo: "/images/chains/sepolia.svg",
  },
  [DexChainId.BSC_TESTNET]: {
    name: "BSC Testnet",
    symbol: "tBNB",
    logo: "/images/chains/bsc.svg",
  },
  [DexChainId.EOS]: {
    name: "EOS EVM Network",
    symbol: "EOS",
    logo: "/images/chains/eos.svg",
  },
  [DexChainId.BASE]: {
    name: "Base",
    symbol: "ETH",
    logo: "/images/chains/base.svg",
  },
  [DexChainId.BSC]: {
    name: "BNB Chain",
    symbol: "BNB",
    logo: "/images/chains/bsc.svg",
  },
  [DexChainId.ARBITRUM]: {
    name: "Arbitrum",
    symbol: "ETH",
    logo: "/images/chains/arbitrum.svg",
  },
  [DexChainId.POLYGON]: {
    name: "Polygon",
    symbol: "POL",
    logo: "/images/chains/polygon.svg",
  },
  [DexChainId.AVALANCHE]: {
    name: "Avalanche",
    symbol: "AVAX",
    logo: "/images/chains/avalanche.svg",
  },
  [DexChainId.OPTIMISM]: {
    name: "OP Mainnet",
    symbol: "ETH",
    logo: "/images/chains/optimism.svg",
  },
  [DexChainId.MONAD]: {
    name: "Monad",
    symbol: "MON",
    logo: "/images/tokens/placeholder.svg",
  },
  [DexChainId.UNICHAIN]: {
    name: "Unichain",
    symbol: "ETH",
    logo: "/images/tokens/placeholder.svg",
  },
  [DexChainId.PLASMA]: {
    name: "Plasma",
    symbol: "XPL",
    logo: "/images/tokens/placeholder.svg",
  },
  [DexChainId.SONIC]: {
    name: "Sonic",
    symbol: "S",
    logo: "/images/tokens/placeholder.svg",
  },
  [DexChainId.LINEA]: {
    name: "Linea",
    symbol: "ETH",
    logo: "/images/tokens/placeholder.svg",
  },
  [DexChainId.INK]: {
    name: "Ink",
    symbol: "ETH",
    logo: "/images/tokens/placeholder.svg",
  },
  [DexChainId.MANTLE]: {
    name: "Mantle",
    symbol: "MNT",
    logo: "/images/tokens/placeholder.svg",
  },
};

export const networks: Array<{
  chainId: DexChainId;
  name: string;
  symbol: string;
  logo: string;
}> = (
  process.env.NEXT_PUBLIC_ENV === "production" ? [DexChainId.MAINNET] : DEX_SUPPORTED_CHAINS
).map((chainId) => ({ chainId, ...networkInfo[chainId] }));
