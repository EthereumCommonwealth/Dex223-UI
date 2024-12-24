import { create } from "zustand";

import { Currency } from "@/sdk_hybrid/entities/currency";

interface ListTokensStore {
  tokenA: Currency | undefined;
  tokenB: Currency | undefined;
  setTokenA: (token: Currency | undefined) => void;
  setTokenB: (token: Currency | undefined) => void;
  reset: () => void;
}

export const useListTokensStore = create<ListTokensStore>((set, get) => ({
  tokenA: undefined,
  tokenB: undefined,

  setTokenA: (tokenA) => set({ tokenA }),
  setTokenB: (tokenB) => set({ tokenB }),

  reset: () =>
    set({
      tokenA: undefined,
      tokenB: undefined,
    }),
}));
