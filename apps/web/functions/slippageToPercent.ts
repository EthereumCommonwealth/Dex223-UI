import { Percent } from "@/sdk_bi/entities/fractions/percent";

/**
 * Builds a Percent from a slippage value expressed in percent, e.g. 0.5 for 0.5%.
 *
 * The call sites used `new Percent(slippage * 100, 10000)` directly, which throws for
 * roughly one in nine two-decimal slippage values. Percent passes its numerator to
 * BigInt(), and floating point multiplication does not always land on an integer:
 * 1.1 * 100 is 110.00000000000001, and BigInt() rejects a non-integer outright. 1.1%,
 * 2.2% and 0.55% are all values a user can type into the custom slippage field.
 *
 * Rounding to basis points is exact for every two-decimal input and cannot throw.
 */
export function slippageToPercent(slippage: number): Percent {
  if (!Number.isFinite(slippage) || slippage <= 0) {
    return new Percent(0, 10000);
  }

  // Basis points: 0.5% -> 50 bps out of 10000.
  const basisPoints = Math.round(slippage * 100);
  return new Percent(basisPoints, 10000);
}
