import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAddLiquidityTokensStore } from "@/app/[locale]/add/stores/useAddLiquidityTokensStore";
import { useLiquidityTierStore } from "@/app/[locale]/add/stores/useLiquidityTierStore";
import { currencyToQueryParam, findCurrencyByQuery } from "@/functions/findCurrencyByQuery";
import {
  LinkTokenParam,
  LinkTokenRequest,
  pendingLinkTokens,
  withoutLinkParams,
} from "@/functions/importLink";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { usePathname } from "@/i18n/routing";
import { DexChainId } from "@/sdk_bi/chains";
import { FeeAmount } from "@/sdk_bi/constants";
import { Currency } from "@/sdk_bi/entities/currency";

import { useSwapTokens } from "./useTokenLists";

enum PoolsQueryParams {
  tokenA = "tokenA",
  tokenB = "tokenB",
  tier = "tier",
  chainId = "chainId",
}

/** A link token that can be selected without asking: a native coin, Official or Core listed. */
function isTrustedLinkToken(currency: Currency | undefined): currency is Currency {
  if (!currency) return false;
  if (currency.isNative) return true;
  return currency.trust?.reason === "official" || currency.trust?.reason === "core";
}

/**
 * Reads tokenA, tokenB, tier and chainId from /add links. A link never writes to the token lists on
 * load (#139): a native coin or an Official or Core listed token is selected directly; anything else
 * waits for ImportFromLinkDialog, which only saves from its Import button.
 */
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

  // The link as opened, shown under the token card ("From link: ...") before the URL changes.
  const openedLink = useRef<string>("");
  // Requests waiting for the dialog, tokenA first. The URL sync starts once they are all decided.
  const [linkRequests, setLinkRequests] = useState<LinkTokenRequest[] | null>(null);
  const [linkTotal, setLinkTotal] = useState(0);

  useEffect(() => {
    if (linkRequests !== null || tokens.length <= 1 || arePoolTokensLoading) return;

    openedLink.current = currentPath;
    const queryTier = parseInt(searchParams.get(PoolsQueryParams.tier) || "");
    if (queryTier && Object.values(FeeAmount).includes(queryTier)) {
      setTier(queryTier as FeeAmount);
    }

    if (isTrustedLinkToken(tokenAFromList)) setTokenA(tokenAFromList);
    if (isTrustedLinkToken(tokenBFromList)) setTokenB(tokenBFromList);

    const requests = pendingLinkTokens(
      {
        tokenA: isTrustedLinkToken(tokenAFromList) ? null : queryTokenA,
        tokenB: isTrustedLinkToken(tokenBFromList) ? null : queryTokenB,
      },
      queryChainId,
    );
    setLinkTotal(requests.length);
    setLinkRequests(requests);
  }, [
    arePoolTokensLoading,
    currentPath,
    linkRequests,
    queryChainId,
    queryTokenA,
    queryTokenB,
    searchParams,
    setTier,
    setTokenA,
    setTokenB,
    tokenAFromList,
    tokenBFromList,
    tokens.length,
  ]);

  useEffect(() => {
    if (!isInitialized && linkRequests !== null && linkRequests.length === 0) {
      setIsInitialized(true);
    }
  }, [isInitialized, linkRequests]);

  /** Select a link token (Import, "Use {SYMBOL}" or "Use official {SYMBOL}"). */
  const selectLinkToken = useCallback(
    (param: LinkTokenParam, token: Currency) => {
      if (param === "tokenA") setTokenA(token);
      else setTokenB(token);
    },
    [setTokenA, setTokenB],
  );

  /** Cancel: nothing is saved and the parameter leaves the URL. */
  const removeLinkParam = useCallback((param: LinkTokenParam) => {
    window.history.replaceState(
      null,
      "",
      withoutLinkParams(window.location.pathname + window.location.search, [param]),
    );
  }, []);

  /** The dialog decided the current request; move on to the next one (tokenB after tokenA). */
  const finishLinkRequest = useCallback(() => {
    setLinkRequests((requests) => (requests ? requests.slice(1) : requests));
  }, []);

  useEffect(() => {
    if (isInitialized) {
      if (currentPath !== updatedPath) {
        window.history.replaceState(null, "", updatedPath);
      }
    }
  }, [currentPath, updatedPath, isInitialized]);

  return {
    request: linkRequests?.[0] ?? null,
    index: linkRequests ? linkTotal - linkRequests.length + 1 : 0,
    total: linkTotal,
    openedLink: openedLink.current,
    selectLinkToken,
    removeLinkParam,
    finishLinkRequest,
  };
};
