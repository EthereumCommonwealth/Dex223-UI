import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";

import { useAddLiquidityTokensStore } from "@/app/[locale]/add/stores/useAddLiquidityTokensStore";
import { useLiquidityTierStore } from "@/app/[locale]/add/stores/useLiquidityTierStore";
import { useImportToken } from "@/components/manage-tokens/ImportToken";
import { currencyToQueryParam, findCurrencyByQuery } from "@/functions/findCurrencyByQuery";
import { IIFE } from "@/functions/iife";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { usePathname } from "@/i18n/routing";
import { DexChainId } from "@/sdk_bi/chains";
import { FeeAmount } from "@/sdk_bi/constants";

import { useSwapTokens } from "./useTokenLists";

enum PoolsQueryParams {
  tokenA = "tokenA",
  tokenB = "tokenB",
  tier = "tier",
  chainId = "chainId",
}

export const usePoolsSearchParams = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const locale = useLocale();
  const _pathname = usePathname();
  const pathname = `/${locale}${_pathname}`;
  const searchParams = useSearchParams();
  const { tokens, isLoading: arePoolTokensLoading } = useSwapTokens();
  const _chainId = useCurrentChainId();

  const { tokenA, tokenB, setTokenA, setTokenB } = useAddLiquidityTokensStore();
  const { tier, setTier } = useLiquidityTierStore();

  const currentPath = useMemo(() => {
    return searchParams.toString() ? pathname + "?" + searchParams.toString() : pathname;
  }, [searchParams, pathname]);

  const updatedPath = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    const tokenAParam = currencyToQueryParam(tokenA);
    const tokenBParam = currencyToQueryParam(tokenB);
    if (tokenAParam) {
      params.set(PoolsQueryParams.tokenA, tokenAParam);
    } else {
      params.delete(PoolsQueryParams.tokenA);
    }
    if (tokenBParam) {
      params.set(PoolsQueryParams.tokenB, tokenBParam);
    } else {
      params.delete(PoolsQueryParams.tokenB);
    }
    params.set(PoolsQueryParams.tier, tier.toString());

    return pathname + "?" + params.toString();
  }, [pathname, searchParams, tokenA, tokenB, tier]);

  const queryTokenA = useMemo(() => {
    return searchParams.get(PoolsQueryParams.tokenA);
  }, [searchParams]);

  const queryTokenB = useMemo(() => {
    return searchParams.get(PoolsQueryParams.tokenB);
  }, [searchParams]);

  const tokenAFromList = useMemo(() => {
    return findCurrencyByQuery(tokens, queryTokenA);
  }, [queryTokenA, tokens]);

  const tokenBFromList = useMemo(() => {
    return findCurrencyByQuery(tokens, queryTokenB);
  }, [queryTokenB, tokens]);

  const queryChainId = useMemo(() => {
    return searchParams.get(PoolsQueryParams.chainId)
      ? (Number(searchParams.get(PoolsQueryParams.chainId)) as DexChainId)
      : _chainId;
  }, [_chainId, searchParams]);

  const { handleImport } = useImportToken();

  useEffect(() => {
    if (!isInitialized && tokens.length > 1 && !arePoolTokensLoading) {
      IIFE(async () => {
        if (tokenAFromList) {
          setTokenA(tokenAFromList);
        } else {
          if (queryTokenA && isAddress(queryTokenA)) {
            const token = await handleImport(queryTokenA, queryChainId);
            if (token) {
              setTokenA(token);
            }
            // setTokenA(tokenToImportA);
          }
        }

        if (tokenBFromList) {
          setTokenB(tokenBFromList);
        } else {
          if (queryTokenB && isAddress(queryTokenB)) {
            const token = await handleImport(queryTokenB, queryChainId);
            if (token) {
              setTokenB(token);
            }
          }
        }

        const queryTier = parseInt(searchParams.get(PoolsQueryParams.tier) || "");

        if (queryTier && Object.values(FeeAmount).includes(queryTier)) {
          setTier(queryTier as FeeAmount);
        }

        setIsInitialized(true);
      });
    }
  }, [
    searchParams,
    tokens,
    setTokenA,
    setTokenB,
    setTier,
    isInitialized,
    tokenAFromList,
    tokenBFromList,
    queryTokenA,
    handleImport,
    queryChainId,
    queryTokenB,
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
