export type Resolution = "1" | "5" | "15" | "60" | "240" | "1D" | "1W";

export const RESOLUTIONS: { value: Resolution; label: string; seconds: number }[] = [
  { value: "1", label: "1m", seconds: 60 },
  { value: "5", label: "5m", seconds: 300 },
  { value: "15", label: "15m", seconds: 900 },
  { value: "60", label: "1H", seconds: 3600 },
  { value: "240", label: "4H", seconds: 14400 },
  { value: "1D", label: "1D", seconds: 86400 },
  { value: "1W", label: "1W", seconds: 604800 },
];

export function resolutionSeconds(resolution: Resolution): number {
  return RESOLUTIONS.find((r) => r.value === resolution)!.seconds;
}

const WEEK = 604800;
// Weeks start on Monday (1970-01-05), as they do on the market API and on Binance.
const WEEK_OFFSET = 4 * 86400;

/** Start of the bar containing `time` at a resolution of `seconds`. */
export function bucketTime(time: number, seconds: number): number {
  if (seconds === WEEK) return Math.floor((time - WEEK_OFFSET) / WEEK) * WEEK + WEEK_OFFSET;
  return Math.floor(time / seconds) * seconds;
}

export interface Bar {
  /** Unix seconds, start of the bar (UTC). */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Base asset volume. */
  volume: number;
  /** Quote asset volume. */
  quote_volume: number;
  trades: number;
}

export interface Trade {
  /** `${block}-${logIndex}`: unique and ordered. */
  id: string;
  tx: string;
  time: number;
  origin: string | null;
  price: number;
  /** Base amount. */
  amount0: number;
  /** Quote amount. */
  amount1: number;
  side: "buy" | "sell";
}

export interface PoolStats {
  price: number | null;
  price_24h_ago: number | null;
  change_24h: number | null;
  high_24h: number | null;
  low_24h: number | null;
  /** Base volume. */
  volume0_24h: number;
  /** Quote volume. */
  volume1_24h: number;
  trades_24h: number;
  trades_total: number;
}

/** One Dex223 pool as the chart needs it, stored orientation (token1 per token0). */
export interface ChartPool {
  address: string;
  fee: number;
  token0: string;
  token1: string;
  tradesTotal: number | null;
}

export interface BarsRequest {
  symbol: string;
  resolution: Resolution;
  /** Bars ending at this time (unix seconds). */
  to: number;
  countback: number;
}

export interface LiveHandlers {
  onBar: (bar: Bar) => void;
  onTrades?: (trades: Trade[]) => void;
}

/**
 * Where chart data comes from. The market API is the full-featured source; the subgraph
 * source keeps pool charts working (hourly and daily only) when the API is unreachable.
 */
export interface Datafeed {
  readonly kind: "market-api" | "subgraph";
  readonly resolutions: Resolution[];
  readonly supportsTrades: boolean;
  getBars(request: BarsRequest, signal?: AbortSignal): Promise<Bar[]>;
  /** Returns an unsubscribe function. */
  subscribe(symbol: string, resolution: Resolution, handlers: LiveHandlers): () => void;
}

/** Dex223 pool symbols, matching the market API: DEX223:<chainId>:<pool>[:I]. */
export function poolSymbol(chainId: number, pool: string, inverted: boolean): string {
  return `DEX223:${chainId}:${pool.toLowerCase()}${inverted ? ":I" : ""}`;
}

export function parsePoolSymbol(
  symbol: string,
): { chainId: number; pool: string; inverted: boolean } | null {
  const [exchange, chain, pool, flag] = symbol.split(":");
  if (exchange !== "DEX223" || !chain || !pool) return null;
  return { chainId: Number(chain), pool: pool.toLowerCase(), inverted: flag === "I" };
}

export function invertBar(bar: Bar): Bar {
  const inv = (x: number) => (x ? 1 / x : 0);
  return {
    time: bar.time,
    open: inv(bar.open),
    high: inv(bar.low),
    low: inv(bar.high),
    close: inv(bar.close),
    volume: bar.quote_volume,
    quote_volume: bar.volume,
    trades: bar.trades,
  };
}
