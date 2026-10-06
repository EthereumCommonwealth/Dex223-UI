import { useMemo } from "react";
import { Address } from "viem";
import { useAccount, useReadContracts } from "wagmi";

import { TOKEN_CONVERTER_ABI } from "@/config/abis/tokenConverter";
import { getUSDAnchorTokens } from "@/config/constants/usdAnchors";
import usePositions from "@/hooks/usePositions";
import { CONVERTER_ADDRESS } from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";
import { wrappedTokens } from "@/sdk_bi/entities/weth9";

export type PoolCategory = "all" | "stable" | "eth" | "erc223" | "mine";

// Each token costs one converter call; pools past this keep showing under "All" only.
const MAX_NATIVE_CHECK_TOKENS = 300;

const lower = (value?: string) => value?.toLowerCase() ?? "";

/**
 * Which quick-filter chips apply on this chain, and a predicate for the active one.
 *
 * "ERC-223 native" asks the token converter whether a pool token's ERC-20 address is a
 * wrapper: if it is, the token was born ERC-223 and the ERC-20 side is the converted copy.
 * The subgraph has no field for a token's origin, so this is the only honest source. The
 * reads only run while that chip is selected.
 */
export function usePoolCategories({
  pools,
  chainId,
  category,
}: {
  pools: any[];
  chainId: DexChainId;
  category: PoolCategory;
}) {
  const { address: account } = useAccount();
  const { positions } = usePositions();

  const stableSet = useMemo(
    () => new Set(getUSDAnchorTokens(chainId).map((a) => a.toLowerCase())),
    [chainId],
  );
  const wrappedNative = lower(wrappedTokens[chainId]?.address0);

  const tokenIds = useMemo(() => {
    const ids = new Set<string>();
    for (const pool of pools) {
      ids.add(lower(pool.token0?.id));
      ids.add(lower(pool.token1?.id));
    }
    ids.delete("");
    return Array.from(ids).slice(0, MAX_NATIVE_CHECK_TOKENS);
  }, [pools]);

  const converter = CONVERTER_ADDRESS[chainId];
  const { data: wrapperResults, isLoading: nativeLoading } = useReadContracts({
    contracts: tokenIds.map((id) => ({
      abi: TOKEN_CONVERTER_ABI,
      address: converter,
      functionName: "isWrapper",
      args: [id as Address],
      chainId,
    })),
    query: { enabled: category === "erc223" && !!converter && tokenIds.length > 0 },
  });

  const nativeErc223 = useMemo(() => {
    const set = new Set<string>();
    wrapperResults?.forEach((result, i) => {
      if (result.status === "success" && result.result === true) set.add(tokenIds[i]);
    });
    return set;
  }, [wrapperResults, tokenIds]);

  const myPoolKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const position of positions ?? []) {
      const a = lower(position.token0);
      const b = lower(position.token1);
      const [t0, t1] = a < b ? [a, b] : [b, a];
      keys.add(`${t0}-${t1}-${position.tier}`);
    }
    return keys;
  }, [positions]);

  const available = useMemo(() => {
    const chips: PoolCategory[] = ["all"];
    if (stableSet.size > 0) chips.push("stable");
    if (wrappedNative) chips.push("eth");
    if (converter) chips.push("erc223");
    if (account) chips.push("mine");
    return chips;
  }, [stableSet, wrappedNative, converter, account]);

  const matches = useMemo(() => {
    return (pool: any): boolean => {
      const t0 = lower(pool.token0?.id);
      const t1 = lower(pool.token1?.id);
      switch (category) {
        case "stable":
          return stableSet.has(t0) && stableSet.has(t1);
        case "eth":
          return t0 === wrappedNative || t1 === wrappedNative;
        case "erc223":
          return nativeErc223.has(t0) || nativeErc223.has(t1);
        case "mine": {
          // Positions may name either standard's address, so check both spellings.
          const ids0 = [t0, lower(pool.token0?.addressERC223)];
          const ids1 = [t1, lower(pool.token1?.addressERC223)];
          return ids0.some((a) =>
            ids1.some((b) => {
              const [x, y] = a < b ? [a, b] : [b, a];
              return myPoolKeys.has(`${x}-${y}-${pool.feeTier}`);
            }),
          );
        }
        default:
          return true;
      }
    };
  }, [category, stableSet, wrappedNative, nativeErc223, myPoolKeys]);

  return {
    available,
    matches,
    loading: category === "erc223" && nativeLoading,
  };
}
