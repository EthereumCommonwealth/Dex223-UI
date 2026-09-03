import { Address } from "viem";

/** `token0Price`/`token1Price` are BigDecimal strings, balances arrive as strings too. */
export type PoolPriceInput = {
  id?: string;
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

export type PoolDepthBalances = Record<string, { token0: number; token1: number }>;

const MAX_RESOLUTION_PASSES = 3;

export function buildTokenPriceIndex(
  pools: PoolPriceInput[],
  anchors: Address[],
  balances: PoolDepthBalances = {},
): TokenPriceIndex {
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

      const onChain = pool.id ? balances[pool.id.toLowerCase()] : undefined;
      const balance0 = onChain?.token0 ?? pool.totalValueLockedToken0;
      const balance1 = onChain?.token1 ?? pool.totalValueLockedToken1;

      changed = offer(index, token1, token0, Number(pool.token0Price), balance0) || changed;
      changed = offer(index, token0, token1, Number(pool.token1Price), balance1) || changed;
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

  const price0 = priceIndex[token0]?.price;
  const price1 = priceIndex[token1]?.price;

  const usd0 = price0 ?? derivePrice(price1, pool.token1Price);
  const usd1 = price1 ?? derivePrice(price0, pool.token0Price);
  if ((usd0 === undefined && amount0 !== 0) || (usd1 === undefined && amount1 !== 0)) {
    return undefined;
  }

  const tvl = amount0 * (usd0 ?? 0) + amount1 * (usd1 ?? 0);

  return Number.isFinite(tvl) ? tvl : undefined;
}

function derivePrice(price: number | undefined, ratio: string | number): number | undefined {
  if (price === undefined) {
    return undefined;
  }

  const derived = price * Number(ratio);

  return Number.isFinite(derived) && derived > 0 ? derived : undefined;
}
