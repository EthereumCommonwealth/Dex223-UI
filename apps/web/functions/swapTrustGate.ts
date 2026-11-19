/**
 * Review swap trust gate (bounty #142, Figma page 31, "Review swap: trust and contract address").
 *
 * A Lookalike token always needs an acknowledgement before the swap; a Not verified token needs one
 * while NOT_VERIFIED_GATES_SWAP is on. Official, Core listed and native coins never gate. One
 * checkbox covers every flagged token. The confirm button reads "Swap anyway" (red) when any token
 * is a Lookalike or the price impact is very high, the same treatment as the price-impact gate.
 */
import { swapNeedsAcknowledgement, TokenTrust, TrustTokenLike } from "./tokenTrust";

export type SwapSide = "pay" | "receive";

export interface GateToken<O extends TrustTokenLike = TrustTokenLike> {
  side: SwapSide;
  symbol: string;
  trust: Pick<TokenTrust<O>, "reason" | "official" | "match"> | undefined;
}

export interface SwapTrustGate<O extends TrustTokenLike = TrustTokenLike> {
  /** Flagged tokens in card order (You pay, then You receive). */
  flagged: GateToken<O>[];
  required: boolean;
  anyLookalike: boolean;
  /** Symbols named in the checkbox label: the lookalikes if there is one, otherwise all flagged. */
  ackSymbols: string[];
}

export function getSwapTrustGate<O extends TrustTokenLike>(
  tokens: readonly (GateToken<O> | undefined)[],
): SwapTrustGate<O> {
  const flagged = tokens.filter(
    (token): token is GateToken<O> => !!token && swapNeedsAcknowledgement(token.trust),
  );
  const lookalikes = flagged.filter((token) => token.trust?.reason === "lookalike");
  const named = lookalikes.length ? lookalikes : flagged;
  return {
    flagged,
    required: flagged.length > 0,
    anyLookalike: lookalikes.length > 0,
    ackSymbols: Array.from(new Set(named.map((token) => token.symbol))),
  };
}

/** Both gates must be acknowledged when both apply. */
export function canConfirmSwap({
  trustRequired,
  trustAcknowledged,
  priceImpactRequired,
  priceImpactAcknowledged,
}: {
  trustRequired: boolean;
  trustAcknowledged: boolean;
  priceImpactRequired: boolean;
  priceImpactAcknowledged: boolean;
}): boolean {
  return (!trustRequired || trustAcknowledged) && (!priceImpactRequired || priceImpactAcknowledged);
}

/** "Swap anyway" in Danger red when any token is a Lookalike or price impact is very high. */
export function isSwapAnyway(anyLookalike: boolean, veryHighPriceImpact: boolean): boolean {
  return anyLookalike || veryHighPriceImpact;
}
