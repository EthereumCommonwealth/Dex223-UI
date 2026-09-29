import {
  Bar,
  BarsRequest,
  Datafeed,
  LiveHandlers,
  PoolStats,
  Resolution,
  RESOLUTIONS,
  Trade,
} from "./types";

export const MARKET_API_URL = (
  process.env.NEXT_PUBLIC_MARKET_API_URL || "https://api.dex223.io/v1/market"
).replace(/\/$/, "");

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${MARKET_API_URL}${path}`, { signal });
  if (!response.ok) {
    throw new Error(`Market API ${path} responded ${response.status}`);
  }
  return response.json() as Promise<T>;
}

type HealthChains = { chain_id: number; safe_block: number | null }[];

let health: { at: number; chains: Promise<HealthChains | null> } | null = null;

/**
 * Whether the market API serves `chainId`. The probe is shared by every chart on the page
 * and cached for a minute, so a recovered API is picked up without a reload.
 */
export async function isMarketApiAvailable(chainId: number): Promise<boolean> {
  if (!health || Date.now() - health.at > 60_000) {
    health = {
      at: Date.now(),
      chains: getJson<{ chains: HealthChains }>("/v1/health", AbortSignal.timeout(4000))
        .then((body) => body.chains)
        .catch(() => null),
    };
  }
  const chains = await health.chains;
  return !!chains?.some((c) => c.chain_id === chainId && c.safe_block !== null);
}

export interface ApiPool {
  address: string;
  fee: number;
  token0: { address: string; address_erc223: string | null; symbol: string; decimals: number };
  token1: { address: string; address_erc223: string | null; symbol: string; decimals: number };
  symbol: string;
  inverted: boolean;
  stats: PoolStats;
}

export function fetchPairPools(
  chainId: number,
  tokenA: string,
  tokenB: string,
  signal?: AbortSignal,
) {
  return getJson<{ pools: ApiPool[]; primary: string | null }>(
    `/v1/dex/${chainId}/pairs?tokenA=${tokenA}&tokenB=${tokenB}`,
    signal,
  );
}

export function fetchPool(chainId: number, pool: string, inverted: boolean, signal?: AbortSignal) {
  return getJson<ApiPool>(`/v1/dex/${chainId}/pools/${pool}?inverted=${inverted}`, signal);
}

export function fetchTrades(
  chainId: number,
  pool: string,
  { inverted, origin, limit = 50 }: { inverted: boolean; origin?: string; limit?: number },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ inverted: String(inverted), limit: String(limit) });
  if (origin) params.set("origin", origin.toLowerCase());
  return getJson<{ trades: Trade[] }>(`/v1/dex/${chainId}/pools/${pool}/trades?${params}`, signal);
}

export class MarketApiDatafeed implements Datafeed {
  readonly kind = "market-api" as const;
  readonly resolutions: Resolution[] = RESOLUTIONS.map((r) => r.value);
  readonly supportsTrades = true;

  async getBars({ symbol, resolution, to, countback }: BarsRequest, signal?: AbortSignal) {
    const params = new URLSearchParams({
      symbol,
      resolution,
      to: String(to),
      countback: String(countback),
    });
    const body = await getJson<{ bars: Bar[] }>(`/v1/candles?${params}`, signal);
    return body.bars;
  }

  subscribe(symbol: string, resolution: Resolution, handlers: LiveHandlers) {
    // CoinGecko-only coins have no push feed; their chart refreshes with the page.
    if (typeof EventSource === "undefined" || symbol.startsWith("COINGECKO:")) return () => {};
    const params = new URLSearchParams({ symbol, resolution });
    // EventSource reconnects on its own (the server sends `retry: 3000`), so a dropped
    // connection or a server deploy heals without any code here.
    const source = new EventSource(`${MARKET_API_URL}/v1/stream?${params}`);
    source.addEventListener("bar", (event) => {
      handlers.onBar(JSON.parse((event as MessageEvent).data) as Bar);
    });
    if (handlers.onTrades) {
      source.addEventListener("trades", (event) => {
        handlers.onTrades?.(
          (JSON.parse((event as MessageEvent).data) as { trades: Trade[] }).trades,
        );
      });
    }
    return () => source.close();
  }
}
