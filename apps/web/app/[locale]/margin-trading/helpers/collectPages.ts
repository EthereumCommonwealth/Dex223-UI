export async function collectPages<T>(
  firstPage: T[],
  loadPage: (offset: number) => Promise<T[]>,
  pageSize: number,
): Promise<T[]> {
  const result = [...firstPage];
  let page = firstPage;
  while (page.length === pageSize) {
    page = await loadPage(result.length);
    result.push(...page);
  }
  return result;
}
