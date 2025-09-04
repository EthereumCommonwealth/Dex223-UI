"use client";
import Alert from "@repo/ui/alert";
import ExternalTextLink from "@repo/ui/external-text-link";
import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import { useFormik } from "formik";
import Image from "next/image";
import { useLocale } from "next-intl";
import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import SimpleBar from "simplebar-react";
import { formatEther, formatGwei, formatUnits, parseUnits } from "viem";
import { usePublicClient } from "wagmi";
import * as Yup from "yup";

import timestampToDateString from "@/app/[locale]/margin-trading/helpers/timestampToDateString";
import { useOrder } from "@/app/[locale]/margin-trading/hooks/useOrder";
import ReviewBorrowDialog from "@/app/[locale]/margin-trading/lending-order/[id]/borrow/components/ReviewBorrowDialog";
import { useCreateMarginPositionConfigStore } from "@/app/[locale]/margin-trading/lending-order/[id]/borrow/stores/useCreateMarginPositionConfigStore";
import { calculatePeriodInterestRate } from "@/app/[locale]/margin-trading/lending-order/[id]/helpers/calculatePeriodInterestRate";
import LendingOrderDetailsRow from "@/app/[locale]/margin-trading/lending-order/create/components/LendingOrderDetailsRow";
import LendingOrderTokenSelect from "@/app/[locale]/margin-trading/lending-order/create/components/LendingOrderTokenSelect";
import { useConfirmBorrowPositionDialogStore } from "@/app/[locale]/margin-trading/stores/dialogStates";
import { useBorrowRecentTransactionsStore } from "@/app/[locale]/margin-trading/stores/useBorrowRecentTransactionsStore";
import { useSwapRecentTransactionsStore } from "@/app/[locale]/swap/stores/useSwapRecentTransactions";
import Collapse from "@/components/atoms/Collapse";
import Container from "@/components/atoms/Container";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Input, { InputSize, SearchInput } from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import TextField, { HelperText, InputLabel } from "@/components/atoms/TextField";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import IconButton, {
  IconButtonSize,
  IconButtonVariant,
  IconSize,
} from "@/components/buttons/IconButton";
import GasSettingsBlock from "@/components/common/GasSettingsBlock";
import RecentTransactions from "@/components/common/RecentTransactions";
import SelectedTokensInfo from "@/components/common/SelectedTokensInfo";
import { TokenPortfolioDialogContent } from "@/components/dialogs/TokenPortfolioDialog";
import { ORACLE_ABI } from "@/config/abis/oracle";
import { formatFloat } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import { IIFE } from "@/functions/iife";
import { filterTokens } from "@/functions/searchTokens";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import useScopedBlockNumber from "@/hooks/useScopedBlockNumber";
import useTokenBalances from "@/hooks/useTokenBalances";
import { useTokenLists } from "@/hooks/useTokenLists";
import { Link } from "@/i18n/routing";
import { ORACLE_ADDRESS } from "@/sdk_bi/addresses";
import { Currency } from "@/sdk_bi/entities/currency";
import { Token } from "@/sdk_bi/entities/token";
import { Standard } from "@/sdk_bi/standard";

function getTokenOrAmountError({
  touchedAmount,
  touchedToken,
  amountError,
  tokenError,
}: {
  touchedAmount?: boolean;
  touchedToken?: boolean;
  amountError?: string;
  tokenError?: string;
}) {
  const errors = [];

  if (touchedToken && tokenError) {
    errors.push(tokenError);
  }

  if (touchedAmount && amountError) {
    errors.push(amountError);
  }

  return errors;
}

const schema = Yup.object({
  borrowAmount: Yup.number()
    .typeError("Loan amount must be a number")
    .required("Loan amount is required")
    .positive("Loan amount must be greater than zero"),
  collateralAmount: Yup.number()
    .typeError("Collateral amount must be a number")
    .required("Collateral amount is required")
    .positive("Collateral amount must be greater than zero"),
  collateralTokenId: Yup.number(),
  leverage: Yup.number()
    .typeError("Loan amount must be a number")
    .required("Loan amount is required")
    .positive("Loan amount must be greater than zero"),
});

type Marks = number[];

