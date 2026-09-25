export type DurationUnit = "day" | "hour" | "minute" | "second";

const UNITS: [DurationUnit, number][] = [
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

export const durationMessageKey = {
  day: "duration_day",
  hour: "duration_hour",
  minute: "duration_minute",
  second: "duration_second",
} as const;

function englishUnit(unit: DurationUnit, value: number): string {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

/**
 * Human-readable length of time, e.g. 864000 -> "10 days", 5400 -> "1 hour 30 minutes",
 * 600 -> "10 minutes". Shows the two largest non-zero units so short testnet delays read as
 * naturally as the 10 day mainnet default.
 */
export function formatDuration(
  totalSeconds: number,
  formatUnit: (unit: DurationUnit, value: number) => string = englishUnit,
): string {
  let remaining = Math.max(0, Math.round(totalSeconds));
  const parts: string[] = [];

  for (const [unit, size] of UNITS) {
    const value = Math.floor(remaining / size);
    if (value > 0) {
      parts.push(formatUnit(unit, value));
      remaining -= value * size;
    }
    if (parts.length === 2) break;
  }

  return parts.length ? parts.join(" ") : formatUnit("second", 0);
}
