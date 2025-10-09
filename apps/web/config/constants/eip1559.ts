import { DexChainId } from "@/sdk_bi/chains";

export const eip1559SupportMap: Record<DexChainId, boolean> = {
  [DexChainId.MAINNET]: true,
  [DexChainId.SEPOLIA]: true,
  [DexChainId.BSC_TESTNET]: false,
  [DexChainId.EOS]: false,
  [DexChainId.APE_CHAIN]: true,
};

export function isEip1559Supported(chainId: DexChainId) {
  return eip1559SupportMap[chainId];
}