function getMarks(max: number): Marks {
  const niceSteps = [1, 2, 5, 10, 20, 25, 50, 100];

  // 1. Визначаємо крок, щоб не більше 10 сегментів
  let step: number;
  if (max <= 10) {
    step = 1;
  } else {
    const rawStep = Math.ceil(max / 10);
    step = niceSteps.find((f) => f >= rawStep) ?? rawStep;
  }

  const marks: number[] = [];
  marks.push(1);
  for (let m = step; m < max; m += step) {
    if (m > 1) {
      marks.push(m);
    }
  }

  if (marks[marks.length - 1] !== max) {
    marks.push(max);
  }

  const threshold = Math.max(step - 4, 0);
  if (marks.length >= 2) {
    const penult = marks[marks.length - 2];
    if (max - penult < threshold) {
      marks.splice(marks.length - 2, 1);
    }
  }

  return marks;
}

function getPrice(inputAmount: bigint, outputAmount: bigint, scale: bigint = 10n ** 18n): number {
  return Number((outputAmount * scale) / inputAmount) / Number(scale);
}

const DECIMALS = 18n;
const ONE = 10n ** DECIMALS;

function toFixedWithoutExp(n: number, decimals = 18): string {
  if (n === 0) return "0";
  const [integer, decimal = ""] = n.toFixed(decimals).split(".");
  return `${integer}.${decimal.slice(0, decimals)}`;
}

function getFixedPrice(ratio: number): bigint {
  return BigInt(Math.round(1e18 / ratio));
}

/**
 * Calculates borrow amount from collateral, leverage, and price.
 * Formula: borrow = (collateral * (leverage - 1)) / price
 */

function recalculateFromCollateralFixed(
  collateral: bigint, // in fixed-point
  leverage: bigint, // in fixed-point
  price: bigint, // in fixed-point
): bigint {
  const leverageMinusOne = leverage - ONE;
  return (collateral * leverageMinusOne) / price;
}

/**
 * Calculates required collateral from borrow amount, leverage, and price.
 * Formula: collateral = (borrow * price) / (leverage - 1)
 */
function recalculateFromBorrowFixed(
  borrow: bigint, // in fixed-point
  leverage: bigint, // in fixed-point
  price: bigint, // in fixed-point
): bigint {
  const leverageMinusOne = leverage - ONE;
  return (borrow * price) / leverageMinusOne;
}

