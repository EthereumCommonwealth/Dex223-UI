/**
 * Select token search by trust level (bounty #135, Figma page 31, "Select token: provenance and
 * lookalikes"). No runtime imports, so the node tests can load it directly.
 */
import type { TokenTrust, TrustReason, TrustTokenLike } from "./tokenTrust";

type Rankable = { isNative: boolean; trust?: Pick<TokenTrust, "reason"> };

const reasonRank: Record<TrustReason, number> = {
  official: 0,
  core: 1,
  unverified: 2,
  lookalike: 3,
};

/** Native coins sort with Official tokens; a token with no trust yet sorts with Not verified. */
export function trustRank(token: Rankable): number {
  if (token.isNative) return 0;
  return token.trust ? reasonRank[token.trust.reason] : reasonRank.unverified;
}

/** Official, Core listed, Not verified, Lookalike. Inside a level the current order stays. */
export function sortByTrust<T extends Rankable>(tokens: readonly T[]): T[] {
  return tokens
    .map((token, index) => ({ token, index, rank: trustRank(token) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ token }) => token);
}

/**
 * One entry per official token that has lookalikes among the results. `count` is the official
 * token plus its lookalikes, as in "2 tokens use the name or symbol of the official D223".
 */
export function lookalikeGroups<O extends TrustTokenLike>(
  tokens: readonly { isNative: boolean; trust?: Pick<TokenTrust<O>, "reason" | "official"> }[],
): { official: O; count: number }[] {
  const groups = new Map<string, { official: O; count: number }>();
  tokens.forEach((token) => {
    const official = token.trust?.reason === "lookalike" ? token.trust.official : undefined;
    if (token.isNative || !official) return;
    const key = official.address0.toLowerCase();
    const group = groups.get(key) ?? { official, count: 1 };
    group.count += 1;
    groups.set(key, group);
  });
  return [...groups.values()];
}
