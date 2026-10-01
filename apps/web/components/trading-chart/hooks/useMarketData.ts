import { useQuery } from "@tanstack/react-query";

import { fetchPool, fetchTrades } from "../datafeed/marketApi";
import { Bar, PoolStats, Trade } from "../datafeed/types";
import { ChartMarket } from "./useChartMarket";

/** 24h figures computed from hourly bars, for the subgraph fallback. */
function statsFromBars(bars: Bar[]): PoolStats {
  const last = bars[bars.length - 1];
  const window = bars.slice(-24);
  const reference = bars.length > 24 ? bars[bars.length - 25].close : null;
  const price = last?.close ?? null;
  return {
    price,
    price_24h_ago: reference,
    change_24h: price && reference ? ((price - reference) / reference) * 100 : null,
    high_24h: window.length ? Math.max(...window.map((b) => b.high)) : null,
    low_24h: window.length ? Math.min(...window.map((b) => b.low)) : null,
    volume0_24h: window.reduce((sum, b) => sum + b.volume, 0),
    volume1_24h: window.reduce((sum, b) => sum + b.quote_volume, 0),
    trades_24h: window.reduce((sum, b) => sum + b.trades, 0),
    trades_total: 0,
  };
}

export function usePairStats(market: ChartMarket) {
  const { datafeed, pool, symbol, inverted, chainId, status } = market;
  return useQuery({
    queryKey: ["chart-pool-stats", chainId, pool?.address, inverted, datafeed?.kind],
    enabled: status === "ready" && !!datafeed && !!pool && !!symbol,
    refetchInterval: 15_000,
    queryFn: async ({ signal }): Promise<PoolStats> => {
      if (datafeed!.kind === "market-api") {
        return (await fetchPool(chainId, pool!.address, inverted, signal)).stats;
      }
      const bars = await datafeed!.getBars(
        { symbol: symbol!, resolution: "60", to: Math.floor(Date.now() / 1000), countback: 25 },
        signal,
      );
      return statsFromBars(bars);
    },
  });
}

/**
 * Recent swaps in the charted pool. With `origin`, only that wallet's swaps; pass an empty
 * string when the viewer's own trades are wanted but no wallet is connected.
 */
export function useMarketTrades(
  market: ChartMarket,
  { origin, limit }: { origin?: string; limit: number },
) {
  const { datafeed, pool, inverted, chainId, status } = market;
  const enabled = status === "ready" && datafeed?.supportsTrades === true && !!pool;
  return useQuery({
    queryKey: ["chart-trades", chainId, pool?.address, inverted, origin?.toLowerCase(), limit],
    enabled: enabled && origin !== "",
    refetchInterval: 30_000,
    queryFn: async ({ signal }): Promise<Trade[]> =>
      (
        await fetchTrades(
          chainId,
          pool!.address,
          { inverted, origin: origin || undefined, limit },
          signal,
        )
      ).trades,
  });
}
