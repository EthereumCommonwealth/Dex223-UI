export enum DexChainId {
  MAINNET = 1,
  SEPOLIA = 11155111,
  BSC_TESTNET = 97,
  EOS = 17777,
  BASE = 8453,
  BSC = 56,
  ARBITRUM = 42161,
  POLYGON = 137,
  AVALANCHE = 43114,
  OPTIMISM = 10,
  MONAD = 143,
  UNICHAIN = 130,
  PLASMA = 9745,
  SONIC = 146,
  LINEA = 59144,
  INK = 57073,
  MANTLE = 5000,
}

/**
 * Chains the app offers and accepts. Every DexChainId has addresses and config, but a chain belongs
 * here only once its Dex223 contracts are deployed and its subgraph is live. Production shows only
 * the chains listed in config/networks and config/wagmi, whatever this list says.
 */
export const DEX_SUPPORTED_CHAINS: DexChainId[] = [
  DexChainId.MAINNET,
  DexChainId.SEPOLIA,
  DexChainId.BSC_TESTNET,
  DexChainId.EOS,
];
