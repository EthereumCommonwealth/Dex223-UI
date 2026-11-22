/**
 * Subgraph list fields without `first` return at most 100 rows, ordered by id (graph-node's
 * default), and the app treated that as the whole list (bounty #172). 1000 is The Graph's largest
 * page; longer lists are read page by page with `skip`.
 *
 * This module has no runtime imports so the node tests can load it directly.
 */

export const SUBGRAPH_PAGE_SIZE = 1000;

/**
 * All rows of a list whose first page is already loaded. `total` is the count the subgraph keeps
 * for the list (an autolisting's `totalTokens`); `fetchPage(skip)` reads the next page in the same
 * order. Stops at `total`, at a short page, or at an empty page, whichever comes first.
 */
export async function collectPages<T>(
  firstPage: readonly T[],
  total: number,
  fetchPage: (skip: number) => Promise<readonly T[] | undefined>,
  pageSize: number = SUBGRAPH_PAGE_SIZE,
): Promise<T[]> {
  const rows = [...firstPage];
  if (firstPage.length < pageSize) return rows;
  while (rows.length < total) {
    const page = (await fetchPage(rows.length)) ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

type DayPrice = { priceUSD: number | string };

/**
 * The newest day price of a token, from `tokenDayData(first: 1, orderBy: date, orderDirection: desc)`.
 * A token has no day row until the first mint, swap, burn or collect in one of its pools.
 */
export function latestDayPrice(
  token: { tokenDayData?: readonly DayPrice[] | null } | null | undefined,
) {
  return token?.tokenDayData?.[0]?.priceUSD;
}

/** USD prices by token address from the bulk query; tokens without a day row are skipped. */
export function pricesByToken(
  tokens: readonly { id: string; tokenDayData?: readonly DayPrice[] | null }[] | null | undefined,
): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const token of tokens ?? []) {
    const price = latestDayPrice(token);
    if (price !== undefined && price !== null) prices[token.id] = Number(price);
  }
  return prices;
}
