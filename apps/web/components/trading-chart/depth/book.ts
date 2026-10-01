/** One price level: `amount` of the base asset at `price`, `total` summed from the spread. */
export interface BookLevel {
  price: number;
  amount: number;
  total: number;
}

export interface Book {
  /** Best (highest) bid first. */
  bids: BookLevel[];
  /** Best (lowest) ask first. */
  asks: BookLevel[];
  /** Mid price, or the pool price for an AMM book. */
  mid: number | null;
}

function withTotals(levels: { price: number; amount: number }[]): BookLevel[] {
  let total = 0;
  return levels.map((level) => {
    total += level.amount;
    return { ...level, total };
  });
}

/** An exchange order book from raw `[price, quantity]` string pairs, best levels first. */
export function exchangeBook(
  bids: [string, string][],
  asks: [string, string][],
  depth: number,
): Book {
  const parse = (rows: [string, string][]) =>
    rows
      .map(([price, amount]) => ({ price: Number(price), amount: Number(amount) }))
      .filter((row) => row.amount > 0)
      .slice(0, depth);
  const b = withTotals(parse(bids));
  const a = withTotals(parse(asks));
  const mid = b.length && a.length ? (b[0].price + a[0].price) / 2 : null;
  return { bids: b, asks: a, mid };
}

export interface PoolState {
  /** Initialized ticks, any order. */
  ticks: { tick: number; liquidityNet: bigint }[];
  sqrtPriceX96: bigint;
  /** Liquidity active at the current price. */
  liquidity: bigint;
  decimals0: number;
  decimals1: number;
}

/** A stretch of sqrt price (raw token1 per token0) over which liquidity is constant. */
interface Segment {
  lo: number;
  hi: number;
  liquidity: number;
}

const tickSqrt = (tick: number) => Math.pow(1.0001, tick / 2);

/**
 * Liquidity by sqrt price, walked out from the current price the way the pool itself
 * does: crossing a tick upward adds its liquidityNet, crossing downward removes it.
 */
function segments(state: PoolState, sqrtP: number): Segment[] {
  const sorted = [...state.ticks].sort((a, b) => a.tick - b.tick);
  const current = Number(state.liquidity);
  const out: Segment[] = [];

  let liquidity = current;
  let from = sqrtP;
  for (const t of sorted) {
    const s = tickSqrt(t.tick);
    if (s <= sqrtP) continue;
    out.push({ lo: from, hi: s, liquidity });
    liquidity += Number(t.liquidityNet);
    from = s;
  }
  out.push({ lo: from, hi: Infinity, liquidity });

  liquidity = current;
  from = sqrtP;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const s = tickSqrt(sorted[i].tick);
    if (s > sqrtP) continue;
    out.push({ lo: s, hi: from, liquidity });
    liquidity -= Number(sorted[i].liquidityNet);
    from = s;
  }
  out.push({ lo: 0, hi: from, liquidity });

  return out.filter((s) => s.liquidity > 0 && s.hi > s.lo);
}

/** Raw token amounts the pool holds between two sqrt prices. */
function amountsBetween(segs: Segment[], a: number, b: number) {
  let amount0 = 0;
  let amount1 = 0;
  for (const s of segs) {
    const lo = Math.max(s.lo, a);
    const hi = Math.min(s.hi, b);
    if (hi <= lo || lo <= 0) continue;
    amount0 += s.liquidity * (1 / lo - 1 / hi);
    amount1 += s.liquidity * (hi - lo);
  }
  return { amount0, amount1 };
}

/**
 * A concentrated-liquidity pool read as an order book. A pool has no orders; what it has
 * is liquidity at every price. Each ask level is how much of the base asset a buyer takes
 * to move the price up through that band, each bid level how much a seller has to put in
 * to move it down through it. Bands are `step` wide (0.01 = 1%), `levels` per side.
 *
 * `inverted` reads the book as token0 per token1, matching a chart symbol ending in :I.
 */
export function poolBook(
  state: PoolState,
  { inverted, step, levels }: { inverted: boolean; step: number; levels: number },
): Book {
  const sqrtP = Number(state.sqrtPriceX96) / 2 ** 96;
  if (!(sqrtP > 0)) return { bids: [], asks: [], mid: null };

  const scale = Math.pow(10, state.decimals0 - state.decimals1);
  const storedMid = sqrtP * sqrtP * scale;
  const mid = inverted ? 1 / storedMid : storedMid;
  const segs = segments(state, sqrtP);

  // Displayed price back to raw sqrt price in the pool's own orientation.
  const toSqrt = (price: number) => Math.sqrt((inverted ? 1 / price : price) / scale);
  const baseAmount = (a: number, b: number) => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const { amount0, amount1 } = amountsBetween(segs, lo, hi);
    return inverted ? amount1 / 10 ** state.decimals1 : amount0 / 10 ** state.decimals0;
  };

  const side = (direction: 1 | -1) => {
    const rows: { price: number; amount: number }[] = [];
    for (let i = 1; i <= levels; i++) {
      const near = mid * (1 + direction * step * (i - 1));
      const far = mid * (1 + direction * step * i);
      if (far <= 0) break;
      rows.push({ price: far, amount: baseAmount(toSqrt(near), toSqrt(far)) });
    }
    return withTotals(rows);
  };

  return { asks: side(1), bids: side(-1), mid };
}
