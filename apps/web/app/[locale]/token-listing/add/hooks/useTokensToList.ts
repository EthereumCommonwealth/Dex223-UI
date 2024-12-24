import { useMemo } from "react";

import useAutoListing from "@/app/[locale]/token-listing/add/hooks/useAutoListing";
import { useListTokensStore } from "@/app/[locale]/token-listing/add/stores/useListTokensStore";

export default function useTokensToList() {
  const { autoListing } = useAutoListing();
  const { tokenA, tokenB } = useListTokensStore();

  return useMemo(() => {
    if (!autoListing || !tokenA || !tokenB) {
      return [];
    }

    const isFirstTokenInList = autoListing.tokens.find((l) => {
      return l.address0.toLowerCase() === tokenA?.wrapped.address0.toLowerCase();
    });
    const isSecondTokenInList = autoListing.tokens.find((l) => {
      return l.address0.toLowerCase() === tokenB?.wrapped.address0.toLowerCase();
    });

    if (isFirstTokenInList && isSecondTokenInList) {
      return [];
    }

    if (isFirstTokenInList && !isSecondTokenInList) {
      return [tokenB];
    }

    if (isSecondTokenInList && !isFirstTokenInList) {
      return [tokenA];
    }

    if (!isSecondTokenInList && !isFirstTokenInList) {
      return [tokenA, tokenB];
    }

    return [];
  }, [autoListing, tokenA, tokenB]);
}
