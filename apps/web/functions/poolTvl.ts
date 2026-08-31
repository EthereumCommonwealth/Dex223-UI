import { Address } from "viem";

/** `token0Price`/`token1Price` are BigDecimal strings, balances arrive as strings too. */
export type PoolPriceInput = {
  token0: { id: string };
  token1: { id: string };
  token0Price: string | number;
  token1Price: string | number;
  totalValueLockedToken0?: string | number;
  totalValueLockedToken1?: string | number;
};

export type TokenPrice = {
  price: number;
  depth: number;
};

export type TokenPriceIndex = Record<string, TokenPrice>;

const MAX_RESOLUTION_PASSES = 3;

export function buildTokenPriceIndex(pools: PoolPriceInput[], anchors: Address[]): TokenPriceIndex {
  const index: TokenPriceIndex = {};

  for (const anchor of anchors) {
    index[anchor.toLowerCase()] = { price: 1, depth: Infinity };
  }

  if (!anchors.length) {
    return index;
  }

  for (let pass = 0; pass < MAX_RESOLUTION_PASSES; pass++) {
    let changed = false;

    for (const pool of pools) {
      const token0 = pool.token0?.id?.toLowerCase();
      const token1 = pool.token1?.id?.toLowerCase();

      if (!token0 || !token1) {
        continue;
      }

      changed =
        offer(index, token1, token0, Number(pool.token0Price), pool.totalValueLockedToken0) ||
        changed;
      changed =
        offer(index, token0, token1, Number(pool.token1Price), pool.totalValueLockedToken1) ||
        changed;
    }

    if (!changed) {
      break;
    }
  }

  return index;
}

function offer(
  index: TokenPriceIndex,
  target: string,
  via: string,
  priceInVia: number,
  viaBalance: string | number | undefined,
): boolean {
  const viaPrice = index[via];

  if (!viaPrice || !Number.isFinite(priceInVia) || priceInVia <= 0) {
    return false;
  }

  const price = priceInVia * viaPrice.price;
  const depth = Math.max(Number(viaBalance) || 0, 0) * viaPrice.price;

  if (!Number.isFinite(price) || price <= 0) {
    return false;
  }

  // `>` rather than `>=` so a pass over unchanged data settles instead of looping.
  if (index[target] && index[target].depth >= depth) {
    return false;
  }

  index[target] = { price, depth };
  return true;
}

export function computePoolTVL({
  pool,
  balance0,
  balance1,
  priceIndex,
}: {
  pool: PoolPriceInput | undefined;
  balance0?: number;
  balance1?: number;
  priceIndex: TokenPriceIndex;
}): number | undefined {
  if (!pool) {
    return undefined;
  }

  const amount0 = balance0 ?? Number(pool.totalValueLockedToken0);
  const amount1 = balance1 ?? Number(pool.totalValueLockedToken1);

  if (!Number.isFinite(amount0) || !Number.isFinite(amount1)) {
    return undefined;
  }

  const token0 = pool.token0?.id?.toLowerCase();
  const token1 = pool.token1?.id?.toLowerCase();

  if (!token0 || !token1) {
    return undefined;
  }

  const price0 = priceIndex[token0];
  const price1 = priceIndex[token1];

  const valueAt = (usd0: number, usd1: number): number | undefined => {
    const tvl = amount0 * usd0 + amount1 * usd1;
    return Number.isFinite(tvl) ? tvl : undefined;
  };

  if (price0?.depth === Infinity && price1?.depth === Infinity) {
    return valueAt(price0.price, price1.price);
  }

  const candidates = [
    price0 && valueAt(price0.price, price0.price * Number(pool.token0Price)),
    price1 && valueAt(price1.price * Number(pool.token1Price), price1.price),
  ].filter((value): value is number => value !== undefined && value !== null);

  return candidates.length ? Math.min(...candidates) : undefined;
}
