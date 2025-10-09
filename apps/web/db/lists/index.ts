import { apeDefaultList } from "@/db/lists/ape-default-list";
import { bscTestnetDefaultList } from "@/db/lists/bsc-testnet-default-list";
import { eosDefaultList } from "@/db/lists/eos-default-list";
import { ethereumDefaultList } from "@/db/lists/ethereum-default-list";
import { sepoliaDefaultList } from "@/db/lists/sepolia-default-list";
import { DexChainId } from "@/sdk_bi/chains";

export const defaultLists: Record<DexChainId, any> = {
  [DexChainId.MAINNET]: ethereumDefaultList,
  [DexChainId.SEPOLIA]: sepoliaDefaultList,
  [DexChainId.BSC_TESTNET]: bscTestnetDefaultList,
  [DexChainId.EOS]: eosDefaultList,
  [DexChainId.APE_CHAIN]: apeDefaultList,
};
