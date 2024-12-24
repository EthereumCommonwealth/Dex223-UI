import { DexChainId } from "@/sdk_hybrid/chains";

export const eip1559SupportMap: Record<DexChainId, boolean> = {
  [DexChainId.SEPOLIA]: true,
  [DexChainId.BSC_TESTNET]: false,
  [DexChainId.EOS]: false,
};

export function isEip1559Supported(chainId: DexChainId) {
  return eip1559SupportMap[chainId];
}
