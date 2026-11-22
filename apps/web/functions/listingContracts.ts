type NamedListing = { id: string; name: string };

/**
 * A listing contract name compared without case, spaces or punctuation ("Auto-listing" = "Autolisting").
 * NFKC first, so fullwidth letters ("Ｄｅｘ２２３") count as the letters they are drawn as instead of
 * being deleted. Invisible characters are deleted with the punctuation. Letters of other scripts
 * that look Latin are still deleted, not folded; that needs the Unicode confusables table.
 */
export function normalizeListingName(name: string): string {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Listing contracts in the order the token-listing pages show them.
 *
 * Any contract can register in the AutoListingsRegistry under any name, and the subgraph returns
 * contracts ordered by address. So the official lists (the ones the swap page reads) always come
 * first, whatever their address, and a contract that is not official but uses an official list's
 * name is left out: it can only be there to take a listing fee meant for Dex223's list.
 * `reservedNames` keeps the official names reserved even while the official lists themselves have
 * not loaded.
 */
export function orderListingContracts<T extends NamedListing>(
  officialIds: readonly string[],
  official: readonly T[],
  others: readonly T[],
  reservedNames: readonly string[] = [],
): T[] {
  const ids = officialIds.map((id) => id.toLowerCase());
  const officialSorted = ids
    .map((id) => official.find((listing) => listing.id.toLowerCase() === id))
    .filter((listing): listing is T => Boolean(listing));
  const officialNames = new Set(
    [...reservedNames, ...officialSorted.map((listing) => listing.name)].map(normalizeListingName),
  );

  const rest = others.filter(
    (listing) =>
      !ids.includes(listing.id.toLowerCase()) &&
      !officialNames.has(normalizeListingName(listing.name)),
  );
  return [...officialSorted, ...rest];
}
