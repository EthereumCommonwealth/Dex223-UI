import { formatUnits } from "viem";

import { Currency } from "@/sdk_bi/entities/currency";

import { WalletBalances } from "../stores/useWalletsBalances";

export const USD_UNKNOWN = "$ —";

type PricedCurrency = {
  decimals: number;
  wrapped: { address0: string };
};

export function formatPortfolioUsd(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return USD_UNKNOWN;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function holdingUsd(
  prices: Record<string, number | undefined>,
  token: PricedCurrency,
  amount: bigint,
): number | null {
  if (amount === BigInt(0)) return 0;
  const raw = prices[token.wrapped.address0.toLowerCase()];
  if (raw === undefined || !Number.isFinite(Number(raw))) return null;
  return Number(formatUnits(amount, token.decimals)) * Number(raw);
}

export function combineUsd(values: Array<number | null>): number | null {
  if (values.some((value) => value === null)) return null;
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

export function positionValueUsd(
  prices: Record<string, number | undefined>,
  position:
    | {
        pool: { token0: PricedCurrency; token1: PricedCurrency };
        amount0: { quotient: bigint };
        amount1: { quotient: bigint };
      }
    | null
    | undefined,
): number | null {
  if (!position) return null;
  return combineUsd([
    holdingUsd(prices, position.pool.token0, position.amount0.quotient),
    holdingUsd(prices, position.pool.token1, position.amount1.quotient),
  ]);
}

export function positionFeesUsd(
  prices: Record<string, number | undefined>,
  position: { pool: { token0: PricedCurrency; token1: PricedCurrency } } | null | undefined,
  tokensOwed0: bigint,
  tokensOwed1: bigint,
): number | null {
  if (!position) return null;
  return combineUsd([
    holdingUsd(prices, position.pool.token0, tokensOwed0),
    holdingUsd(prices, position.pool.token1, tokensOwed1),
  ]);
}

export function walletHoldingsUsd(
  prices: Record<string, number | undefined>,
  tokens: Currency[],
  wallet: WalletBalances | undefined,
): number | null {
  if (!wallet) return null;

  const parts = tokens.map((token) => {
    if (token.isNative) {
      return holdingUsd(prices, token, wallet.nativeBalance);
    }

    const erc20 =
      wallet.balances.find(
        (balance) => balance.address.toLowerCase() === token.wrapped.address0.toLowerCase(),
      )?.value ?? BigInt(0);
    const erc223 =
      wallet.balances.find(
        (balance) => balance.address.toLowerCase() === token.wrapped.address1.toLowerCase(),
      )?.value ?? BigInt(0);

    return combineUsd([holdingUsd(prices, token, erc20), holdingUsd(prices, token, erc223)]);
  });

  return combineUsd(parts);
}
