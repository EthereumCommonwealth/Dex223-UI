import { useMemo } from "react";
import { Address } from "viem";
import { create } from "zustand";

import { Pool } from "@/sdk_hybrid/entities/pool";
import { Standard } from "@/sdk_hybrid/standard";

interface CollectFeesStore {
  pool?: Pool;
  poolAddress?: Address;
  tokenId?: bigint;
  token0Standard: Standard;
  token1Standard: Standard;
  setPool: (pool?: Pool) => void;
  setPoolAddress: (poolAddress?: Address) => void;
  setTokenId: (tokenId?: bigint) => void;
  setToken0Standard: (standard: Standard) => void;
  setToken1Standard: (standard: Standard) => void;
  reset: () => void;
}

interface RefreshStore {
  refreshKey: number;
  forceRefresh: () => void;
}

export const useRefreshStore = create<RefreshStore>((set) => ({
  refreshKey: 0,
  forceRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));

export const useCollectFeesStore = create<CollectFeesStore>((set, get) => ({
  token0Standard: Standard.ERC20,
  token1Standard: Standard.ERC20,

  setPool: (pool) => set({ pool }),
  setPoolAddress: (poolAddress) => set({ poolAddress }),
  setTokenId: (tokenId) => set({ tokenId }),
  setToken0Standard: (token0Standard) => set({ token0Standard }),
  setToken1Standard: (token1Standard) => set({ token1Standard }),
  reset: () =>
    set({
      token0Standard: Standard.ERC20,
      token1Standard: Standard.ERC20,
    }),
}));

export const useTokensOutCode = () => {
  const { token0Standard, token1Standard } = useCollectFeesStore();
  const tokensOutCode = useMemo(() => {
    // 0 >> both ERC-20
    // 1 >> 0 ERC-20, 1 ERC-223
    // 2 >> 0 ERC-223, 1 ERC-20
    // 3 >> both ERC-223
    if (token0Standard === Standard.ERC20 && token1Standard === Standard.ERC20) return 0;
    if (token0Standard === Standard.ERC20 && token1Standard === Standard.ERC223) return 1;
    if (token0Standard === Standard.ERC223 && token1Standard === Standard.ERC20) return 2;
    if (token0Standard === Standard.ERC223 && token1Standard === Standard.ERC223) return 3;
    return 0;
  }, [token0Standard, token1Standard]);
  return tokensOutCode;
};
