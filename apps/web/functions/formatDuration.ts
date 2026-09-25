const UNITS: [label: string, seconds: number][] = [
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

/**
 * Human-readable length of time, e.g. 864000 -> "10 days", 5400 -> "1 hour 30 minutes",
 * 600 -> "10 minutes". Shows the two largest non-zero units so short testnet delays read as
 * naturally as the 10 day mainnet default.
 */
export function formatDuration(totalSeconds: number): string {
  let remaining = Math.max(0, Math.round(totalSeconds));
  const parts: string[] = [];

  for (const [label, size] of UNITS) {
    const value = Math.floor(remaining / size);
    if (value > 0) {
      parts.push(`${value} ${label}${value === 1 ? "" : "s"}`);
      remaining -= value * size;
    }
    if (parts.length === 2) break;
  }

  return parts.length ? parts.join(" ") : "0 seconds";
}
