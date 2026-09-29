import { DexChainId } from "@/sdk_bi/chains";

export const eip1559SupportMap: Record<DexChainId, boolean> = {
  [DexChainId.MAINNET]: true,
  [DexChainId.SEPOLIA]: true,
  [DexChainId.BSC_TESTNET]: false,
  [DexChainId.EOS]: false,
  [DexChainId.BASE]: true,
  [DexChainId.BSC]: false,
  [DexChainId.ARBITRUM]: true,
  [DexChainId.POLYGON]: true,
  [DexChainId.AVALANCHE]: true,
  [DexChainId.OPTIMISM]: true,
  [DexChainId.MONAD]: true,
  [DexChainId.UNICHAIN]: true,
  [DexChainId.PLASMA]: true,
  [DexChainId.SONIC]: true,
  [DexChainId.LINEA]: true,
  [DexChainId.INK]: true,
  [DexChainId.MANTLE]: true,
};

export function isEip1559Supported(chainId: DexChainId) {
  return eip1559SupportMap[chainId];
}
