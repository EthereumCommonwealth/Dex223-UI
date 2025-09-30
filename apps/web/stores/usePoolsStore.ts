import { Address } from "viem";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { PoolState } from "@/hooks/usePools";
import { Pool } from "@/sdk_bi/entities/pool";

interface PoolsStore {
  pools: {
    [key: string]: Pool;
  };
  addPool: (key: string, pool: Pool) => void;
  getPool: (key: string) => Pool | undefined;
  poolUpdates: Map<string, Date>;
}

export const usePoolsStore = create<PoolsStore>((set, get) => ({
  pools: {},
  addPool: (key, pool) =>
    set(() => {
      const newPoolUpdates = new Map(get().poolUpdates);
      newPoolUpdates.set(key, new Date());
      return { poolUpdates: newPoolUpdates, pools: { ...get().pools, [key]: pool } };
    }),
  getPool: (key) => get().pools[key],
  poolUpdates: new Map(),
}));

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

export type PoolRecord = {
  status: PoolState;
  pool?: Pool; // Replace with your actual pool type
  lastUpdated: number; // timestamp (e.g., Date.now())
};
export const usePoolAddresses = create<PoolAddressesStore>((set, get) => ({
  addresses: {},
  addPoolAddress: (key, address) => set({ addresses: { ...get().addresses, [key]: address } }),
}));

interface _PoolsStore {
  pools: Record<string, PoolRecord>;
  addPool: (key: string) => void;
  setStatus: (key: string, status: PoolState, pool?: Pool, error?: string) => void;
  getPool: (key: string) => PoolRecord | undefined;
}

export const _usePoolsStore = create<_PoolsStore>()(
  immer((set, get) => ({
    pools: {} as Record<string, PoolRecord>,

    addPool: (key: string) => {
      set((state) => {
        state.pools[key] = {
          status: PoolState.LOADING,
          lastUpdated: Date.now(),
        };
      });
    },

    setStatus: (key: string, status: PoolState, pool?: Pool) => {
      set((state) => {
        if (!state.pools[key]) {
          state.pools[key] = { status: PoolState.IDLE, lastUpdated: Date.now() };
        }
        state.pools[key].status = status;
        state.pools[key].pool = pool;
        state.pools[key].lastUpdated = Date.now();
      });
    },

    getPool: (key: string) => {
      return get().pools[key];
    },
  })),
);