export default function BorrowPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const locale = useLocale();

  const { id: orderId } = use(params);
  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useBorrowRecentTransactionsStore();
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const { setIsOpen } = useConfirmBorrowPositionDialogStore();

  const { values: savedValues, setValues } = useCreateMarginPositionConfigStore();

  const { order, loading } = useOrder({ id: +orderId });

  const chainId = useCurrentChainId();

  const publicClient = usePublicClient();
  const [ratio, setRatio] = useState<number | undefined>();

  const validate = async (values: typeof savedValues) => {
    const errors: Record<string, string> = {};

    // 1. Static validation via Yup
    try {
      await schema.validate(values, { abortEarly: false });
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        err.inner.forEach((validationError) => {
          if (validationError.path) {
            errors[validationError.path] = validationError.message;
          }
        });
      }
    }

    // 2. Dynamic borrowAmount validation
    if (order?.minLoan && order?.balance && order.baseAsset?.decimals != null) {
      try {
        const borrowDecimals = order.baseAsset.decimals;
        const borrowAmount = parseUnits(values.borrowAmount.toString(), borrowDecimals);
        const min = BigInt(order.minLoan);
        const max = BigInt(order.balance);

        if (borrowAmount < min) {
          errors.borrowAmount = `Min loan is ${formatUnits(min, borrowDecimals)} ${order.baseAsset.symbol}`;
        } else if (borrowAmount > max) {
          errors.borrowAmount = `Max loan is ${formatUnits(max, borrowDecimals)} ${order.baseAsset.symbol}`;
        }
      } catch {
        errors.borrowAmount = "Invalid borrow amount";
      }
    }

    // 3. Dynamic collateralAmount validation
    if (
      ratio &&
      order?.baseAsset?.decimals != null &&
      values.collateralToken &&
      order?.minLoan &&
      order?.balance
    ) {
      try {
        const leverage = parseUnits(values.leverage.toString(), 18);
        const price = parseUnits(toFixedWithoutExp(1 / ratio, 18), 18);

        const collateralDecimals = values.collateralToken.decimals ?? 18;
        const providedCollateral = parseUnits(
          values.collateralAmount.toString(),
          collateralDecimals,
        );

        const minCollateral = recalculateFromBorrowFixed(BigInt(order.minLoan), leverage, price);
        const maxCollateral = recalculateFromBorrowFixed(BigInt(order.balance), leverage, price);

        if (providedCollateral < minCollateral) {
          errors.collateralAmount = `Min collateral for this leverage is ${formatUnits(minCollateral, collateralDecimals)} ${values.collateralToken.symbol}`;
        } else if (providedCollateral > maxCollateral) {
          errors.collateralAmount = `Max collateral for this leverage is ${formatUnits(maxCollateral, collateralDecimals)} ${values.collateralToken.symbol}`;
        }
      } catch (e) {
        console.error("Collateral validation failed", e);
        errors.collateralAmount = "Invalid collateral amount";
      }
    }

    return errors;
  };

  const formik = useFormik({
    validate,
    initialValues: savedValues,
    onSubmit: (values) => {
      setValues(values);
      setIsOpen(true);
    },
  });

  const { values, touched, setFieldValue, errors, handleSubmit, validateForm } = formik;

  const updateFromCollateral = useCallback(
    async (collateralAmount: string, leverage: string, ratioOverride?: number) => {
      const decimals = values.collateralToken?.decimals ?? 18;

      const collateralBigInt = parseUnits(collateralAmount, decimals);
      const leverageBigInt = parseUnits(leverage, 18);

      const effectiveRatio = ratioOverride ?? ratio;
      if (!effectiveRatio) return; // protect against undefined

      const price = getFixedPrice(effectiveRatio);
      const B = recalculateFromCollateralFixed(collateralBigInt, leverageBigInt, price);
      const formatted = formatUnits(B, order?.baseAsset.decimals ?? 18);

      await setFieldValue("collateralAmount", collateralAmount, false);
      await setFieldValue("borrowAmount", formatted, false);
      await validateForm();
    },
    [order?.baseAsset.decimals, ratio, setFieldValue, validateForm, values.collateralToken],
  );

  const updateFromBorrow = useCallback(
    async (borrowAmount: string) => {
      const B = parseFloat(borrowAmount);
      if (borrowAmount === "") {
        await setFieldValue("borrowAmount", "");
        await setFieldValue("collateralAmount", "");
      }

      if (isNaN(B)) return;

      try {
        const borrowDecimals = order?.baseAsset?.decimals ?? 18;
        const collateralDecimals = values.collateralToken?.decimals ?? 18;

        const borrowFixed = parseUnits(B.toString(), borrowDecimals);
        const L_fixed = parseUnits(values.leverage?.toString() || "1", 18);

        if (ratio) {
          const priceFixed = parseUnits(toFixedWithoutExp(1 / ratio, 18), 18);
          const C = recalculateFromBorrowFixed(borrowFixed, L_fixed, priceFixed); // bigint

          const formattedCollateral = formatUnits(C, collateralDecimals);
          await setFieldValue("collateralAmount", formattedCollateral);
        }

        await setFieldValue("borrowAmount", B);
        await validateForm();
      } catch (err) {
        console.error("borrowAmount calc error:", err);
      }
    },
    [order, ratio, setFieldValue, validateForm, values.collateralToken?.decimals, values.leverage],
  );

  const getOracleRatio = useCallback(
    async (base: Token, collateral: Token): Promise<number | undefined> => {
      if (!publicClient || !order) return undefined;

      // same-asset: 1:1
      if (base.address0.toLowerCase() === collateral.address0.toLowerCase()) {
        setOraclePriceError(undefined);
        return 1;
      }

      const inputAmount = parseUnits("1", base.decimals); // 1 base unit
      console.log("Oracle address: " + order.oracle);
      console.log("Calling oracle with:", [base.address0, collateral.address0, inputAmount]);

      try {
        const outputAmount = await publicClient.readContract({
          address: order!.oracle,
          abi: ORACLE_ABI,
          functionName: "getAmountOut",
          args: [base.address0, collateral.address0, inputAmount],
        });

        console.log(outputAmount);

        if (!outputAmount) {
          throw new Error("Error getting price with oracle");
        }

        console.log("Oracle output:", outputAmount);
        // output/base
        setOraclePriceError(undefined);
        return getPrice(outputAmount as bigint, inputAmount);
      } catch (e) {
        setOraclePriceError("Oracle can't deliver price ratio");
        return undefined;
      }
    },
    [order, publicClient],
  );

  const minCollateralAmount = useMemo(() => {
    if (
      order?.minLoan &&
      order?.baseAsset?.decimals != null &&
      values.leverage &&
      values.collateralToken &&
      ratio
    ) {
      try {
        const borrowDecimals = order.baseAsset.decimals;
        const collateralDecimals = values.collateralToken.decimals ?? 18;

        const borrowFixed = BigInt(order.minLoan);
        const L_fixed = parseUnits(values.leverage.toString(), 18);
        const priceFixed = parseUnits(toFixedWithoutExp(1 / ratio, 18), 18);

        const C = recalculateFromBorrowFixed(borrowFixed, L_fixed, priceFixed);
        return formatUnits(C, collateralDecimals);
      } catch (err) {
        console.error("borrowAmount calc error:", err);
      }
    }
    return undefined;
  }, [order, ratio, values.leverage, values.collateralToken]);

  const {
    balance: { erc20Balance: token0Balance, erc223Balance: token1Balance },
    refetch: refetchBalance,
  } = useTokenBalances(values.collateralToken);

  const {
    balance: { erc20Balance: feeToken0Balance, erc223Balance: feeToken1Balance },
    refetch: refetchFeeTokenBalance,
  } = useTokenBalances(order?.liquidationRewardAsset);

  const { data: blockNumber } = useScopedBlockNumber();

  useEffect(() => {
    refetchBalance();
    refetchFeeTokenBalance();
  }, [blockNumber, refetchBalance, refetchFeeTokenBalance]);

  const getBalanceError = useMemo(() => {
    if (!values.collateralToken || !order) return undefined;

    const collateralToken = values.collateralToken;
    const collateralDecimals = collateralToken.decimals;
    const collateralRequired = parseUnits(values.collateralAmount || "0", collateralDecimals);
    const feeRequired = order.liquidationRewardAmount.value;

    const collateralBalance = token0Balance?.value;
    const feeBalance = feeToken0Balance?.value;

    const isSameToken = collateralToken.equals(order.liquidationRewardAsset);

    if (isSameToken) {
      if (!collateralBalance) return "Insufficient balance";
      const totalRequired = collateralRequired + feeRequired;
      if (collateralBalance < totalRequired) {
        return "Insufficient balance to cover fee and collateral";
      }
    } else {
      if (collateralBalance != null && collateralBalance < collateralRequired) {
        return "Insufficient balance to cover collateral";
      }
      if (feeBalance != null && feeBalance < feeRequired) {
        return "Insufficient balance to cover fee";
      }
    }

    return undefined;
  }, [
    feeToken0Balance?.value,
    order,
    token0Balance?.value,
    values.collateralAmount,
    values.collateralToken,
  ]);

  const [leverageInput, setLeverageInput] = useState(values.leverage?.toString() ?? "1.01");
  const [tokenForPortfolio, setTokenForPortfolio] = useState<Token | null>(null);
  const [oraclePriceError, setOraclePriceError] = useState<string | undefined>();

  const tokenLists = useTokenLists();

  const buttonText = useMemo(() => {
    if (!values.collateralToken) {
      return "Select collateral asset";
    }

    if (!values.collateralAmount) {
      return "Enter collateral amount";
    }

    if (getBalanceError) {
      return getBalanceError;
    }

    if (oraclePriceError) {
      return oraclePriceError;
    }

    return "Start borrowing now";
  }, [getBalanceError, oraclePriceError, values.collateralAmount, values.collateralToken]);

  const [formattedEndTime, setFormattedEndTime] = useState<string>("");

  useEffect(() => {
    if (!order) {
      return;
    }
    // initial calculation
    const calc = () => {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const endTimestamp = nowInSeconds + Number(order?.positionDuration);
      const formatted = timestampToDateString(endTimestamp, { withSeconds: true });
      setFormattedEndTime(formatted);
    };

    calc(); // call immediately after mount

    const interval = setInterval(() => {
      calc(); // recalculate every minute
    }, 60_000); // 60 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, [order, order?.positionDuration]);

  const [searchTradableTokenValue, setSearchTradableTokenValue] = useState("");
  //
  const [filteredTokens, isTokenFilterActive] = useMemo(() => {
    return searchTradableTokenValue
      ? [filterTokens(searchTradableTokenValue, order?.allowedTradingAssets || []), true]
      : [order?.allowedTradingAssets || [], false];
  }, [searchTradableTokenValue, order?.allowedTradingAssets]);

  useEffect(() => {
    (async () => {
      if (!order?.baseAsset || !values.collateralToken) return;
      const r = await getOracleRatio(order.baseAsset.wrapped, values.collateralToken.wrapped);
      console.log("Ratio from effect: " + r);
      if (r !== undefined) setRatio(r);
    })();
  }, [chainId, order, values.collateralToken, getOracleRatio]);

  if (loading || !order) {
    return "Loading...";
  }

  return (
    <Container>
      <div
        className={clsx(
          "grid py-4 lg:py-[40px] grid-cols-1 mx-auto",
          showRecentTransactions
            ? "xl:grid-cols-[580px_600px] xl:max-w-[1200px] gap-4 xl:grid-areas-[left_right] grid-areas-[right,left]"
            : "xl:grid-cols-[600px] xl:max-w-[600px] grid-areas-[right]",
        )}
      >
        <div className="grid-in-[left] flex justify-center">
          <div className="w-full sm:max-w-[600px] xl:max-w-full">
            <RecentTransactions
              showRecentTransactions={showRecentTransactions}
              handleClose={() => setShowRecentTransactions(false)}
              store={useSwapRecentTransactionsStore}
            />
          </div>
        </div>

        <div className="flex justify-center grid-in-[right]">
          <div className="flex flex-col gap-4 md:gap-6 lg:gap-5 w-full sm:max-w-[600px] xl:max-w-full">
            <div className="card-spacing pt-2.5 bg-primary-bg rounded-5 grid gap-3">
              <div className="mb-2.5 flex justify-between items-center -mx-3">
                <IconButton
                  variant={IconButtonVariant.BACK}
                  iconSize={IconSize.REGULAR}
                  buttonSize={IconButtonSize.LARGE}
                  onClick={() => {
                    window.history.back();
                  }}
                />
                <h3 className="font-bold text-20">Borrow</h3>
                <IconButton
                  buttonSize={IconButtonSize.LARGE}
                  active={showRecentTransactions}
                  iconName="recent-transactions"
                  onClick={() => setShowRecentTransactions(!showRecentTransactions)}
                />
              </div>

              {order.oracle.toLowerCase() === ORACLE_ADDRESS[chainId].toLowerCase() ? (
                <div className="flex justify-between shadow px-4 py-3 rounded-3 mb-2 bg-tertiary-bg">
                  <div className="flex items-center gap-1">
                    <Svg iconName="done" className="text-green" />
                    Price oracle:
                  </div>
                  <span className="flex items-center gap-1 rounded-3">
                    Default DEX223 Oracle <Tooltip text="Tooltip text" />
                  </span>
                </div>
              ) : (
                <div className="flex justify-between shadow shadow-red-light px-4 py-3 rounded-3 bg-red-bg mb-2">
                  <div className="flex items-center gap-1">
                    <Svg iconName="warning" className="text-red-light" />
                    Price oracle:
                  </div>
                  <span className="text-red-light flex items-center gap-1 rounded-3 ">
                    Unknown oracle <Svg iconName="info" />
                  </span>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="bg-tertiary-bg rounded-3 p-5 mb-4">
                  <LendingOrderTokenSelect
                    allowedErc223={Boolean(
                      order.collateralAddresses.find(
                        (add) =>
                          add.toLowerCase() ===
                          values.collateralToken?.wrapped.address1.toLowerCase(),
                      ),
                    )}
                    label="Collateral amount"
                    token={values.collateralToken}
                    setToken={async (token: Currency) => {
                      await setFieldValue("collateralToken", token);

                      try {
                        // fetch fresh ratio right away and store it
                        if (order?.baseAsset) {
                          const r = await getOracleRatio(order.baseAsset.wrapped, token.wrapped);
                          console.log("Ratio from token change: " + r);

                          if (r !== undefined) setRatio(r);

                          // if we already have inputs, recompute borrow using the fresh ratio
                          if (values.collateralAmount && values.leverage && r !== undefined) {
                            await updateFromCollateral(
                              values.collateralAmount.toString(),
                              values.leverage.toString(),
                              r,
                            );
                          }
                        }
                      } catch (error) {
                        console.log(error);
                      }
                    }}
                    amount={values.collateralAmount}
                    setAmount={async (collateralAmount: string) => {
                      try {
                        await updateFromCollateral(
                          collateralAmount.toString(),
                          values.leverage.toString(),
                        );
                      } catch (err) {
                        console.error("Error in setAmount:", err);
                      }
                    }}
                    standard={values.collateralTokenStandard}
                    setStandard={async (standard: Standard) => {
                      await setFieldValue("collateralTokenStandard", standard);
                    }}
                    errors={getTokenOrAmountError({
                      touchedAmount: touched.collateralAmount,
                      touchedToken: touched.collateralToken,
                      tokenError: errors.collateralToken,
                      amountError: errors.collateralAmount,
                    })}
                    tokens={order.allowedCollateralAssets}
                    helperText={
                      minCollateralAmount
                        ? `Min collateral amount: ${minCollateralAmount} ${values.collateralToken?.symbol}`
                        : undefined
                    }
                  />

                  <InputLabel label="Leverage" tooltipText="Tooltip text" />
                  <div className="flex items-center gap-2">
                    <div className="mb-4 flex-grow">
                      <input
                        min={1}
                        max={order.leverage}
                        value={values.leverage}
                        onChange={async (e) => {
                          let input = e.target.value.trim();
                          let L = parseFloat(input);

                          if (isNaN(L)) {
                            L = 1.01;
                          }

                          // Clamp leverage
                          if (L < 1.01) L = 1.01;
                          if (L > order.leverage) L = order.leverage;

                          try {
                            await setFieldValue("leverage", L, false);
                            setLeverageInput(L.toString());
                            await updateFromCollateral(values.collateralAmount, L.toString());
                          } catch (err) {
                            console.error("Leverage parse error:", err);
                          }
                        }}
                        step={1}
                        type="range"
                        className="mb-1.5 w-full"
                        style={{
                          backgroundImage: `linear-gradient(to right, #7DA491 0%, #7DA491 ${((+values.leverage - 1) / (order.leverage - 1)) * 100}%, #0F0F0F ${values?.leverage}%, #0F0F0F 100%)`,
                        }}
                      />

                      <div className="z-10 relative text-12 text-secondary-text px-[13px]">
                        <div className="relative">
                          {getMarks(order.leverage).map((_, i) => (
                            <span
                              key={_}
                              className={clsx(
                                "min-w-[28px] flex justify-center absolute before:h-3 before:w-0.5 before:absolute before:left-1/2 before:-top-[16px] before:-translate-x-1/2 before:pointer-events-none -translate-x-1/2",
                                +values.leverage <= _
                                  ? "before:bg-quaternary-bg"
                                  : "before:bg-green-hover",
                              )}
                              style={{ left: `${((_ - 1) / (order.leverage - 1)) * 100}%` }}
                            >
                              {_}x
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Input
                      max={order.leverage}
                      className="w-[111px]"
                      value={leverageInput}
                      onChange={(e) => {
                        setLeverageInput(e.target.value); // do not validate yet
                      }}
                      onBlur={async (e) => {
                        let input = e.target.value.trim();
                        let L = parseFloat(input);

                        if (isNaN(L)) {
                          L = 1.01;
                        }

                        // Clamp leverage
                        if (L < 1.01) L = 1.01;
                        if (L > order.leverage) L = order.leverage;

                        try {
                          await setFieldValue("leverage", L, false);
                          setLeverageInput(L.toString());
                          await updateFromCollateral(values.collateralAmount, L.toString());
                        } catch (err) {
                          console.error("Leverage parse error:", err);
                        }
                      }}
                    />
                  </div>
                </div>
                {oraclePriceError && (
                  <div className="pb-4">
                    <Alert text={oraclePriceError} type="error" />
                  </div>
                )}

                <TextField
                  placeholder="Enter borrow amount"
                  label="I want to borrow"
                  helperText={
                    <span>
                      <span>Min / Max available:</span>{" "}
                      <span className="text-secondary-text">
                        {formatUnits(order.minLoan, order.baseAsset.decimals ?? 18)} /{" "}
                        {formatUnits(order.balance, order.baseAsset.decimals ?? 18)}{" "}
                        {order.baseAsset.symbol}
                      </span>
                    </span>
                  }
                  internalText={order.baseAsset.symbol}
                  value={values.borrowAmount}
                  onChange={async (e) => {
                    await updateFromBorrow(e.target.value.trim());
                  }}
                  error={touched.borrowAmount && errors.borrowAmount}
                />

                <div className="my-4">
                  <InputLabel
                    label="Total liquidation fee"
                    inputSize={InputSize.LARGE}
                    tooltipText="Tooltip text"
                  />
                  <div className="flex justify-between items-center bg-tertiary-bg py-3 px-5 rounded-3">
                    <div className="flex items-center gap-2">
                      <Image src="/images/tokens/placeholder.svg" alt="" width={24} height={24} />
                      {order?.liquidationRewardAmount.formatted}{" "}
                      {order.liquidationRewardAsset.symbol}
                    </div>

                    {order.liquidationRewardAsset?.isNative ? (
                      <Badge color="green" text={"Native"} />
                    ) : (
                      <Badge
                        variant={BadgeVariant.STANDARD}
                        standard={order.liquidationRewardAssetStandard}
                      />
                    )}
                  </div>
                  <HelperText helperText="Liquidation fee (Borrower + Lender)" />
                </div>

                <div className="rounded-3 bg-tertiary-bg justify-between flex px-5 py-3 mb-5">
                  <span className="text-tertiary-text">
                    Lending order id: <span className="text-secondary-text">{orderId}</span>
                  </span>
                  <ExternalTextLink
                    text="View details"
                    href={`/${locale}/margin-trading/lending-order/${orderId}`}
                  />
                </div>
                <GasSettingsBlock />
                {/*<pre>{JSON.stringify(errors, null, 2)}</pre>*/}

                <Button
                  type="submit"
                  fullWidth
                  disabled={
                    !!getBalanceError ||
                    !values.collateralToken ||
                    !values.collateralAmount ||
                    !!oraclePriceError
                  }
                >
                  {buttonText}
                </Button>

                <ReviewBorrowDialog orderId={orderId} order={order} />

                <div className="rounded-3 bg-tertiary-bg mt-4">
                  <button
                    type="button"
                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    className="flex justify-between px-5 py-3 text-secondary-text w-full"
                  >
                    Borrow details
                    <Svg
                      iconName="small-expand-arrow"
                      className={clsx("duration-200", isDetailsExpanded ? "-rotate-180" : "")}
                    />
                  </button>
                  <Collapse open={isDetailsExpanded}>
                    <div className="flex flex-col gap-2 mb-5 px-5 pb-5">
                      <LendingOrderDetailsRow
                        title="Interest rate per month"
                        value={order.interestRate / 100 + "%"}
                        tooltipText="Tooltip text"
                      />
                      <LendingOrderDetailsRow
                        title="Interest rate for the entire period"
                        value={calculatePeriodInterestRate(
                          order.interestRate,
                          order.positionDuration,
                        )}
                        tooltipText="Tooltip text"
                      />
                      <LendingOrderDetailsRow
                        title="Max leverage"
                        value={`${order.leverage}x`}
                        tooltipText="Tooltip text"
                      />
                      <LendingOrderDetailsRow
                        title="Leverage"
                        value={`${values.leverage}x`}
                        tooltipText="Tooltip text"
                      />
                      <LendingOrderDetailsRow
                        title="Duration"
                        value={`${order.positionDuration / 24 / 60 / 60} days`}
                        tooltipText="Tooltip text"
                      />
                      <LendingOrderDetailsRow
                        title="Deadline"
                        value={formattedEndTime}
                        tooltipText="Tooltip text"
                      />

                      <LendingOrderDetailsRow
                        title="Order currency limit"
                        value={order.currencyLimit}
                        tooltipText="Tooltip text"
                      />

                      <LendingOrderDetailsRow
                        title="May initiate liquidation"
                        value={"Anyone"}
                        tooltipText="Tooltip text"
                      />

                      <LendingOrderDetailsRow
                        title="Liquidation price source"
                        value={
                          <ExternalTextLink
                            text="Dex223 Market"
                            href={getExplorerLink(
                              ExplorerLinkType.ADDRESS,
                              ORACLE_ADDRESS[chainId],
                              chainId,
                            )}
                          />
                        }
                        tooltipText="Tooltip text"
                      />

                      <div className="bg-primary-bg rounded-3 px-5 pb-5 pt-3">
                        <div className="flex justify-between mb-3 items-center">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-tertiary-text flex items-center gap-1 text-14">
                              <Tooltip text="Tooltip text" iconSize={20} />
                              Tokens allowed for trading
                            </h3>
                          </div>
                          <div>
                            <SearchInput
                              value={searchTradableTokenValue}
                              onChange={(e) => setSearchTradableTokenValue(e.target.value)}
                              placeholder="Token name"
                              className="h-8 text-14 w-[180px] rounded-2"
                            />
                          </div>
                        </div>

                        {!!filteredTokens.length && (
                          <SimpleBar style={{ maxHeight: 216 }}>
                            <div className="flex gap-1 flex-wrap">
                              {filteredTokens.map((tradingToken) => {
                                return tradingToken.isToken ? (
                                  <button
                                    key={tradingToken.address0}
                                    onClick={() =>
                                      setTokenForPortfolio(
                                        new Token(
                                          chainId,
                                          tradingToken.address0,
                                          tradingToken.address1,
                                          +tradingToken.decimals,
                                          tradingToken.symbol,
                                          tradingToken.name,
                                          "/images/tokens/placeholder.svg",
                                          tokenLists
                                            ?.filter((tokenList) => {
                                              return !!tokenList.list.tokens.find(
                                                (t) =>
                                                  t.address0.toLowerCase() ===
                                                  tradingToken.address0.toLowerCase(),
                                              );
                                            })
                                            .map((t) => t.id),
                                        ),
                                      )
                                    }
                                    className="bg-quaternary-bg text-secondary-text px-2 py-1 rounded-2 hocus:bg-green-bg duration-200"
                                  >
                                    {tradingToken.symbol}
                                  </button>
                                ) : (
                                  <div className="rounded-2 text-secondary-text border border-secondary-border px-2 flex items-center py-1">
                                    {tradingToken.symbol}
                                  </div>
                                );
                              })}
                            </div>
                          </SimpleBar>
                        )}
                        {!filteredTokens.length && searchTradableTokenValue && (
                          <div className="rounded-5 h-[100px] -mt-5 flex items-center justify-center text-secondary-text bg-empty-not-found-token bg-no-repeat bg-right-top bg-[length:64px_64px] -mr-5">
                            Token not found
                          </div>
                        )}
                      </div>
                    </div>
                  </Collapse>
                </div>
              </form>

              {/*<NetworkFeeConfigDialog*/}
              {/*  isAdvanced={isAdvanced}*/}
              {/*  setIsAdvanced={setIsAdvanced}*/}
              {/*  estimatedGas={estimatedGas}*/}
              {/*  setEstimatedGas={setEstimatedGas}*/}
              {/*  gasPriceSettings={gasPriceSettings}*/}
              {/*  gasPriceOption={gasPriceOption}*/}
              {/*  customGasLimit={customGasLimit}*/}
              {/*  setCustomGasLimit={setCustomGasLimit}*/}
              {/*  setGasPriceOption={setGasPriceOption}*/}
              {/*  setGasPriceSettings={setGasPriceSettings}*/}
              {/*  isOpen={isOpenedFee}*/}
              {/*  setIsOpen={setIsOpenedFee}*/}
              {/*/>*/}
              <DrawerDialog
                isOpen={!!tokenForPortfolio}
                setIsOpen={() => setTokenForPortfolio(null)}
              >
                <DialogHeader
                  onClose={() => setTokenForPortfolio(null)}
                  title={tokenForPortfolio?.name || "Unknown"}
                />
                {tokenForPortfolio ? (
                  <TokenPortfolioDialogContent token={tokenForPortfolio} />
                ) : null}
              </DrawerDialog>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
