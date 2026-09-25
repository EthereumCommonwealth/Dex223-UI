import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";

import { useAutoListingContractStore } from "@/app/[locale]/token-listing/add/stores/useAutoListingContractStore";
import { useListTokensStore } from "@/app/[locale]/token-listing/add/stores/useListTokensStore";
import { useImportToken } from "@/components/manage-tokens/ImportToken";
import { IIFE } from "@/functions/iife";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useTokens } from "@/hooks/useTokenLists";
import { usePathname } from "@/i18n/routing";
import { DexChainId } from "@/sdk_bi/chains";

enum AutoListingQueryParams {
  autoListingContract = "autoListingContract",
  tokenA = "tokenA",
  tokenB = "tokenB",
  chainId = "chainId",
}

export const useAutoListingSearchParams = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const locale = useLocale();
  const _pathname = usePathname();
  const pathname = `/${locale}${_pathname}`;
  const searchParams = useSearchParams();
  const tokens = useTokens();
  const _chainId = useCurrentChainId();

  const { autoListingContract, setAutoListingContract } = useAutoListingContractStore();
  const { tokenA, tokenB, setTokenA, setTokenB } = useListTokensStore();
  const { handleImport } = useImportToken();

  const currentPath = useMemo(() => {
    return searchParams.toString() ? pathname + "?" + searchParams.toString() : pathname;
  }, [searchParams, pathname]);

  const updatedPath = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (autoListingContract) {
      params.set(AutoListingQueryParams.autoListingContract, autoListingContract);
    } else {
      params.delete(AutoListingQueryParams.autoListingContract);
    }
    if (tokenA?.wrapped.address0) {
      params.set(AutoListingQueryParams.tokenA, tokenA.wrapped.address0);
    } else {
      params.delete(AutoListingQueryParams.tokenA);
    }
    if (tokenB?.wrapped.address0) {
      params.set(AutoListingQueryParams.tokenB, tokenB.wrapped.address0);
    } else {
      params.delete(AutoListingQueryParams.tokenB);
    }

    return pathname + "?" + params.toString();
  }, [autoListingContract, pathname, searchParams, tokenA, tokenB]);

  const queryTokenA = useMemo(() => {
    return searchParams.get(AutoListingQueryParams.tokenA);
  }, [searchParams]);

  const queryTokenB = useMemo(() => {
    return searchParams.get(AutoListingQueryParams.tokenB);
  }, [searchParams]);

  const tokenAFromList = useMemo(() => {
    if (queryTokenA && isAddress(queryTokenA)) {
      const lower = queryTokenA.toLowerCase();
      return tokens.find(
        (t) =>
          t.wrapped.address0.toLowerCase() === lower || t.wrapped.address1.toLowerCase() === lower,
      );
    }
  }, [queryTokenA, tokens]);

  const tokenBFromList = useMemo(() => {
    if (queryTokenB && isAddress(queryTokenB)) {
      const lower = queryTokenB.toLowerCase();
      return tokens.find(
        (t) =>
          t.wrapped.address0.toLowerCase() === lower || t.wrapped.address1.toLowerCase() === lower,
      );
    }
  }, [queryTokenB, tokens]);

  const queryChainId = useMemo(() => {
    return searchParams.get(AutoListingQueryParams.chainId)
      ? (Number(searchParams.get(AutoListingQueryParams.chainId)) as DexChainId)
      : _chainId;
  }, [_chainId, searchParams]);

  useEffect(() => {
    if (!isInitialized && tokens.length > 1) {
      IIFE(async () => {
        const queryAutoListingContract = searchParams.get(
          AutoListingQueryParams.autoListingContract,
        );

        if (queryAutoListingContract && isAddress(queryAutoListingContract)) {
          setAutoListingContract(queryAutoListingContract);
        }

        if (tokenAFromList) {
          setTokenA(tokenAFromList);
        } else if (queryTokenA && isAddress(queryTokenA)) {
          const token = await handleImport(queryTokenA, queryChainId);
          if (token) {
            setTokenA(token);
          }
        }

        if (tokenBFromList) {
          setTokenB(tokenBFromList);
        } else if (queryTokenB && isAddress(queryTokenB) && queryTokenB !== queryTokenA) {
          const token = await handleImport(queryTokenB, queryChainId);
          if (token) {
            setTokenB(token);
          }
        }

        setIsInitialized(true);
      });
    }
  }, [
    searchParams,
    tokens,
    isInitialized,
    setAutoListingContract,
    tokenAFromList,
    tokenBFromList,
    queryTokenA,
    queryTokenB,
    handleImport,
    queryChainId,
    setTokenA,
    setTokenB,
  ]);

  useEffect(() => {
    if (isInitialized) {
      if (currentPath !== updatedPath) {
        window.history.replaceState(null, "", updatedPath);
      }
    }
  }, [currentPath, updatedPath, isInitialized]);
};
