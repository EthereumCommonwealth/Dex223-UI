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
  [DexChainId.BASE]: [
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
    "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", // USDT
  ],
  [DexChainId.BSC]: [
    "0x55d398326f99059fF775485246999027B3197955", // USDT
    "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
  ],
  [DexChainId.ARBITRUM]: [
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT0
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC
  ],
  [DexChainId.POLYGON]: [
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT0
    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC
  ],
  [DexChainId.AVALANCHE]: [
    "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", // USDt
    "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
  ],
  [DexChainId.OPTIMISM]: [
    "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // USDT
    "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // USDC
  ],
  [DexChainId.MONAD]: [
    "0xe7cd86e13AC4309349F30B3435a9d337750fC82D", // USDT0
    "0x754704Bc059F8C67012fEd69BC8A327a5aafb603", // USDC
  ],
  [DexChainId.UNICHAIN]: [
    "0x9151434b16b9763660705744891fA906F660EcC5", // USDT0
    "0x078D782b760474a361dDA0AF3839290b0EF57AD6", // USDC
  ],
  [DexChainId.PLASMA]: [
    "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb", // USDT0
  ],
  [DexChainId.SONIC]: [
    "0x29219dd400f2Bf60E5a23d13Be72B486D4038894", // USDC
    "0x6047828dc181963ba44974801FF68e538dA5eaF9", // USDT
  ],
  [DexChainId.LINEA]: [
    "0xA219439258ca9da29E9Cc4cE5596924745e12B93", // USDT
    "0x176211869cA2b568f2A7D4EE941E073a821EE1ff", // USDC
  ],
  [DexChainId.INK]: [
    "0x0200C29006150606B650577BBE7B6248F58470c1", // USDT0
    "0x2D270e6886d130D724215A266106e6832161EAEd", // USDC
  ],
  [DexChainId.MANTLE]: [
    "0x779Ded0c9e1022225f8E0630b35a9b54bE713736", // USDT0
    "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9", // USDC
  ],
};

export function getUSDAnchorTokens(chainId: DexChainId | undefined): Address[] {
  return (chainId && USD_ANCHOR_TOKENS[chainId]) || [];
}
