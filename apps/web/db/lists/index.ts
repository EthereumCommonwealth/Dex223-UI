import { bscTestnetDefaultList } from "@/db/lists/bsc-testnet-default-list";
import { eosDefaultList } from "@/db/lists/eos-default-list";
import { ethereumDefaultList } from "@/db/lists/ethereum-default-list";
import { mainnetDefaultList } from "@/db/lists/mainnet-default-list";
import {
  arbitrumDefaultList,
  avalancheDefaultList,
  baseDefaultList,
  bscDefaultList,
  inkDefaultList,
  lineaDefaultList,
  mantleDefaultList,
  monadDefaultList,
  optimismDefaultList,
  plasmaDefaultList,
  polygonDefaultList,
  sonicDefaultList,
  unichainDefaultList,
} from "@/db/lists/new-chain-default-lists";
import { sepoliaDefaultList } from "@/db/lists/sepolia-default-list";
import { DexChainId } from "@/sdk_bi/chains";

export const defaultLists: Record<DexChainId, any> = {
  [DexChainId.MAINNET]: ethereumDefaultList,
  [DexChainId.SEPOLIA]: sepoliaDefaultList,
  // [DexChainId.CALLISTO]: callistoDefaultList,
  [DexChainId.BSC_TESTNET]: bscTestnetDefaultList,
  [DexChainId.EOS]: eosDefaultList,
  [DexChainId.BASE]: baseDefaultList,
  [DexChainId.BSC]: bscDefaultList,
  [DexChainId.ARBITRUM]: arbitrumDefaultList,
  [DexChainId.POLYGON]: polygonDefaultList,
  [DexChainId.AVALANCHE]: avalancheDefaultList,
  [DexChainId.OPTIMISM]: optimismDefaultList,
  [DexChainId.MONAD]: monadDefaultList,
  [DexChainId.UNICHAIN]: unichainDefaultList,
  [DexChainId.PLASMA]: plasmaDefaultList,
  [DexChainId.SONIC]: sonicDefaultList,
  [DexChainId.LINEA]: lineaDefaultList,
  [DexChainId.INK]: inkDefaultList,
  [DexChainId.MANTLE]: mantleDefaultList,
};
