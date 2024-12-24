import { create } from "zustand";

import { Currency } from "@/sdk_hybrid/entities/currency";
import { Pool } from "@/sdk_hybrid/entities/pool";

interface RemoveLiquidityStore {
  percentage: number;
  tokenId?: bigint;
  tokenA?: Currency;
  tokenB?: Currency;
  // position?: Position;
  position?: {
    pool: Pool;
    liquidity: any;
    tickLower: any;
    tickUpper: any;
  };
  //
  setPercentage: (percentage: number) => void;
  setTokenId: (tokenId?: bigint) => void;
  setTokenA: (tokenA?: Currency) => void;
  setTokenB: (tokenB?: Currency) => void;
  setPosition: (position?: any) => void;
  reset: () => void;
}

export const useRemoveLiquidityStore = create<RemoveLiquidityStore>((set, get) => ({
  percentage: 25,

  setPercentage: (percentage) => set({ percentage }),
  setTokenId: (tokenId) => set({ tokenId }),
  setTokenA: (tokenA) => set({ tokenA }),
  setTokenB: (tokenB) => set({ tokenB }),
  setPosition: (position) => set({ position }),
  reset: () =>
    set({
      percentage: 25,
    }),
}));
