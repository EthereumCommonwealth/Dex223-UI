import { Address } from "viem";

/** The staking token cannot be a reward token, in either of its versions. */
export function isStakingToken(token: Address, stake20: Address, stake223: Address): boolean {
  const t = token.toLowerCase();
  return t === stake20.toLowerCase() || t === stake223.toLowerCase();
}
