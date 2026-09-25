import { Address, formatUnits, Hash } from "viem";

import { LendingOrder, MarginPosition } from "@/app/[locale]/margin-trading/types";
import { DexChainId } from "@/sdk_bi/chains";
import { Currency } from "@/sdk_bi/entities/currency";
import { NativeCoin } from "@/sdk_bi/entities/ether";
import { Token } from "@/sdk_bi/entities/token";
import { wrappedTokens } from "@/sdk_bi/entities/weth9";
import { Standard } from "@/sdk_bi/standard";

export type GqlToken = {
  addressERC20: string;
  addressERC223: string;
  decimals: string;
  id: string;
  name: string;
  symbol: string;
};

export type GqlPosition = {
  id: number;
  owner: Address;
  loanAmount: bigint;
  baseAssetToken: GqlToken;
  deadline: number;
  assetsTokens: GqlToken[];
  assets: {
    address: Address;
    balance: bigint;
    assetId: number;
  }[];

  createdAt: string;

  isClosed: boolean;
  closedAt: string;
  isLiquidated: boolean;
  liquidatedAt: string;
  order: GqlOrder;
  liquidator: Address;
  txClosed: Hash;
  txFrozen: Hash;
  txLiquidated: Hash;
  collateralToken: GqlToken;
  collateralAmount: bigint;
  leverage: number;
};

export type GqlOrder = {
  id: number;
  owner: Address;
  leverage: number;
  minLoan: bigint;
  duration: number;
  deadline: number;

  baseAssetToken: GqlToken;
  baseAsset: Address;
  createdAt: string;

  liquidationRewardAmount: bigint;
  liquidationRewardAsset: Address;
  liquidationRewardAssetToken: GqlToken;

  interestRate: number;
  currencyLimit: number;

  collaterals: Address[];
  collateralTokens: GqlToken[];
  balance: bigint;
  positions: GqlPosition[];

  whitelist: {
    allowedForTrading: Address[];
    allowedForTradingTokens: GqlToken[];
    autolisting: Address;
    id: string;
  };

  alive: boolean;
  oracle: Address;
};

type BaseGqlRecentTransaction = {
  timestamp: string;
};

type GqlMarginSwapFields = {
  amountIn: string;
  amountOut: string;
  assetInToken: GqlToken;
  assetOutToken: GqlToken;
};

type GqlPositionOpenFields = {
  baseAssetToken: GqlToken;
  loanAmount: string;
};

type GqlPositionWithdrawalFields = {
  assetToken: GqlToken;
  quantity: string;
};

type GqlPositionDepositFields = {
  assetToken: GqlToken;
  amount: string;
};

export type GqlRecentTransaction = {
  marginSwap: BaseGqlRecentTransaction & GqlMarginSwapFields;
  positionOpened: BaseGqlRecentTransaction & GqlPositionOpenFields;
  key:
    | "PositionDeposit"
    | "PositionWithdrawal"
    | "PositionClosed"
    | "PositionOpened"
    | "MarginSwap"
    | "PositionLiquidated"
    | "PositionFrozen";
  id: Hash;
  timestamp: string;
  positionLiquidated: BaseGqlRecentTransaction;
  positionWithdrawal: BaseGqlRecentTransaction & GqlPositionWithdrawalFields;
  positionFrozen: BaseGqlRecentTransaction;
  positionDeposit: BaseGqlRecentTransaction & GqlPositionDepositFields;
  positionClosed: BaseGqlRecentTransaction;
};

export function gqlTokenToCurrency(gqlToken: GqlToken, chainId: DexChainId): Currency {
  if (gqlToken.addressERC20.toLowerCase() === wrappedTokens[chainId].address0.toLowerCase()) {
    return NativeCoin.onChain(chainId);
  }

  return new Token(
    chainId,
    gqlToken.addressERC20 as Address,
    gqlToken.addressERC223 as Address,
    +gqlToken.decimals,
    gqlToken.symbol,
    gqlToken.name,
    "/images/tokens/placeholder.svg",
  );
}

