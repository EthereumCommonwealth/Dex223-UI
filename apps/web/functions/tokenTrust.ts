/**
 * Token trust levels (bounty #140, Figma page "31 Token trust and safety").
 *
 * Only two sources can confirm a token: the DEX223 default list and the current DEX223 Core
 * autolisting (a paid listing). Free autolisting, the custom list, lists the user imports, other or
 * retired autolisting contracts and pool-only tokens never raise trust and never lower it: anyone
 * can write to them. The old numeric score counted those lists as independent corroboration, so a
 * token listed in both autolisting contracts scored "High trust".
 *
 * Rules, evaluated in order (the first match wins):
 *   1. In the default list                                   -> Official     (high)
 *   2. Same name or symbol as a default-list token (norm())  -> Lookalike    (low)
 *   3. On the current Core autolisting                       -> Core listed  (high)
 *   4. Otherwise                                             -> Not verified (medium)
 *
 * This module has no runtime imports so the node tests can load it directly.
 */

/**
 * Whether a token found only on Core autolisting shows as High (green). A paid listing is not a
 * review, so this may become its own neutral level later (open question for Randall). When false,
 * Core listed tokens show as Medium (orange) but keep the "Core listed" label and never gate a swap.
 */
export const CORE_LISTED_IS_HIGH = true;

/**
 * Whether a Not verified token gates the Review swap confirm behind the "I checked the contract
 * address" checkbox. A Lookalike always gates.
 */
export const NOT_VERIFIED_GATES_SWAP = true;

export type TrustLevel = "high" | "medium" | "low";
export type TrustReason = "official" | "core" | "unverified" | "lookalike";
export type TrustListId = string | number | undefined;

/** What a lookalike copies from the official token. */
export type LookalikeMatch = "name_and_symbol" | "name" | "symbol";

export interface TrustTokenLike {
  address0: string;
  address1: string;
  name?: string;
  symbol?: string;
}

export interface TrustListLike<T extends TrustTokenLike = TrustTokenLike> {
  id?: TrustListId;
  autoListingContract?: string;
  list: { tokens: readonly T[] };
}

