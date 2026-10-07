export type PoolDayData = {
  volumeUSD?: string | number;
  feesUSD?: string | number;
  tvlUSD?: string | number;
  date?: number | string;
};

const DAY_SECONDS = 86400;

const toNumber = (value: string | number | undefined) => {
  const parsed = parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const todayStart = () => Math.floor(Date.now() / 1000 / DAY_SECONDS) * DAY_SECONDS;

/**
 * The most recent day bucket, if it is today's or yesterday's. The subgraph only writes a
 * bucket on days with activity, so a pool idle for a week would otherwise report that
 * week-old day as its "24h" figure.
 */
export function latestDay(poolDayData: PoolDayData[] | undefined): PoolDayData | null {
  if (!Array.isArray(poolDayData)) return null;
  const latest = poolDayData[0];
  if (!latest || Number(latest.date) < todayStart() - DAY_SECONDS) return null;
  return latest;
}

export function volume1d(poolDayData: PoolDayData[] | undefined): number | undefined {
  if (!Array.isArray(poolDayData)) return undefined;
  const latest = latestDay(poolDayData);
  return latest ? toNumber(latest.volumeUSD) : 0;
}

// Sum of the day buckets that fall inside the last 7 calendar days (UTC, the subgraph's
// day boundary). Days without swaps have no bucket, so an empty window is a real $0.
export function volume7d(poolDayData: PoolDayData[] | undefined): number | undefined {
  if (!Array.isArray(poolDayData)) return undefined;
  const windowStart = todayStart() - 6 * DAY_SECONDS;
  let total = 0;
  for (const day of poolDayData.slice(0, 7)) {
    if (Number(day?.date) < windowStart) continue;
    const value = toNumber(day?.volumeUSD);
    if (value === undefined) return undefined;
    total += value;
  }
  return total;
}

/**
 * Latest day's fees annualized over current TVL, in percent. It is what liquidity providers
 * compare across exchanges, and it is backward-looking: one busy day can make it spike.
 */
export function feeApr(
  poolDayData: PoolDayData[] | undefined,
  tvlUSD: number | undefined,
): number | undefined {
  if (!Array.isArray(poolDayData) || !tvlUSD || tvlUSD <= 0) return undefined;
  const latest = latestDay(poolDayData);
  const fees = latest ? toNumber(latest.feesUSD) : 0;
  if (fees === undefined) return undefined;
  return ((fees * 365) / tvlUSD) * 100;
}

/**
 * One TVL point per day for the last 7 days, oldest first. Days without a bucket carry the
 * previous day's TVL forward, since nothing changed the pool on those days.
 */
export function tvlSeries7d(poolDayData: PoolDayData[] | undefined): number[] {
  if (!Array.isArray(poolDayData) || poolDayData.length === 0) return [];
  const byDate = new Map<number, number>();
  for (const day of poolDayData) {
    const value = toNumber(day?.tvlUSD);
    if (value !== undefined) byDate.set(Number(day.date), value);
  }
  const start = todayStart() - 6 * DAY_SECONDS;
  // The TVL going into the window is the newest bucket from before it, if the query has one.
  const before = poolDayData.find((day) => Number(day?.date) < start);
  let last = before ? toNumber(before.tvlUSD) : undefined;
  const series: number[] = [];
  for (let date = start; date <= todayStart(); date += DAY_SECONDS) {
    if (byDate.has(date)) last = byDate.get(date);
    if (last !== undefined) series.push(last);
  }
  return series;
}

export function formatApr(apr: number | undefined): string | undefined {
  if (apr === undefined || !Number.isFinite(apr)) return undefined;
  if (apr > 0 && apr < 0.01) return "<0.01%";
  if (apr >= 10000) return ">9,999%";
  return `${apr.toLocaleString("en-US", { maximumFractionDigits: apr >= 100 ? 0 : apr >= 10 ? 1 : 2 })}%`;
}
