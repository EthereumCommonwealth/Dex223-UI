import { Address } from "viem";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEX_SUPPORTED_CHAINS, DexChainId } from "@/sdk_hybrid/chains";

interface PinnedTokensStore {
  tokens: Record<DexChainId, Array<Address | "native">>;
  pinToken: (address: Address | "native", chainId: DexChainId) => void;
  unpinToken: (address: Address | "native", chainId: DexChainId) => void;
  toggleToken: (address: Address | "native", chainId: DexChainId) => void;
  getPinnedTokens: (chainId: DexChainId) => Array<Address | "native">;
}

const f = DEX_SUPPORTED_CHAINS.map((chainId) => [chainId, []]);

export const usePinnedTokensStore = create<PinnedTokensStore>()(
  persist(
    (set, get) => ({
      tokens: Object.fromEntries(f),
      pinToken: (address, chainId) => {
        const currentPinned = get().tokens[chainId];
        set({
          tokens: {
            ...get().tokens,
            [chainId]: [address, ...currentPinned],
          },
        });
      },
      toggleToken: (address, chainId) => {
        const currentPinned = get().tokens[chainId] || [];
        if (currentPinned.includes(address)) {
          set({
            tokens: {
              ...get().tokens,
              [chainId]: currentPinned.filter((a) => a !== address),
            },
          });
        } else {
          set({
            tokens: {
              ...get().tokens,
              [chainId]: [...currentPinned, address],
            },
          });
        }
      },
      unpinToken: (address, chainId) => {
        const currentPinned = get().tokens[chainId];
        set({
          tokens: {
            ...get().tokens,
            [chainId]: currentPinned.filter((a) => a !== address),
          },
        });
      },
      getPinnedTokens: (chainId) => get().tokens[chainId],
    }),
    {
      name: "d223-pinned-tokens", // name of the item in the storage (must be unique)
      version: 2,
      migrate: (persistedState: any, version) => {
        const tempState = { ...persistedState.tokens };
        DEX_SUPPORTED_CHAINS.forEach((value) => {
          if (!tempState[value]) {
            tempState[value] = [];
          }
        });
        return { ...persistedState, tokens: tempState };
      },
    },
  ),
);

type PoolAddress = {
  isLoading: boolean;
  address?: Address;
};
export type PoolAddresses = {
  [key: string]: PoolAddress;
};
interface PoolAddressesStore {
  addresses: PoolAddresses;
  addPoolAddress: (key: string, address: PoolAddress) => void;
}

export const usePoolAddresses = create<PoolAddressesStore>((set, get) => ({
  addresses: {},
  addPoolAddress: (key, address) => set({ addresses: { ...get().addresses, [key]: address } }),
}));
