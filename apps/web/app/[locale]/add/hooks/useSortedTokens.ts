import { useMemo } from "react";

import { Currency } from "@/sdk_hybrid/entities/currency";

export const useSortedTokens = ({ tokenA, tokenB }: { tokenA?: Currency; tokenB?: Currency }) => {
  const [token0, token1] = useMemo(
    () =>
      tokenA && tokenB
        ? tokenA.wrapped.sortsBefore(tokenB.wrapped)
          ? [tokenA, tokenB]
          : [tokenB, tokenA]
        : [undefined, undefined],
    [tokenA, tokenB],
  );

  return {
    token0,
    token1,
  };
};
