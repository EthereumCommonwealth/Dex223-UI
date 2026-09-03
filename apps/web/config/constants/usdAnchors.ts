import { Address } from "viem";

import { DexChainId } from "@/sdk_bi/chains";

/**
 * Tokens we are willing to call $1 without asking anyone.
 *
 * Every USD figure the pools pages show is ultimately anchored on one of these: a pool is
 * valued by taking the anchor side at face value and pricing the other side through the
 * pool's own spot price. Adding a token here therefore asserts that it is a dollar
 * stablecoin on that chain, so keep the lists to canonical deployments.
 *
 * The test chains have no stablecoin deployed, so their pools fall back to the subgraph's
 * own totalValueLockedUSD - there is no honest dollar value to compute for test tokens.
 */
export const USD_ANCHOR_TOKENS: Record<DexChainId, Address[]> = {
  [DexChainId.MAINNET]: [
    "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
  ],
  [DexChainId.SEPOLIA]: [],
  [DexChainId.BSC_TESTNET]: [],
  [DexChainId.EOS]: [],
};

export function getUSDAnchorTokens(chainId: DexChainId | undefined): Address[] {
  return (chainId && USD_ANCHOR_TOKENS[chainId]) || [];
}
