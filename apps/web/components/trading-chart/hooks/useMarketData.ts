import { useQuery } from "@tanstack/react-query";

import { fetchChainPools, fetchPool, fetchTrades } from "../datafeed/marketApi";
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

// Dollar stablecoins, priced at $1. EURC and other non-USD stables are left out.
const USD_STABLES = new Set([
  "USDT",
  "USDC",
  "DAI",
  "USDS",
  "USDE",
  "FDUSD",
  "PYUSD",
  "TUSD",
  "BUSD",
]);

/**
 * Dollars per one unit of the chart's quote token, or null when unknown.
 *
 * A pair quoted in WETH (D223/WETH) shows its price in ETH, which reads as a wrong price
 * to anyone thinking in dollars. The quote token's USD price comes from its most traded
 * pool against a dollar stablecoin on the same chain, so it tracks the DEX's own market.
 */
export function useQuoteUsdPrice(market: ChartMarket): number | null {
  const symbol = market.quote?.symbol?.toUpperCase();
  const isStable = !!symbol && USD_STABLES.has(symbol);
  const address = market.quote?.wrapped.address0.toLowerCase();

  const { data } = useQuery({
    queryKey: ["chart-quote-usd", market.chainId, address],
    enabled:
      !isStable && !!address && market.status === "ready" && market.datafeed?.kind === "market-api",
    staleTime: 60_000,
    refetchInterval: 60_000,
    queryFn: async ({ signal }): Promise<number | null> => {
      const { pools } = await fetchChainPools(market.chainId, signal);
      let best: { usd: number; trades: number } | null = null;
      for (const pool of pools) {
        // Stored prices are token1 per token0.
        const price = pool.stats?.price;
        if (!price || !Number.isFinite(price)) continue;
        const token0 = pool.token0.address.toLowerCase();
        const token1 = pool.token1.address.toLowerCase();
        let usd: number | null = null;
        if (token0 === address && USD_STABLES.has(pool.token1.symbol.toUpperCase())) usd = price;
        else if (token1 === address && USD_STABLES.has(pool.token0.symbol.toUpperCase()))
          usd = 1 / price;
        if (usd === null) continue;
        const trades = pool.stats.trades_24h ?? 0;
        if (!best || trades > best.trades) best = { usd, trades };
      }
      return best?.usd ?? null;
    },
  });

  if (isStable) return 1;
  return data ?? null;
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
