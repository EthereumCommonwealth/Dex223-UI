export function unclaimedFeesUsd(
  token0FeeFormatted: string,
  token1FeeFormatted: string,
  price0: number | undefined,
  price1: number | undefined,
): number {
  const token0FeesUsd = price0 && token0FeeFormatted ? +token0FeeFormatted * price0 : 0;
  const token1FeesUsd = price1 && token1FeeFormatted ? +token1FeeFormatted * price1 : 0;

  return token0FeesUsd + token1FeesUsd;
}