export interface TokenTrust<T extends TrustTokenLike = TrustTokenLike> {
  level: TrustLevel;
  reason: TrustReason;
  /** For a lookalike: the default-list token whose name or symbol it uses. */
  official?: T;
  /** For a lookalike: whether it copies the name, the symbol or both. */
  match?: LookalikeMatch;
  /** Whether the current Core autolisting holds the token (a lookalike can be paid for too). */
  onCoreList: boolean;
  /**
   * The other lists that hold the token. They are shown for information only and never change
   * trust. For Official and Core listed this leaves out the list that confirmed the token.
   */
  alsoIn: TrustListId[];
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Characters a font draws as nothing: zero width space and joiners, word joiner, soft hyphen, BOM,
 * bidi controls, variation selectors, Hangul fillers, tag characters (Unicode
 * Default_Ignorable_Code_Point). "USDT" followed by U+200B is drawn as "USDT", so it must compare as
 * "USDT" (bounty #168, #169).
 */
const INVISIBLE = /\p{Default_Ignorable_Code_Point}/gu;

/**
 * Compare names and symbols: Unicode NFKC, invisible characters removed, trimmed, inner spaces
 * collapsed, lowercase. Letters of other scripts that look Latin (Cyrillic "Т", Greek "Τ") are not
 * folded here; that needs the Unicode confusables table.
 */
export function normalizeTokenText(value: string | null | undefined): string {
  if (!value) return "";
  // NFKC first: it maps some characters (halfwidth Hangul filler U+FFA0) to invisible ones.
  return value.normalize("NFKC").replace(INVISIBLE, "").trim().replace(/\s+/g, " ").toLowerCase();
}

function addressKeys(token: TrustTokenLike): string[] {
  return [token.address0, token.address1]
    .filter((address): address is string => typeof address === "string" && address.length > 0)
    .map((address) => address.toLowerCase())
    .filter((address) => address !== ZERO_ADDRESS);
}

/** A token is in a list when its ERC-20 or ERC-223 address equals either address of an entry. */
export function isSameToken(a: TrustTokenLike, b: TrustTokenLike): boolean {
  const keys = addressKeys(a);
  return addressKeys(b).some((address) => keys.includes(address));
}

export function findInList<T extends TrustTokenLike>(
  list: TrustListLike<T> | undefined,
  token: TrustTokenLike,
): T | undefined {
  return list?.list.tokens.find((entry) => isSameToken(entry, token));
}

export function defaultListId(chainId: number): string {
  return `default-${chainId}`;
}

export function coreListId(chainId: number): string {
  return `core-autolisting-${chainId}`;
}

export function freeListId(chainId: number): string {
  return `free-autolisting-${chainId}`;
}

/**
 * The current Core autolisting list. A list stored under the Core id but synced from another
 * contract (an old browser database that still holds a retired Core deployment) does not count.
 */
export function findCoreList<L extends TrustListLike>(
  lists: readonly L[],
  chainId: number,
  coreAutoListingAddress: string | undefined,
): L | undefined {
  if (!coreAutoListingAddress) return undefined;
  return lists.find(
    (list) =>
      list.id === coreListId(chainId) &&
      list.autoListingContract?.toLowerCase() === coreAutoListingAddress.toLowerCase(),
  );
}

export function findLookalikeOf<T extends TrustTokenLike>(
  token: TrustTokenLike,
  defaultList: TrustListLike<T> | undefined,
): { official: T; match: LookalikeMatch } | undefined {
  if (!defaultList) return undefined;
  const name = normalizeTokenText(token.name);
  const symbol = normalizeTokenText(token.symbol);
  if (!name && !symbol) return undefined;

  let best: { official: T; match: LookalikeMatch } | undefined;
  for (const entry of defaultList.list.tokens) {
    if (isSameToken(entry, token)) continue;
    const sameName = !!name && normalizeTokenText(entry.name) === name;
    const sameSymbol = !!symbol && normalizeTokenText(entry.symbol) === symbol;
    if (sameName && sameSymbol) return { official: entry, match: "name_and_symbol" };
    if (!best && (sameName || sameSymbol)) {
      best = { official: entry, match: sameName ? "name" : "symbol" };
    }
  }
  return best;
}

/**
 * Trust level of a token. `lists` are all of the user's lists for this chain, enabled or not: the
 * default and Core lists count even when the user switched them off in Manage tokens.
 */
export function getTokenTrust<T extends TrustTokenLike, L extends TrustListLike<T>>(
  token: TrustTokenLike,
  lists: readonly L[],
  chainId: number,
  coreAutoListingAddress: string | undefined,
): TokenTrust<T> {
  const defaultList = lists.find((list) => list.id === defaultListId(chainId));
  const coreList = findCoreList(lists, chainId, coreAutoListingAddress);
  const holding = lists.filter((list) => !!findInList(list, token)).map((list) => list.id);
  const except = (id: TrustListId) => holding.filter((listId) => listId !== id);
  const onCoreList = !!findInList(coreList, token);

  if (findInList(defaultList, token)) {
    return { level: "high", reason: "official", onCoreList, alsoIn: except(defaultList?.id) };
  }

  const lookalike = findLookalikeOf(token, defaultList);
  if (lookalike) {
    return { level: "low", reason: "lookalike", ...lookalike, onCoreList, alsoIn: holding };
  }

  if (onCoreList) {
    return {
      level: CORE_LISTED_IS_HIGH ? "high" : "medium",
      reason: "core",
      onCoreList,
      alsoIn: except(coreList?.id),
    };
  }

  return { level: "medium", reason: "unverified", onCoreList, alsoIn: holding };
}

/** Whether the Review swap dialog asks for an acknowledgement before this token is swapped. */
export function swapNeedsAcknowledgement(trust: Pick<TokenTrust, "reason"> | undefined): boolean {
  if (!trust) return false;
  if (trust.reason === "lookalike") return true;
  return trust.reason === "unverified" && NOT_VERIFIED_GATES_SWAP;
}
