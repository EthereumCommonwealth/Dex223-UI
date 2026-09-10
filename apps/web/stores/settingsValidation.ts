export const DEFAULT_SLIPPAGE = 0.5;
export const DEFAULT_DEADLINE = 20;

// Mirrors the validation in the settings dialogs: slippage above 50% or at zero is
// rejected there, and the deadline is limited to 1-4000 minutes.
const MAX_SLIPPAGE = 50;
const MIN_DEADLINE = 1;
const MAX_DEADLINE = 4000;

/**
 * A persisted value is not trusted input. It survives across sessions and can be edited
 * by hand in devtools, so it is re-checked on read: a corrupted or tampered entry falls
 * back to the default rather than quietly arming a transaction with, say, 99% slippage
 * that the settings dialog would never have accepted.
 */
export function safeSlippage(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_SLIPPAGE) return DEFAULT_SLIPPAGE;
  return n;
}

export function safeDeadline(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < MIN_DEADLINE || n > MAX_DEADLINE) return DEFAULT_DEADLINE;
  return n;
}
