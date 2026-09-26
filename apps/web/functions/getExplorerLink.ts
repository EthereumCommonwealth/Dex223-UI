import { DexChainId } from "@/sdk_bi/chains";

export enum ExplorerLinkType {
  ADDRESS,
  TRANSACTION,
  BLOCK,
  GAS_TRACKER,
  TOKEN,
}

const explorerMap: Record<DexChainId, string> = {
  [DexChainId.MAINNET]: "https://etherscan.io",
  [DexChainId.SEPOLIA]: "https://sepolia.etherscan.io",
  [DexChainId.BSC_TESTNET]: "https://testnet.bscscan.com",
  [DexChainId.EOS]: "https://explorer.evm.eosnetwork.com/",
  [DexChainId.BASE]: "https://basescan.org",
  [DexChainId.BSC]: "https://bscscan.com",
  [DexChainId.ARBITRUM]: "https://arbiscan.io",
  [DexChainId.POLYGON]: "https://polygonscan.com",
  [DexChainId.AVALANCHE]: "https://snowtrace.io",
  [DexChainId.OPTIMISM]: "https://optimistic.etherscan.io",
  [DexChainId.MONAD]: "https://monadscan.com",
  [DexChainId.UNICHAIN]: "https://uniscan.xyz",
  [DexChainId.PLASMA]: "https://plasmascan.to",
  [DexChainId.SONIC]: "https://sonicscan.org",
  [DexChainId.LINEA]: "https://lineascan.build",
  [DexChainId.INK]: "https://explorer.inkonchain.com",
  [DexChainId.MANTLE]: "https://mantlescan.xyz",
};
export default function getExplorerLink(
  type: ExplorerLinkType,
  value: string,
  chainId: DexChainId,
) {
  switch (type) {
    case ExplorerLinkType.ADDRESS:
      return `${explorerMap[chainId]}/address/${value}`;
    case ExplorerLinkType.TRANSACTION:
      return `${explorerMap[chainId]}/tx/${value}`;
    case ExplorerLinkType.BLOCK:
      return `${explorerMap[chainId]}/block/${value}`;
    case ExplorerLinkType.TOKEN:
      return `${explorerMap[chainId]}/token/${value}`;
    case ExplorerLinkType.GAS_TRACKER:
      switch (chainId) {
        case DexChainId.BSC_TESTNET:
        case DexChainId.SEPOLIA:
        case DexChainId.MAINNET:
          return `${explorerMap[chainId]}/gastracker`;
        case DexChainId.EOS:
          return `${explorerMap[chainId]}`;
        default:
          return `${explorerMap[chainId]}`;
      }

    default:
      return `${explorerMap[chainId]}`;
  }
}
