import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useSwapTokensStore } from "@/app/[locale]/swap/stores/useSwapTokensStore";
import { currencyToQueryParam, findCurrencyByQuery } from "@/functions/findCurrencyByQuery";
import { getDefaultStandard } from "@/functions/getDefaultStandard";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { usePathname } from "@/i18n/routing";
import { DexChainId } from "@/sdk_bi/chains";
import { Token } from "@/sdk_bi/entities/token";

import { useSwapTokens } from "./useTokenLists";

enum SwapQueryParams {
  tokenA = "tokenA",
  tokenB = "tokenB",
}

// Pair preselected on the swap page when the URL names no tokens, so the trading chart shows right
// away: the chain's native coin against this token. Sepolia USDC is the test v3 token with a live
// WETH pool. It is spelled out here because otherwise it only arrives through the core subgraph,
// which Studio often rate-limits.
const DEFAULT_SWAP_TOKEN_B: Partial<Record<DexChainId, Token>> = {
  [DexChainId.SEPOLIA]: new Token(
    DexChainId.SEPOLIA,
    "0xFC86A38E97F63852B49b61d44Eee4f937251ae1A",
    "0x501bfF357609c160B56861EA4478B6592fB85657",
    6,
    "USDC",
    "USD Coin (test v3)",
    "/images/tokens/USDC.svg",
  ),
};

export const useSwapSearchParams = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const locale = useLocale();
  const _pathname = usePathname();
  const pathname = `/${locale}${_pathname}`;
  const searchParams = useSearchParams();
  const chainId = useCurrentChainId();
  const { tokens, isLoading: arePoolTokensLoading } = useSwapTokens();

  const { tokenA, tokenB, setTokenA, setTokenB, setTokenAStandard, setTokenBStandard } =
    useSwapTokensStore();

  const currentPath = useMemo(() => {
    return searchParams.toString() ? pathname + "?" + searchParams.toString() : pathname;
  }, [searchParams, pathname]);

  const updatedPath = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    const tokenAParam = currencyToQueryParam(tokenA);
    const tokenBParam = currencyToQueryParam(tokenB);
    if (tokenAParam) {
      params.set(SwapQueryParams.tokenA, tokenAParam);
    } else {
      params.delete(SwapQueryParams.tokenA);
    }
    if (tokenBParam) {
      params.set(SwapQueryParams.tokenB, tokenBParam);
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

      const defaultTokenB = DEFAULT_SWAP_TOKEN_B[chainId];
      if (!queryTokenA && !queryTokenB && defaultTokenB) {
        const native = tokens.find((t) => t.isNative);
        const listed = tokens.find((t) => t.isToken && t.equals(defaultTokenB));
        if (native) {
          setTokenA(native);
          setTokenAStandard(getDefaultStandard(native));
          setTokenB(listed || defaultTokenB);
          setTokenBStandard(getDefaultStandard(listed || defaultTokenB));
        }
      }

      if (queryTokenA) {
        const token = findCurrencyByQuery(tokens, queryTokenA);
        if (token) {
          setTokenA(token);
          setTokenAStandard(getDefaultStandard(token));
        }
      }
      if (queryTokenB) {
        const token = findCurrencyByQuery(tokens, queryTokenB);
        if (token && queryTokenA?.toLowerCase() !== queryTokenB.toLowerCase()) {
          setTokenB(token);
          setTokenBStandard(getDefaultStandard(token));
        }
      }

      setIsInitialized(true);
    }
  }, [
    searchParams,
    chainId,
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
