import gql from "graphql-tag";

import { chainToApolloClient } from "@/graphql/thegraph/apollo";
import { DexChainId } from "@/sdk_bi/chains";

import {
  Bar,
  BarsRequest,
  bucketTime,
  ChartPool,
  Datafeed,
  invertBar,
  LiveHandlers,
  parsePoolSymbol,
  Resolution,
  resolutionSeconds,
} from "./types";

const HOURLY = gql`
  query ChartPoolHours($pool: String!, $to: Int!, $first: Int!) {
    rows: poolHourDatas(
      first: $first
      orderBy: periodStartUnix
      orderDirection: desc
      where: { pool: $pool, periodStartUnix_lte: $to }
    ) {
      time: periodStartUnix
      open
      high
      low
      close
      volumeToken0
      volumeToken1
      txCount
    }
  }
`;

const DAILY = gql`
  query ChartPoolDays($pool: String!, $to: Int!, $first: Int!) {
    rows: poolDayDatas(
      first: $first
      orderBy: date
      orderDirection: desc
      where: { pool: $pool, date_lte: $to }
    ) {
      time: date
      open
      high
      low
      close
      volumeToken0
      volumeToken1
      txCount
    }
  }
`;

interface Row {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volumeToken0: string;
  volumeToken1: string;
  txCount: string;
}

const bucket = bucketTime;

/**
 * Pool charts from the exchange subgraph, used when the market API is unreachable.
 *
 * The subgraph keeps hourly and daily OHLC, so 4H and 1W are aggregated here and minute
 * resolutions are unavailable. Its OHLC is `token0Price`, token0 per token1, the inverse
 * of the market API's stored orientation, so bars are flipped to match before the
 * symbol's own inversion is applied. Quiet periods are filled with flat bars, as the
 * API does, so both sources draw the same continuous series.
 */
export class SubgraphDatafeed implements Datafeed {
  readonly kind = "subgraph" as const;
  readonly resolutions: Resolution[] = ["60", "240", "1D", "1W"];
  readonly supportsTrades = false;

  async getBars({ symbol, resolution, to, countback }: BarsRequest): Promise<Bar[]> {
    const parsed = parsePoolSymbol(symbol);
    const client = parsed && chainToApolloClient[parsed.chainId as DexChainId];
    if (!parsed || !client) return [];

    const seconds = resolutionSeconds(resolution);
    const daily = seconds >= 86400;
    const base = daily ? 86400 : 3600;
    const factor = seconds / base;
    const first = Math.min(1000, Math.ceil(countback * factor) + factor);

    const { data } = await client.query<{ rows: Row[] }>({
      query: daily ? DAILY : HOURLY,
      variables: { pool: parsed.pool, to, first },
      fetchPolicy: "network-only",
    });

    const source: Bar[] = [];
    for (const row of [...(data?.rows ?? [])].reverse()) {
      const o = Number(row.open);
      const h = Number(row.high);
      const l = Number(row.low);
      const c = Number(row.close);
      // A bucket opened by the pool's Initialize carries zeros; it has no trades to draw.
      if (![o, h, l, c].every((x) => Number.isFinite(x) && x > 0)) continue;
      const stored = invertBar({
        time: row.time,
        open: o,
        high: h,
        low: l,
        close: c,
        // Before the flip below, "volume" is the quote side in stored terms.
        volume: Number(row.volumeToken1) || 0,
        quote_volume: Number(row.volumeToken0) || 0,
        trades: Number(row.txCount) || 0,
      });
      source.push(parsed.inverted ? invertBar(stored) : stored);
    }

    const bars = aggregate(source, seconds);
    return fill(bars, seconds, to).slice(-countback);
  }

  subscribe(symbol: string, resolution: Resolution, handlers: LiveHandlers) {
    // The subgraph has no push channel; a gentle poll keeps the forming bar current.
    let stopped = false;
    const tick = async () => {
      try {
        const bars = await this.getBars({
          symbol,
          resolution,
          to: Math.floor(Date.now() / 1000),
          countback: 2,
        });
        const last = bars[bars.length - 1];
        if (!stopped && last) handlers.onBar(last);
      } catch {
        // Keep polling; a failed tick only delays the next update.
      }
    };
    const timer = setInterval(tick, 30_000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }
}

function aggregate(bars: Bar[], seconds: number): Bar[] {
  const out: Bar[] = [];
  for (const bar of bars) {
    const t = bucket(bar.time, seconds);
    const last = out[out.length - 1];
    if (last && last.time === t) {
      last.high = Math.max(last.high, bar.high);
      last.low = Math.min(last.low, bar.low);
      last.close = bar.close;
      last.volume += bar.volume;
      last.quote_volume += bar.quote_volume;
      last.trades += bar.trades;
    } else {
      out.push({ ...bar, time: t });
    }
  }
  return out;
}

function fill(bars: Bar[], seconds: number, to: number): Bar[] {
  if (!bars.length) return bars;
  const out: Bar[] = [];
  const end = bucket(to, seconds);
  let i = 0;
  let prev: Bar | null = null;
  for (let t = bars[0].time; t <= end; t += seconds) {
    if (i < bars.length && bars[i].time === t) {
      // Candles join up: an AMM opens a period at the price it closed the last one.
      const bar: Bar = prev
        ? {
            ...bars[i],
            open: prev.close,
            high: Math.max(bars[i].high, prev.close),
            low: Math.min(bars[i].low, prev.close),
          }
        : bars[i];
      out.push(bar);
      prev = bar;
      i++;
    } else if (prev) {
      const p: number = prev.close;
      out.push({
        time: t,
        open: p,
        high: p,
        low: p,
        close: p,
        volume: 0,
        quote_volume: 0,
        trades: 0,
      });
    }
  }
  return out;
}

const PAIR_POOLS = gql`
  query ChartPairPools($token0: String!, $token1: String!) {
    pools(where: { token0: $token0, token1: $token1 }) {
      id
      feeTier
      txCount
    }
  }
`;

/** Pools for a pair from the subgraph, most active first. Addresses are ERC-20 twins. */
export async function fetchPairPoolsFromSubgraph(
  chainId: number,
  tokenA: string,
  tokenB: string,
): Promise<ChartPool[]> {
  const client = chainToApolloClient[chainId as DexChainId];
  if (!client) return [];
  const [token0, token1] = [tokenA.toLowerCase(), tokenB.toLowerCase()].sort();
  const { data } = await client.query<{
    pools: { id: string; feeTier: string; txCount: string }[];
  }>({
    query: PAIR_POOLS,
    variables: { token0, token1 },
    fetchPolicy: "network-only",
  });
  return (data?.pools ?? [])
    .map((p) => ({
      address: p.id.toLowerCase(),
      fee: Number(p.feeTier),
      token0,
      token1,
      tradesTotal: Number(p.txCount),
    }))
    .sort((a, b) => (b.tradesTotal ?? 0) - (a.tradesTotal ?? 0));
}
