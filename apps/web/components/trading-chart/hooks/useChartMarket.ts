import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import useCurrentChainId from "@/hooks/useCurrentChainId";
import { Currency } from "@/sdk_bi/entities/currency";

import { fetchPairPools, isMarketApiAvailable, MarketApiDatafeed } from "../datafeed/marketApi";
import { fetchPairPoolsFromSubgraph, SubgraphDatafeed } from "../datafeed/subgraph";
import { ChartPool, Datafeed, PoolStats, poolSymbol } from "../datafeed/types";
import { useChartPreferencesReady, useTradingChartStore } from "../store";

const marketFeed = new MarketApiDatafeed();
const subgraphFeed = new SubgraphDatafeed();

// Assets that read naturally as the quote side of a pair, best first: prices are shown in
// dollars when a stablecoin is present, then in ETH, then in BTC.
const QUOTE_RANK = [
  "USDT",
  "USDC",
  "DAI",
  "USDS",
  "USDE",
  "FDUSD",
  "PYUSD",
  "TUSD",
  "BUSD",
  "EURC",
  "WETH",
  "ETH",
  "WBTC",
  "BTC",
];

function quoteRank(currency: Currency): number {
  const i = QUOTE_RANK.indexOf((currency.symbol ?? "").toUpperCase());
  return i === -1 ? QUOTE_RANK.length : i;
}

export type ChartMarketStatus = "idle" | "loading" | "ready" | "no-pool";

export interface ChartMarket {
  status: ChartMarketStatus;
  chainId: number;
  datafeed: Datafeed | null;
  pools: (ChartPool & { stats?: PoolStats })[];
  pool: (ChartPool & { stats?: PoolStats }) | null;
  symbol: string | null;
  /** The asset being priced, and the asset it is priced in. */
  base: Currency | null;
  quote: Currency | null;
  /** Whether `symbol` reads token0 per token1 (the inverse of the stored orientation). */
  inverted: boolean;
  pairKey: string | null;
  flip: () => void;
  selectFee: (fee: number | null) => void;
  pinnedFee: number | null;
}

/**
 * Resolve the pair a user is trading into one chartable pool and orientation.
 *
 * Pool choice: a fee tier the user pinned, else the pool the current quote routes
 * through, else the most active pool. Orientation: the better quote asset (see
 * QUOTE_RANK) is the quote; with none, the token being bought is priced in the token
 * being sold. A user flip overrides either.
 */
export function useChartMarket({
  tokenA,
  tokenB,
  routedFee,
}: {
  tokenA?: Currency;
  tokenB?: Currency;
  routedFee?: number;
}): ChartMarket {
  const chainId = useCurrentChainId();
  const { flipped, pinnedFee, toggleFlipped, pinFee } = useTradingChartStore();
  const preferencesReady = useChartPreferencesReady();

  const addressA = tokenA?.wrapped.address0.toLowerCase();
  const addressB = tokenB?.wrapped.address0.toLowerCase();
  const samePair = !!addressA && addressA === addressB;
  const pairKey =
    addressA && addressB && !samePair
      ? `${chainId}:${[addressA, addressB].sort().join(":")}`
      : null;

  const { data: apiAvailable } = useQuery({
    queryKey: ["market-api-available", chainId],
    queryFn: () => isMarketApiAvailable(chainId),
    staleTime: 60_000,
  });

  const { data: pools, isLoading } = useQuery({
    queryKey: ["chart-pair-pools", chainId, pairKey, apiAvailable],
    enabled: !!pairKey && apiAvailable !== undefined,
    staleTime: 30_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      if (apiAvailable) {
        const body = await fetchPairPools(chainId, addressA!, addressB!);
        return body.pools.map((p) => ({
          address: p.address,
          fee: p.fee,
          token0: p.token0.address,
          token1: p.token1.address,
          tradesTotal: p.stats.trades_total,
          stats: p.stats,
        }));
      }
      return fetchPairPoolsFromSubgraph(chainId, addressA!, addressB!);
    },
  });

  return useMemo<ChartMarket>(() => {
    const pinned = pairKey ? (pinnedFee[pairKey] ?? null) : null;
    const base: ChartMarket = {
      status: "idle",
      chainId,
      datafeed: apiAvailable ? marketFeed : apiAvailable === false ? subgraphFeed : null,
      pools: pools ?? [],
      pool: null,
      symbol: null,
      base: null,
      quote: null,
      inverted: false,
      pairKey,
      flip: () => {},
      selectFee: (fee) => pairKey && pinFee(pairKey, fee),
      pinnedFee: pinned,
    };
    if (!tokenA || !tokenB || !pairKey) return base;
    if (!preferencesReady || apiAvailable === undefined || isLoading || !pools) {
      return { ...base, status: "loading" };
    }
    if (!pools.length) return { ...base, status: "no-pool" };

    // Most active first; the API already sorts by 24h then all-time trades.
    const pool =
      pools.find((p) => p.fee === pinned) ?? pools.find((p) => p.fee === routedFee) ?? pools[0];

    const rankA = quoteRank(tokenA);
    const rankB = quoteRank(tokenB);
    const [defaultBase, defaultQuote] =
      rankA < rankB ? [tokenB, tokenA] : rankB < rankA ? [tokenA, tokenB] : [tokenB, tokenA];

    const isFlipped = !!flipped[pairKey];
    const [baseToken, quoteToken] = isFlipped
      ? [defaultQuote, defaultBase]
      : [defaultBase, defaultQuote];
    // Stored prices are token1 per token0, i.e. base token0.
    const inverted = baseToken.wrapped.address0.toLowerCase() !== pool.token0.toLowerCase();

    return {
      ...base,
      status: "ready",
      pool,
      symbol: poolSymbol(chainId, pool.address, inverted),
      base: baseToken,
      quote: quoteToken,
      inverted,
      flip: () => toggleFlipped(pairKey, isFlipped),
    };
  }, [
    apiAvailable,
    chainId,
    flipped,
    isLoading,
    pairKey,
    pinFee,
    pinnedFee,
    pools,
    preferencesReady,
    routedFee,
    toggleFlipped,
    tokenA,
    tokenB,
  ]);
}