export function serializeGqlOrder(
  gqlOrder: GqlOrder,
  chainId: DexChainId,
): Omit<LendingOrder, "positions"> {
  const { positions, duration, liquidationRewardAmount, balance, minLoan, createdAt, ...rest } =
    gqlOrder;

  return {
    ...rest,
    minLoan: BigInt(minLoan),
    liquidationRewardAmount: {
      value: BigInt(liquidationRewardAmount),
      formatted: formatUnits(
        liquidationRewardAmount,
        +gqlOrder.liquidationRewardAssetToken.decimals,
      ),
    },
    balance: BigInt(balance),
    positionDuration: duration,
    liquidationRewardAsset: gqlTokenToCurrency(gqlOrder.liquidationRewardAssetToken, chainId),
    baseAsset: gqlTokenToCurrency(gqlOrder.baseAssetToken, chainId),
    baseAssetStandard:
      gqlOrder.baseAsset.toLowerCase() === gqlOrder.baseAssetToken.addressERC20.toLowerCase()
        ? Standard.ERC20
        : Standard.ERC223,
    collateralAddresses: gqlOrder.collaterals,
    allowedTradingAddresses: gqlOrder.whitelist.allowedForTrading,
    isErc223TradingAllowed:
      gqlOrder.whitelist.allowedForTrading &&
      gqlOrder.whitelist.allowedForTrading.length >
        gqlOrder.whitelist.allowedForTradingTokens.length,
    allowedCollateralAssets: gqlOrder.collateralTokens.map((collateralToken: GqlToken) =>
      gqlTokenToCurrency(collateralToken, chainId),
    ),
    allowedTradingAssets: gqlOrder.whitelist.allowedForTradingTokens.map((tradingToken: GqlToken) =>
      gqlTokenToCurrency(tradingToken, chainId),
    ),
    liquidationRewardAssetStandard:
      gqlOrder.liquidationRewardAsset === gqlOrder.liquidationRewardAssetToken.addressERC20
        ? Standard.ERC20
        : Standard.ERC223,
    createdAt: +createdAt,
  };
}

export function serializeGqlPosition(
  gqlPosition: GqlPosition,
  chainId: DexChainId,
): Omit<MarginPosition, "order"> {
  const {
    assets,
    assetsTokens,
    baseAssetToken,
    order,
    loanAmount,
    liquidatedAt,
    createdAt,
    closedAt,
    collateralAmount,
    collateralToken,
    leverage,
    ...rest
  } = gqlPosition;

  return {
    ...rest,
    closedAt: +closedAt,
    liquidatedAt: +liquidatedAt,
    createdAt: +createdAt,
    loanAmount: BigInt(loanAmount),
    loanAsset: gqlTokenToCurrency(baseAssetToken, chainId),
    assetAddresses: assets.map((asset) => ({ ...asset, balance: BigInt(asset.balance) })),
    assets: assetsTokens.map((tradingToken: GqlToken) => gqlTokenToCurrency(tradingToken, chainId)),
    assetsWithBalances: assetsTokens.map((tradingToken: GqlToken) => ({
      asset: gqlTokenToCurrency(tradingToken, chainId),
      balance: assets.find((asset: any) => asset.address === tradingToken.addressERC20)?.balance,
    })),
    collateralAsset: gqlTokenToCurrency(collateralToken, chainId),
    collateralAmount: BigInt(collateralAmount),
    initialLeverage: +leverage,
  };
}

export enum MarginPositionTransactionType {
  MARGIN_SWAP,
  WITHDRAW,
  FROZEN,
  DEPOSIT,
  CLOSED,
  BORROW,
  LIQUIDATED,
}

type MarginSwapFields = {
  amountIn: bigint;
  amountOut: bigint;
  assetInToken: Currency;
  assetOutToken: Currency;
};

type PositionOpenFields = {
  assetToken: Currency;
  amount: bigint;
};

type PositionWithdrawalFields = {
  assetToken: Currency;
  amount: bigint;
};

type BaseMarginPositionFields = {
  hash: Hash;
  timestamp: string;
};

