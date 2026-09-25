import { useQuery } from "@apollo/client";
import { useMemo } from "react";

import { chainToApolloClient } from "@/graphql/thegraph/apollo";
import { PoolPriceChartQuery } from "@/graphql/thegraph/PoolPriceChartQuery";
import useCurrentChainId from "@/hooks/useCurrentChainId";

export interface PricePoint {
  /** Unix seconds, start of the UTC day. */
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeUSD: number;
}

export type ChartRange = 7 | 30 | 90;

interface RawDayData {
  date: number;
  open: string;
  high: string;
  low: string;
  close: string;
  token0Price: string;
  token1Price: string;
  volumeUSD: string;
}

/**
 * Daily price series for a pool.
 *
 * `inverted` swaps the quote direction: the subgraph stores token0Price, so a user
 * looking at the pair the other way round needs 1/price. Inverting here rather than in
 * the component keeps the chart a pure renderer.
 */
export function usePoolPriceChart({
  poolAddress,
  days = 30,
  inverted = false,
}: {
  poolAddress?: string;
  days?: ChartRange;
  inverted?: boolean;
}) {
  const chainId = useCurrentChainId();

  // The subgraph client is passed explicitly rather than taken from context: this app
  // has no ApolloProvider around the page tree, and relying on one throws
  // "Could not find client in the context" at render. Matches app/[locale]/pools/hooks.ts.
  const apolloClient = chainToApolloClient[chainId];

  const { data, loading, error } = useQuery(PoolPriceChartQuery, {
    variables: { poolId: poolAddress?.toLowerCase(), days },
    skip: !poolAddress || !apolloClient,
    client: apolloClient,
  });

  const series: PricePoint[] = useMemo(() => {
    const rows: RawDayData[] = data?.poolDayDatas ?? [];

    return (
      rows
        .map((row) => {
          const open = Number(row.open);
          const high = Number(row.high);
          const low = Number(row.low);
          const close = Number(row.close);

          // A day with no trades can carry zeroes; inverting those would produce
          // Infinity and blow up the y-scale, so drop them rather than plot a spike.
          if (![open, high, low, close].every((n) => Number.isFinite(n) && n > 0)) {
            return null;
          }

          return {
            date: row.date,
            // High and low swap places when the quote direction flips.
            open: inverted ? 1 / open : open,
            high: inverted ? 1 / low : high,
            low: inverted ? 1 / high : low,
            close: inverted ? 1 / close : close,
            volumeUSD: Number(row.volumeUSD) || 0,
          };
        })
        .filter((p): p is PricePoint => p !== null)
        // The query asks for the most recent days first; the chart draws left to right.
        .sort((a, b) => a.date - b.date)
    );
  }, [data, inverted]);

  const change = useMemo(() => {
    if (series.length < 2) return null;
    const first = series[0].close;
    const last = series[series.length - 1].close;
    if (!first) return null;
    return ((last - first) / first) * 100;
  }, [series]);

  return {
    series,
    latestPrice: series.length ? series[series.length - 1].close : null,
    change,
    isLoading: loading,
    // An empty series is not an error: a pool created today has no completed days yet.
    isEmpty: !loading && !error && series.length === 0,
    error,
  };
}
