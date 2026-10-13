import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useSwapTokensStore } from "@/app/[locale]/swap/stores/useSwapTokensStore";
import { getDefaultStandard } from "@/functions/getDefaultStandard";
import { usePathname } from "@/i18n/routing";

import { useSwapTokens } from "./useTokenLists";

enum SwapQueryParams {
  tokenA = "tokenA",
  tokenB = "tokenB",
}

export const useSwapSearchParams = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const locale = useLocale();
  const _pathname = usePathname();
  const pathname = `/${locale}${_pathname}`;
  const searchParams = useSearchParams();
  const { tokens, isLoading: arePoolTokensLoading } = useSwapTokens();

  const { tokenA, tokenB, setTokenA, setTokenB, setTokenAStandard, setTokenBStandard } =
    useSwapTokensStore();

  const currentPath = useMemo(() => {
    return searchParams.toString() ? pathname + "?" + searchParams.toString() : pathname;
  }, [searchParams, pathname]);

  const updatedPath = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (tokenA?.wrapped.address0) {
      params.set(SwapQueryParams.tokenA, tokenA?.wrapped.address0);
    } else {
      params.delete(SwapQueryParams.tokenA);
    }
    if (tokenB?.wrapped.address0) {
      params.set(SwapQueryParams.tokenB, tokenB.wrapped.address0);
    } else {
      params.delete(SwapQueryParams.tokenB);
    }

    return pathname + "?" + params.toString();
  }, [pathname, searchParams, tokenA, tokenB]);

  useEffect(() => {
    // Wait for pool tokens too, so a pair linked from the Pools page resolves even when a token
    // is in no enabled list.
    if (!isInitialized && tokens.length > 1 && !arePoolTokensLoading) {
      const queryTokenA = searchParams.get(SwapQueryParams.tokenA);
      const queryTokenB = searchParams.get(SwapQueryParams.tokenB);

      if (queryTokenA) {
        const token = tokens.find(
          (t) => t.wrapped.address0.toLowerCase() === queryTokenA.toLowerCase(),
        );
        if (token) {
          setTokenA(token);
          setTokenAStandard(getDefaultStandard(token));
        }
      }
      if (queryTokenB) {
        const token = tokens.find(
          (t) => t.wrapped.address0.toLowerCase() === queryTokenB.toLowerCase(),
        );
        if (token && queryTokenA !== queryTokenB) {
          setTokenB(token);
          setTokenBStandard(getDefaultStandard(token));
        }
      }

      setIsInitialized(true);
    }
  }, [
    searchParams,
    tokens,
    setTokenA,
    setTokenB,
    setTokenAStandard,
    setTokenBStandard,
    isInitialized,
    arePoolTokensLoading,
  ]);
  useEffect(() => {
    if (isInitialized) {
      if (currentPath !== updatedPath) {
        window.history.replaceState(null, "", updatedPath);
      }
    }
  }, [currentPath, updatedPath, isInitialized]);
};