export type MarginPositionRecentTransaction =
  | (BaseMarginPositionFields & {
      type: MarginPositionTransactionType.WITHDRAW;
    } & PositionWithdrawalFields)
  | (BaseMarginPositionFields & {
      type: MarginPositionTransactionType.MARGIN_SWAP;
    } & MarginSwapFields)
  | (BaseMarginPositionFields & {
      type: MarginPositionTransactionType.DEPOSIT;
      assetToken: Currency;
      amount: bigint;
    })
  | (BaseMarginPositionFields & {
      type: MarginPositionTransactionType.BORROW;
    } & PositionOpenFields)
  | (BaseMarginPositionFields & {
      type: MarginPositionTransactionType.CLOSED;
    })
  | (BaseMarginPositionFields & {
      type: MarginPositionTransactionType.FROZEN;
    })
  | (BaseMarginPositionFields & {
      type: MarginPositionTransactionType.LIQUIDATED;
    });

const keyToTransactionTypeMap = {
  PositionDeposit: MarginPositionTransactionType.DEPOSIT,
  PositionWithdrawal: MarginPositionTransactionType.WITHDRAW,
  PositionClosed: MarginPositionTransactionType.CLOSED,
  PositionOpened: MarginPositionTransactionType.BORROW,
  MarginSwap: MarginPositionTransactionType.MARGIN_SWAP,
  PositionLiquidated: MarginPositionTransactionType.LIQUIDATED,
  PositionFrozen: MarginPositionTransactionType.FROZEN,
};

const keyToFieldNameMap = {
  PositionDeposit: "positionDeposit",
  PositionWithdrawal: "positionWithdrawal",
  PositionClosed: "positionClosed",
  PositionOpened: "positionOpened",
  MarginSwap: "marginSwap",
  PositionLiquidated: "positionLiquidated",
  PositionFrozen: "positionFrozen",
};

export function serializeGqlRecentTransactions(
  gqlRecentTransactions: GqlRecentTransaction[],
  chainId: DexChainId,
): MarginPositionRecentTransaction[] {
  return gqlRecentTransactions.map((gqlTx) => {
    const fieldName = keyToFieldNameMap[gqlTx.key] as keyof GqlRecentTransaction;
    const field = gqlTx[fieldName] as any;
    const timestamp = gqlTx?.timestamp;

    switch (gqlTx.key) {
      case "MarginSwap": {
        const { amountIn, amountOut, assetInToken, assetOutToken } =
          field[0] as GqlMarginSwapFields;
        return {
          type: MarginPositionTransactionType.MARGIN_SWAP,
          hash: gqlTx.id,
          timestamp,
          amountIn: BigInt(amountIn),
          amountOut: BigInt(amountOut),
          assetInToken: gqlTokenToCurrency(assetInToken, chainId),
          assetOutToken: gqlTokenToCurrency(assetOutToken, chainId),
        };
      }
      case "PositionWithdrawal": {
        const { assetToken, quantity } = field[0] as GqlPositionWithdrawalFields;
        return {
          type: MarginPositionTransactionType.WITHDRAW,
          hash: gqlTx.id,
          timestamp,
          assetToken: gqlTokenToCurrency(assetToken, chainId),
          amount: BigInt(quantity),
        };
      }
      case "PositionDeposit": {
        const { assetToken, amount } = field[0] as GqlPositionDepositFields;
        return {
          type: MarginPositionTransactionType.DEPOSIT,
          hash: gqlTx.id,
          timestamp,
          assetToken: gqlTokenToCurrency(assetToken, chainId),
          amount: BigInt(amount),
        };
      }
      case "PositionOpened": {
        const { baseAssetToken, loanAmount } = field[0] as GqlPositionOpenFields;
        return {
          type: MarginPositionTransactionType.BORROW,
          hash: gqlTx.id,
          timestamp,
          assetToken: gqlTokenToCurrency(baseAssetToken, chainId),
          amount: BigInt(loanAmount),
        };
      }
      case "PositionClosed":
        return {
          type: MarginPositionTransactionType.CLOSED,
          hash: gqlTx.id,
          timestamp,
        };
      case "PositionFrozen":
        return {
          type: MarginPositionTransactionType.FROZEN,
          hash: gqlTx.id,
          timestamp,
        };
      case "PositionLiquidated":
        return {
          type: MarginPositionTransactionType.LIQUIDATED,
          hash: gqlTx.id,
          timestamp,
        };
      default:
        return {
          type: MarginPositionTransactionType.LIQUIDATED,
          hash: gqlTx.id,
          timestamp,
        };
      // throw new Error(`Unsupported transaction key: ${gqlTx.key}`);
    }
  });
}
