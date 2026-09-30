const SUBSCRIPT = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];

function subscript(n: number): string {
  return String(n)
    .split("")
    .map((d) => SUBSCRIPT[Number(d)])
    .join("");
}

/**
 * Prices across many orders of magnitude, always with ~5 significant digits.
 *
 * Very small prices use the zero-count notation trading terminals use, so
 * 0.000001234 reads as 0.0₅1234 instead of a run of zeros that is easy to miscount.
 */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e9) return sign + compact(abs);
  if (abs >= 1000) return sign + abs.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (abs >= 1)
    return (
      sign + abs.toLocaleString("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 2 })
    );

  const zeros = Math.floor(-Math.log10(abs));
  const digits = (abs * 10 ** (zeros + 4)).toFixed(0).replace(/0+$/, "") || "0";
  if (zeros >= 4) return `${sign}0.0${subscript(zeros)}${digits}`;
  return (
    sign +
    abs
      .toFixed(zeros + 4)
      .replace(/0+$/, "")
      .replace(/\.$/, "")
  );
}

/**
 * Price-axis labels. Ticks can be much closer together than the ~5 significant digits
 * `formatPrice` keeps (a stable pair moving between 1.0014 and 1.0016), so precision
 * comes from the gap between neighbouring ticks and every label gets the same number
 * of decimals, which keeps them distinct and aligned.
 */
export function formatPriceTicks(prices: number[]): string[] {
  if (prices.length < 2) return prices.map(formatPrice);
  const sorted = [...prices].sort((a, b) => a - b);
  let step = Infinity;
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > 0) step = Math.min(step, gap);
  }
  if (!Number.isFinite(step)) return prices.map(formatPrice);
  const decimals = Math.min(18, Math.max(0, Math.ceil(-Math.log10(step) + 1e-9)));
  const largest = Math.max(...prices.map(Math.abs));

  return prices.map((price) => {
    // Prices are never negative; the scale only dips below zero into the band kept free
    // for the volume bars, where a label would read as a real price.
    if (price < 0) return "";
    const abs = Math.abs(price);
    const sign = price < 0 ? "-" : "";
    if (largest >= 1 || abs === 0) {
      return (
        sign +
        abs.toLocaleString("en-US", {
          minimumFractionDigits: Math.min(decimals, 18),
          maximumFractionDigits: Math.min(decimals, 18),
        })
      );
    }
    const zeros = Math.floor(-Math.log10(abs));
    if (zeros >= 4) {
      const digits = Math.max(1, decimals - zeros);
      const mantissa = (abs * 10 ** (zeros + digits)).toFixed(0);
      return `${sign}0.0${subscript(zeros)}${mantissa}`;
    }
    return sign + abs.toFixed(decimals);
  });
}

export function compact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 2 : 4,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(Math.abs(value) >= 100 ? 0 : 2)}%`;
}

/** The smallest price step worth drawing at this price, for the chart's minMove. */
export function minMoveFor(price: number | null | undefined): number {
  if (!price || !Number.isFinite(price) || price <= 0) return 1e-8;
  const magnitude = Math.floor(Math.log10(price));
  return 10 ** Math.max(-18, magnitude - 5);
}

const timeFormatters = new Map<string, Intl.DateTimeFormat>();

function formatter(key: string, options: Intl.DateTimeFormatOptions) {
  let f = timeFormatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(undefined, options);
    timeFormatters.set(key, f);
  }
  return f;
}

/** Crosshair and legend time, in the viewer's time zone. */
export function formatBarTime(time: number, intraday: boolean): string {
  const date = new Date(time * 1000);
  return intraday
    ? formatter("full", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    : // Daily and weekly bars are UTC days; a local zone would shift them by a day.
      formatter("day", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(
        date,
      );
}

export function formatTradeTime(time: number): string {
  return formatter("clock", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date(time * 1000));
}
