import { Address } from "viem";

/**
 * Mirrors RevenueV1.claim() dividend math for UI estimates.
 * Staking tokens pay zero by design; exclude them before calling.
 */
export function estimateClaimDividends({
  selfBalance,
  userStaked,
  totalStaked,
  lastClaimTs,
  nowTs,
  avgDuration,
}: {
  selfBalance: bigint;
  userStaked: bigint;
  totalStaked: bigint;
  lastClaimTs: bigint;
  nowTs: bigint;
  avgDuration: bigint;
}): { dividends: bigint; periods: bigint; nextPeriodAt: bigint | null } {
  if (avgDuration === 0n || userStaked === 0n || selfBalance === 0n) {
    return { dividends: 0n, periods: 0n, nextPeriodAt: null };
  }

  const inception = lastClaimTs === 0n ? 0n : lastClaimTs;
  if (inception === 0n || nowTs <= inception) {
    return { dividends: 0n, periods: 0n, nextPeriodAt: inception + avgDuration };
  }

  const timeDelta = nowTs - inception;
  const periods = timeDelta / avgDuration;
  const nextPeriodAt = inception + (periods + 1n) * avgDuration;

  if (periods === 0n) {
    return { dividends: 0n, periods: 0n, nextPeriodAt };
  }

  const denominator = totalStaked + userStaked * periods;
  if (denominator === 0n) {
    return { dividends: 0n, periods, nextPeriodAt };
  }

  const dividends = (selfBalance * userStaked * periods) / denominator;
  return { dividends, periods, nextPeriodAt };
}

export function isStakingToken(token: Address, stake20: Address, stake223: Address): boolean {
  const t = token.toLowerCase();
  return t === stake20.toLowerCase() || t === stake223.toLowerCase();
}
