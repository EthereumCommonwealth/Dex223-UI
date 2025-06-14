import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useAddLiquidityTokensStore } from "@/app/[locale]/add/stores/useAddLiquidityTokensStore";
import { useLiquidityTierStore } from "@/app/[locale]/add/stores/useLiquidityTierStore";
import { usePathname } from "@/i18n/routing";
import { FeeAmount } from "@/sdk_bi/constants";

import { useTokens } from "./useTokenLists";

enum PoolsQueryParams {
  tokenA = "tokenA",
  tokenB = "tokenB",
  tier = "tier",
}

export const usePoolsSearchParams = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const locale = useLocale();
  const _pathname = usePathname();
  const pathname = `/${locale}${_pathname}`;
  const searchParams = useSearchParams();
  const tokens = useTokens();

  const { tokenA, tokenB, setTokenA, setTokenB } = useAddLiquidityTokensStore();
  const { tier, setTier } = useLiquidityTierStore();

  const currentPath = useMemo(() => {
    return searchParams.toString() ? pathname + "?" + searchParams.toString() : pathname;
  }, [searchParams, pathname]);

  const updatedPath = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (tokenA?.wrapped.address0) {
      params.set(PoolsQueryParams.tokenA, tokenA.wrapped.address0);
    } else {
      params.delete(PoolsQueryParams.tokenA);
    }
    if (tokenB?.wrapped.address0) {
      params.set(PoolsQueryParams.tokenB, tokenB.wrapped.address0);
    } else {
      params.delete(PoolsQueryParams.tokenB);
    }
    params.set(PoolsQueryParams.tier, tier.toString());

    return pathname + "?" + params.toString();
  }, [pathname, searchParams, tokenA, tokenB, tier]);

  useEffect(() => {
    if (!isInitialized && tokens.length > 1) {
      const queryTokenA = searchParams.get(PoolsQueryParams.tokenA);
      const queryTokenB = searchParams.get(PoolsQueryParams.tokenB);
      const queryTier = parseInt(searchParams.get(PoolsQueryParams.tier) || "");
      if (queryTokenA) {
        const token = tokens.find(
          (t) => t.wrapped.address0.toLowerCase() === queryTokenA.toLowerCase(),
        );
        if (token) {
          setTokenA(token);
        }
      }
      if (queryTokenB) {
        const token = tokens.find(
          (t) => t.wrapped.address0.toLowerCase() === queryTokenB.toLowerCase(),
        );
        if (token) {
          setTokenB(token);
        }
      }
      if (queryTier && Object.values(FeeAmount).includes(queryTier)) {
        setTier(queryTier as FeeAmount);
      }

      setIsInitialized(true);
    }
  }, [searchParams, tokens, setTokenA, setTokenB, setTier, isInitialized]);
  useEffect(() => {
    if (isInitialized) {
      if (currentPath !== updatedPath) {
        window.history.replaceState(null, "", updatedPath);
      }
    }
  }, [currentPath, updatedPath, isInitialized]);
};
