/**
 * Thin wrapper over gtag.
 *
 * Nothing here may carry a wallet address, a transaction hash, a token amount or a
 * balance. Those identify a user or their position, and once they are in Google
 * Analytics they are effectively permanent and out of our control. Token symbols,
 * chain ids and standards are safe and are what the funnel actually needs.
 */
export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

const FORBIDDEN = /^0x[a-fA-F0-9]{20,}$/;

function isSafe(value: unknown): boolean {
  if (typeof value !== "string") return true;
  return !FORBIDDEN.test(value);
}

export function trackEvent(name: string, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined" || !window.gtag) return;

  const safe: AnalyticsParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    // Defence in depth: a caller that passes an address by mistake drops the value
    // rather than sending it.
    if (!isSafe(value)) continue;
    safe[key] = value;
  }

  window.gtag("event", name, safe);
}
