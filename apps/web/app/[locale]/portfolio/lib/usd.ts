import { formatUnits } from "viem";

import { usePoolPriceIndex } from "@/app/[locale]/pools/hooks";
import { getUSDAnchorTokens } from "@/config/constants/usdAnchors";
import { TokenPriceIndex } from "@/functions/poolTvl";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { Currency } from "@/sdk_bi/entities/currency";

import { WalletBalances } from "../stores/useWalletsBalances";
import { usePortfolioNetworkSupported } from "./network";

// Same mark the pools pages show for a value they cannot price.
export const USD_UNKNOWN = "–";

/** `null` means the chain has no USD anchor, so no dollar value can be shown at all. */
export type PortfolioPrices = TokenPriceIndex | null;

type PricedCurrency = {
  decimals: number;
  wrapped: { address0: string };
};

/**
 * USD prices for the current chain, anchored on its stablecoins the same way the pools
 * pages value TVL. The index is rebuilt per chain, so a network switch never shows the
 * previous chain's prices. An unsupported network fetches nothing.
 */
export function usePortfolioPrices(): PortfolioPrices {
  const currentChainId = useCurrentChainId();
  const chainId = usePortfolioNetworkSupported() ? currentChainId : undefined;
  const { priceIndex } = usePoolPriceIndex(chainId);

  return getUSDAnchorTokens(chainId).length ? priceIndex : null;
}

export function formatPortfolioUsd(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return USD_UNKNOWN;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function tokenUsdPrice(prices: PortfolioPrices, token: PricedCurrency): number | null {
  const price = prices?.[token.wrapped.address0.toLowerCase()]?.price;
  return price !== undefined && Number.isFinite(price) && price > 0 ? price : null;
}

/** Dollar value of one holding, or `null` when the token has no usable price. */
export function holdingUsd(
  prices: PortfolioPrices,
  token: PricedCurrency,
  amount: bigint,
): number | null {
  const price = tokenUsdPrice(prices, token);
  if (price === null) return null;
  return Number(formatUnits(amount, token.decimals)) * price;
}

/**
 * Sum of several holdings. Empty holdings add nothing, so an unpriced token the wallet
 * does not hold does not hide the total. Any held token without a price does.
 */
type Holding = { token: PricedCurrency; amount: bigint };

export function holdingsUsd(prices: PortfolioPrices, holdings: Holding[]): number | null {
  if (!prices) return null;
  return combineUsd(
    holdings
      .filter(({ amount }) => amount > BigInt(0))
      .map(({ token, amount }) => holdingUsd(prices, token, amount)),
  );
}

export function combineUsd(values: Array<number | null>): number | null {
  if (values.some((value) => value === null)) return null;
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

export function positionValueUsd(
  prices: PortfolioPrices,
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
  return holdingsUsd(prices, [
    { token: position.pool.token0, amount: position.amount0.quotient },
    { token: position.pool.token1, amount: position.amount1.quotient },
  ]);
}

export function positionFeesUsd(
  prices: PortfolioPrices,
  position: { pool: { token0: PricedCurrency; token1: PricedCurrency } } | null | undefined,
  tokensOwed0: bigint,
  tokensOwed1: bigint,
): number | null {
  if (!position) return null;
  return holdingsUsd(prices, [
    { token: position.pool.token0, amount: tokensOwed0 },
    { token: position.pool.token1, amount: tokensOwed1 },
  ]);
}

export function walletHoldingsUsd(
  prices: PortfolioPrices,
  tokens: Currency[],
  wallet: WalletBalances | undefined,
): number | null {
  if (!wallet) return null;

  return holdingsUsd(
    prices,
    tokens.flatMap<Holding>((token) => {
      if (token.isNative) {
        return [{ token, amount: wallet.nativeBalance }];
      }

      const erc20 =
        wallet.balances.find(
          (balance) => balance.address.toLowerCase() === token.wrapped.address0.toLowerCase(),
        )?.value ?? BigInt(0);
      const erc223 =
        wallet.balances.find(
          (balance) => balance.address.toLowerCase() === token.wrapped.address1.toLowerCase(),
        )?.value ?? BigInt(0);

      return [
        { token, amount: erc20 },
        { token, amount: erc223 },
      ];
    }),
  );
}
