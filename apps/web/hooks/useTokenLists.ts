import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { Address } from "viem";

import { db, TokenList, TokenListId } from "@/db/db";
import { getTokenTrust, TokenTrust } from "@/functions/tokenTrust";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { usePoolTokens } from "@/hooks/usePoolTokens";
import { CORE_AUTO_LISTING_ADDRESS } from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";
import { Currency } from "@/sdk_bi/entities/currency";
import { NativeCoin } from "@/sdk_bi/entities/ether";
import { Token } from "@/sdk_bi/entities/token";

export async function fetchTokenList(url: string) {
  const data = await fetch(url);
  return await data.json();
}

/**
 * Trust level of a token from the user's lists (#140). Pass every list for the chain, enabled or
 * not: only the default list and the current Core autolisting can confirm a token.
 */
export function tokenTrustFromLists(
  token: Token,
  tokenLists: TokenList[],
  chainId: DexChainId,
): TokenTrust<Token> {
  return getTokenTrust<Token, TokenList>(
    token,
    tokenLists,
    chainId,
    CORE_AUTO_LISTING_ADDRESS[chainId],
  );
}

export function useTokenLists(onlyCustom: boolean = false) {
  const chainId = useCurrentChainId();

  const allTokenLists = useLiveQuery(() => {
    return db.tokenLists.where("chainId").equals(chainId).toArray();
  }, [chainId]);

  const customTokenLists = useLiveQuery(() => {
    return db.tokenLists.where("id").equals(`custom-${chainId}`).toArray();
  }, [chainId]);

  const tokenLists = useMemo(() => {
    return onlyCustom ? customTokenLists : allTokenLists;
  }, [allTokenLists, customTokenLists, onlyCustom]);

  return useMemo(() => {
    return tokenLists?.sort((a, b) => {
      const order = (id: TokenListId | undefined) => {
        if (typeof id !== "number" && id?.includes("default")) return 0;
        if (typeof id !== "number" && id?.includes("custom")) return 1;
        if (typeof id === "number") return 2 + id; // Ensure numeric IDs come after "default" and "custom"
        return 3; // Fallback for unexpected values, pushing them to the end
      };

      return order(a.id) - order(b.id);
    });
  }, [tokenLists]);
}

function formatIPFS(logoURI: string | undefined) {
  return logoURI?.startsWith("ipfs://")
    ? logoURI?.replace("ipfs://", "https://ipfs.io/ipfs/")
    : logoURI;
}

const LOGO_PLACEHOLDER = "/images/tokens/placeholder.svg";

function hasRealLogo(logoURI: string | undefined | null): boolean {
  return !!logoURI && logoURI !== LOGO_PLACEHOLDER;
}

/** Real logos from the given lists, keyed by lowercased ERC-20 and ERC-223 address. */
export function logosFromLists(lists: TokenList[]): Map<string, string> {
  const logos = new Map<string, string>();
  lists.forEach((list) =>
    list.list.tokens.forEach((token) => {
      const logo = formatIPFS(token.logoURI);
      if (!hasRealLogo(logo)) return;
      for (const address of [token.address0, token.address1]) {
        const key = address?.toLowerCase();
        if (key && !logos.has(key)) logos.set(key, logo!);
      }
    }),
  );
  return logos;
}

