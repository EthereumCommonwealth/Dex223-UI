import { fallback } from "viem";
import { create } from "zustand";

import {
  LendingOrderPeriod,
  LendingOrderPeriodType,
  LendingOrderTradingTokens,
  LiquidationMode,
  LiquidationType,
  PerpetualPeriodType,
  TradingTokensInputMode,
} from "@/app/[locale]/margin-trading/lending-order/create/steps/types";
import { Currency } from "@/sdk_bi/entities/currency";
import { Standard } from "@/sdk_bi/standard";

type FirstStepValues = {
  interestRatePerMonth: string;
  period: LendingOrderPeriod;
  loanToken: Currency | undefined;
  loanAmount: string;
  loanTokenStandard: Standard;
};

type SecondStepValues = {
  leverage: number;
  collateralTokens: Currency[];
  includeERC223Collateral: boolean;
  minimumBorrowingAmount: string;
  tradingTokens: LendingOrderTradingTokens;
};

export type ThirdStepValues = {
  liquidationMode: LiquidationMode;
  orderCurrencyLimit: string;
  liquidationFeeToken: Currency | undefined;
  liquidationFeeForLiquidator: string;
  liquidationFeeForLender: string;
  priceSource: any;
};

interface CreateOrderConfig {
  isInitialized: boolean;

  firstStepValues: FirstStepValues;
  secondStepValues: SecondStepValues;
  thirdStepValues: ThirdStepValues;

  setIsInitialized: (isInitialized: boolean) => void;

  setFirstStepValues: (firstStep: FirstStepValues) => void;
  setSecondStepValues: (secondStep: SecondStepValues) => void;
  setThirdStepValues: (thirdStep: ThirdStepValues) => void;
}

export const useEditOrderConfigStore = create<CreateOrderConfig>((set, get) => ({
  isInitialized: false,

  firstStepValues: {
    interestRatePerMonth: "",
    period: {
      type: LendingOrderPeriodType.FIXED, // or PERPETUAL
      lendingOrderDeadline: "", // string or Date
      positionDuration: "",
      borrowingPeriod: {
        type: PerpetualPeriodType.DAYS, // or SECONDS
        borrowingPeriodInDays: "",
        borrowingPeriodInMinutes: "",
      },
    },
    loanToken: undefined,
    loanAmount: "",
    loanTokenStandard: Standard.ERC20,
  },
  secondStepValues: {
    leverage: 5,
    minimumBorrowingAmount: "",
    collateralTokens: [],
    includeERC223Collateral: false,

    tradingTokens: {
      inputMode: TradingTokensInputMode.MANUAL,
      allowedTokens: [],
      includeERC223Trading: false,
      tradingTokensAutoListing: undefined,
    },
  },
  thirdStepValues: {
    liquidationMode: {
      type: LiquidationType.ANYONE,
      whitelistedLiquidators: [],
    },
    orderCurrencyLimit: "",
    liquidationFeeToken: undefined,
    liquidationFeeForLiquidator: "",
    liquidationFeeForLender: "",
    priceSource: "",
  },

  setIsInitialized: (isInitialized: boolean) => set({ isInitialized }),

  setFirstStepValues: (firstStepValues: FirstStepValues) => set({ firstStepValues }),
  setSecondStepValues: (secondStepValues: SecondStepValues) => set({ secondStepValues }),
  setThirdStepValues: (thirdStepValues: ThirdStepValues) => set({ thirdStepValues }),
}));
