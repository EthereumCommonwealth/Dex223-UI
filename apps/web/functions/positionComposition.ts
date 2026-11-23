export function positionComposition(
  ratio: number | undefined,
  showFirst: boolean,
): { token0: number | undefined; token1: number | undefined } {
  if (typeof ratio !== "number" || !Number.isFinite(ratio)) {
    return { token0: undefined, token1: undefined };
  }
  const token0 = showFirst ? 100 - ratio : ratio;
  return { token0, token1: 100 - token0 };
}