export function useTokens(onlyCustom: boolean = false): Currency[] {
  const tokenLists = useTokenLists(onlyCustom);
  const chainId = useCurrentChainId();

  return useMemo(() => {
    const native = NativeCoin.onChain(chainId);

    if (tokenLists && tokenLists.length >= 1) {
      const inspect = (...arrays: TokenList[]) => {
        const map = new Map<Address, { token: Token; logoSourceId: TokenListId }>();

        const mainListId = `default-${chainId}`; // Assuming the first list is the main one

        const fill = (array: Token[], id: TokenListId) =>
          array.forEach((item) => {
            const lowercaseAddress = item.address0.toLowerCase() as Address;
            const trust = tokenTrustFromLists(item, tokenLists, item.chainId);
            const existing = map.get(lowercaseAddress);

            const isFromMain = id === mainListId;
            // The default list's logo wins; otherwise a real logo beats a missing one. Lists built
            // from on-chain data (Free / Paid Autolisting) carry no images, so without the last rule
            // a token that is also in the user's custom list (with the logo set at Create token)
            // showed the placeholder whenever the autolisting list was read first.
            const shouldOverwriteLogo =
              !existing ||
              (isFromMain && existing.logoSourceId !== mainListId) ||
              (existing.logoSourceId !== mainListId &&
                !hasRealLogo(existing.token.logoURI) &&
                hasRealLogo(item?.logoURI));
            const logoURI = shouldOverwriteLogo
              ? formatIPFS(item?.logoURI) || "/images/tokens/placeholder.svg"
              : formatIPFS(existing?.token.logoURI) || "/images/tokens/placeholder.svg";

            map.set(lowercaseAddress, {
              token: new Token(
                item.chainId,
                item.address0,
                item.address1,
                item.decimals,
                item.symbol || "Unknown",
                item.name || "Unknown",
                logoURI,
                existing ? Array.from(new Set([...(existing.token.lists || []), id])) : [id],
                trust,
              ),
              logoSourceId: shouldOverwriteLogo ? id : existing.logoSourceId,
            });
          });

        arrays.forEach((array) => fill(array.list.tokens, array.id || -1));

        return [...map.values()]
          .map((entry) => entry.token)
          .sort((a, b) => (b.lists?.length || 0) - (a.lists?.length || 0));
      };

      const tokensArrays = tokenLists.filter((list) => list.enabled);
      const fallbackLogos = logosFromLists(tokenLists.filter((list) => !list.enabled));
      // A token whose enabled lists carry no image (the autolisting lists never do) takes the logo
      // from any other list the user has, e.g. the custom list holding the image set at Create
      // token. Logos are cosmetic, so a disabled list may still supply one.
      const _t = inspect(...tokensArrays).map((token) => {
        if (hasRealLogo(token.logoURI)) return token;
        const logo = fallbackLogos.get(token.address0.toLowerCase());
        return logo
          ? new Token(
              token.chainId,
              token.address0,
              token.address1,
              token.decimals,
              token.symbol || "Unknown",
              token.name || "Unknown",
              logo,
              token.lists,
              token.trust,
            )
          : token;
      });

      return onlyCustom ? _t : [native, ..._t];
    }

    const tokens =
      tokenLists
        ?.filter((list) => list.enabled)
        .map((l) => l.list.tokens)
        .flat() || [];

    return onlyCustom ? tokens : [native, ...tokens];
  }, [chainId, onlyCustom, tokenLists]);
}

// Tokens for the swap form: everything from the enabled lists, plus any token that has a pool on
// this chain's factory but is in none of those lists. Without the second part, a pair shown on the
// Pools page (and linked from its Swap button) can be impossible to pick. Pool-only tokens get a
// trust level from the lists like any other token, so they show as Not verified or Lookalike.
export function useSwapTokens(): { tokens: Currency[]; isLoading: boolean } {
  const tokens = useTokens();
  const tokenLists = useTokenLists();
  const { tokens: poolTokens, isLoading } = usePoolTokens();

  const swapTokens = useMemo(() => {
    if (!poolTokens.length) return tokens;

    const known = new Set(
      tokens.filter((t) => t.isToken).map((t) => t.wrapped.address0.toLowerCase()),
    );
    const extra = poolTokens
      .filter((t) => !known.has(t.address0.toLowerCase()))
      .map(
        (t) =>
          new Token(
            t.chainId,
            t.address0,
            t.address1,
            t.decimals,
            t.symbol,
            t.name,
            t.logoURI,
            [],
            tokenTrustFromLists(t, tokenLists || [], t.chainId),
          ),
      );

    return extra.length ? [...tokens, ...extra] : tokens;
  }, [poolTokens, tokenLists, tokens]);

  return { tokens: swapTokens, isLoading };
}

/**
 * Trust level of the given currency, from the same lists as the token picker, so a token never
 * looks trusted in one place and not in another. Native coins have none. Undefined while the lists
 * load.
 */
export function useTokenTrust(
  currency: Currency | undefined | null,
): TokenTrust<Token> | undefined {
  const tokenLists = useTokenLists();
  const chainId = useCurrentChainId();

  return useMemo(() => {
    if (!currency || currency.isNative) return undefined;
    // The lists in the database are the current network's; a token from another network keeps the
    // trust it was given where it was read.
    if (!tokenLists || currency.chainId !== chainId) {
      return currency.trust;
    }
    return tokenTrustFromLists(currency, tokenLists, chainId);
  }, [chainId, currency, tokenLists]);
}
