import { create } from "zustand";

import { Currency } from "@/sdk_hybrid/entities/currency";

interface AddLiquidityTokensStore {
  tokenA: Currency | undefined;
  tokenB: Currency | undefined;
  setTokenA: (token: Currency | undefined) => void;
  setTokenB: (token: Currency | undefined) => void;
  setBothTokens: ({
    tokenA,
    tokenB,
  }: {
    tokenA: Currency | undefined;
    tokenB: Currency | undefined;
  }) => void;
}

export const useAddLiquidityTokensStore = create<AddLiquidityTokensStore>((set, get) => ({
  tokenA: undefined,
  tokenB: undefined,

  setTokenA: (token) =>
    set((state) => {
      const newToken = state.tokenB && token?.equals(state.tokenB) ? undefined : token;
      // const newPath = `/en/add/${newToken?.address0}/${state.tokenB?.address0}`;
      // window.history.replaceState(null, "", newPath);
      return {
        tokenA: newToken,
      };
    }),
  setTokenB: (token) =>
    set((state) => {
      const newToken = state.tokenA && token?.equals(state.tokenA) ? undefined : token;
      // const newPath = `/en/add/${state.tokenA?.address}/${newToken?.address}`;
      // window.history.replaceState(null, "", newPath);
      return {
        tokenB: newToken,
      };
    }),
  setBothTokens: ({ tokenA, tokenB }) =>
    set(() => {
      const newTokenB = tokenA && tokenB?.equals(tokenA) ? undefined : tokenB;
      // const newPath = `/en/add/${tokenA?.address}/${newTokenB?.address}`;
      // window.history.replaceState(null, "", newPath);
      return {
        tokenA,
        tokenB: newTokenB,
      };
    }),
}));
