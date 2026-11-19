export function whitelistAutoListing(
  whitelist: { autoListing?: string | null; autolisting?: string | null } | null | undefined,
): string | undefined {
  const value = whitelist?.autoListing || whitelist?.autolisting;
  return value || undefined;
}
