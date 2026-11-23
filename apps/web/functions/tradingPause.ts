/**
 * Chains where the app does not start new trades.
 *
 * Ethereum mainnet (1) is paused until the DEX223 relaunch on new contracts (decision 2026-11-22).
 * Blocked: swap, create pool, add or increase liquidity, token listing. Exits stay open
 * (remove liquidity, collect fees, close positions, withdraw, claim, unstake), and so does the
 * ERC-20/ERC-223 converter. Margin is already unavailable on mainnet (no module deployed).
 * Lift the pause at the relaunch by emptying this list.
 *
 * Kept free of path aliases so tests/tradingPause.test.cjs can load it directly.
 */
export const TRADING_PAUSED_CHAIN_IDS: readonly number[] = [1];

export function isTradingPaused(chainId: number | undefined): boolean {
  return chainId !== undefined && TRADING_PAUSED_CHAIN_IDS.includes(chainId);
}
