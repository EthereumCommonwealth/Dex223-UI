import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect } from "react";

import { useRefreshTicksDataStore } from "@/app/[locale]/add/stores/useRefreshTicksDataStore";
import { useZoomStateStore } from "@/app/[locale]/add/stores/useZoomStateStore";
import Svg from "@/components/atoms/Svg";
import IconButton, { IconButtonVariant } from "@/components/buttons/IconButton";
import { tryParseTick } from "@/functions/tryParseTick";
import { usePool } from "@/hooks/usePools";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { Price } from "@/sdk_hybrid/entities/fractions/price";
import { Token } from "@/sdk_hybrid/entities/token";

import { useRangeHopCallbacks } from "../../hooks/useRangeHopCallbacks";
import { useAddLiquidityTokensStore } from "../../stores/useAddLiquidityTokensStore";
import { useLiquidityPriceRangeStore } from "../../stores/useLiquidityPriceRangeStore";
import { useLiquidityTierStore } from "../../stores/useLiquidityTierStore";
import { CurrentPrice } from "./CurrentPrice";
import LiquidityChartRangeInput from "./LiquidityChartRangeInput";
import { Bound } from "./LiquidityChartRangeInput/types";
import { PriceRangeHeader } from "./PriceRangeHeader";
import PriceRangeInput from "./PriceRangeInput";

export const PriceRange = ({
  noLiquidity,
  formattedPrice,
  invertPrice,
  isFullRange,
  isSorted,
  leftPrice,
  price,
  pricesAtTicks,
  rightPrice,
  tickSpaceLimits,
  ticksAtLimit,
  token0,
  token1,
  outOfRange,
  isFormDisabled,
}: {
  noLiquidity: boolean;
  price: Price<Token, Token> | undefined;
  formattedPrice: string | number;
  invertPrice: boolean;
  pricesAtTicks: {
    LOWER: Price<Token, Token> | undefined;
    UPPER: Price<Token, Token> | undefined;
  };
  ticksAtLimit: {
    LOWER: boolean;
    UPPER: boolean;
  };
  isSorted: boolean | undefined;
  isFullRange: boolean;
  leftPrice: Price<Token, Token> | undefined;
  rightPrice: Price<Token, Token> | undefined;
  token0: Currency | undefined;
  token1: Currency | undefined;
  tickSpaceLimits: {
    LOWER: number | undefined;
    UPPER: number | undefined;
  };
  outOfRange: boolean;
  isFormDisabled: boolean;
}) => {
  const t = useTranslations("Liquidity");
  const { tokenA, tokenB, setBothTokens } = useAddLiquidityTokensStore();
  const { setZoomIn, setZoomOut, setZoomInitial } = useZoomStateStore();
  const { setRefreshTicksTrigger } = useRefreshTicksDataStore();
  const {
    ticks,
    leftRangeTypedValue,
    rightRangeTypedValue,
    startPriceTypedValue,
    clearPriceRange,
    setFullRange,
    setLeftRangeTypedValue,
    setRightRangeTypedValue,
    setStartPriceTypedValue,
    resetPriceRangeValue,
    setTicks,
  } = useLiquidityPriceRangeStore();
  const { tier } = useLiquidityTierStore();
  const [, pool] = usePool({
    currencyA: tokenA,
    currencyB: tokenB,
    tier,
  });
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks;

  const handleSetFullRange = useCallback(() => {
    if (!isFullRange) {
      setFullRange();
    } else {
      const currentPrice = price
        ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8))
        : undefined;
      resetPriceRangeValue({
        price: currentPrice,
        feeAmount: tier,
      });
    }
  }, [setFullRange, isFullRange, resetPriceRangeValue, price, invertPrice, tier]);

  useEffect(() => {
    if (!isFullRange) {
      const currentPrice = price
        ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8))
        : undefined;

      resetPriceRangeValue({
        price: currentPrice,
        feeAmount: tier,
      });
    }
  }, [price, invertPrice, isFullRange, resetPriceRangeValue, tier]);

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper } =
    useRangeHopCallbacks(
      tokenA ?? undefined,
      tokenB ?? undefined,
      tier,
      ticks.LOWER,
      ticks.UPPER,
      pool,
    );

  // TODO existingPosition
  const existingPosition = undefined as any;

  // parse typed range values and determine the closest ticks
  // lower should always be a smaller tick
  useEffect(() => {
    setTicks({
      [Bound.LOWER]:
        typeof existingPosition?.tickLower === "number"
          ? existingPosition.tickLower
          : (invertPrice && typeof rightRangeTypedValue === "boolean") ||
              (!invertPrice && typeof leftRangeTypedValue === "boolean")
            ? tickSpaceLimits[Bound.LOWER]
            : invertPrice
              ? tryParseTick(
                  token1?.wrapped,
                  token0?.wrapped,
                  tier,
                  rightRangeTypedValue.toString(),
                )
              : tryParseTick(
                  token0?.wrapped,
                  token1?.wrapped,
                  tier,
                  leftRangeTypedValue.toString(),
                ),
      [Bound.UPPER]:
        typeof existingPosition?.tickUpper === "number"
          ? existingPosition.tickUpper
          : (!invertPrice && typeof rightRangeTypedValue === "boolean") ||
              (invertPrice && typeof leftRangeTypedValue === "boolean")
            ? tickSpaceLimits[Bound.UPPER]
            : invertPrice
              ? tryParseTick(token1?.wrapped, token0?.wrapped, tier, leftRangeTypedValue.toString())
              : tryParseTick(
                  token0?.wrapped,
                  token1?.wrapped,
                  tier,
                  rightRangeTypedValue.toString(),
                ),
    });
  }, [
    existingPosition,
    tier,
    invertPrice,
    leftRangeTypedValue,
    rightRangeTypedValue,
    token0,
    token1,
    tickSpaceLimits,
    setTicks,
  ]);

  return (
    <div
      className={clsx(
        "flex flex-col gap-3 bg-tertiary-bg px-4 lg:px-5 py-3 lg:py-4 rounded-3 md:max-h-[840px]",
        isFormDisabled && "opacity-20",
      )}
    >
      <PriceRangeHeader
        isSorted={!!isSorted}
        isFullRange={isFullRange}
        button0Text={isSorted ? tokenA?.symbol : tokenB?.symbol}
        button0Handler={() => {
          if (!isSorted) {
            setBothTokens({
              tokenA: tokenB,
              tokenB: tokenA,
            });
            if (startPriceTypedValue) clearPriceRange();
          }
        }}
        button1Text={isSorted ? tokenB?.symbol : tokenA?.symbol}
        button1Handler={() => {
          if (isSorted) {
            setBothTokens({
              tokenA: tokenB,
              tokenB: tokenA,
            });
            if (startPriceTypedValue) clearPriceRange();
          }
        }}
        handleSetFullRange={handleSetFullRange}
      />
      <PriceRangeInput
        value={
          ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER]
            ? "0"
            : leftPrice?.toSignificant(8) ?? "0"
        }
        onUserInput={setLeftRangeTypedValue}
        title={t("low_price")}
        decrement={isSorted ? getDecrementLower : getIncrementUpper}
        increment={isSorted ? getIncrementLower : getDecrementUpper}
        tokenA={tokenA}
        tokenB={tokenB}
        noLiquidity={noLiquidity}
      />
      <PriceRangeInput
        title={t("high_price")}
        value={
          ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER]
            ? "∞"
            : rightPrice?.toSignificant(8) ?? "0"
        }
        onUserInput={setRightRangeTypedValue}
        decrement={isSorted ? getDecrementUpper : getIncrementLower}
        increment={isSorted ? getIncrementUpper : getDecrementLower}
        tokenA={tokenA}
        tokenB={tokenB}
        noLiquidity={noLiquidity}
      />
      {outOfRange ? (
        <span className="text-14 border border-orange rounded-3 px-4 py-2 bg-orange-bg">
          {t("not_earn_fee_message")}
        </span>
      ) : null}

      {noLiquidity ? (
        <>
          <div className="flex px-5 py-3 bg-blue-bg border-blue border rounded-3 gap-2">
            <Svg iconName="info" className="min-w-[24px] text-blue" />
            <span className="text-14 text-secondary-text">{t("init_pool_message")}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-16 text-secondary-text">{t("starting_price")}</span>
            <input
              className="placeholder:text-tertiary-text outline-0 text-16 w-full rounded-3 bg-secondary-bg px-5 py-3 border border-transparent hocus:shadow hocus:shadow-green/60 focus:border-green focus:shadow focus:shadow-green/60"
              placeholder="0"
              type="text"
              value={startPriceTypedValue}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d*$/.test(value)) {
                  setStartPriceTypedValue(value);
                }
              }}
            />
            <div className="flex justify-between text-12 text-tertiary-text">
              <span>{`${t("token_starting_price", { symbol: tokenA?.symbol })}:`}</span>
              <span>{`${formattedPrice} ${tokenA ? `${tokenB?.symbol} per ${tokenA?.symbol}` : ""}`}</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex w-full flex-row mt-1">
            <CurrentPrice
              price={formattedPrice}
              description={tokenA ? `${tokenB?.symbol} per ${tokenA?.symbol}` : ""}
            />
            <div className="ml-auto flex-col mt-1">
              <div
                onClick={() => {
                  setRefreshTicksTrigger(true);
                  setZoomInitial(true);
                }}
                className="flex mb-1 gap-2 text-12 cursor-pointer text-secondary-text hocus:text-green justify-end items-center w-100"
              >
                {t("refresh")}
                <Svg
                  size={20}
                  iconName="reset"
                  // className="text-tertiary-text group-hocus:text-green mr-1 flex-shrink-0"
                />
              </div>
              <div className="ml-auto flex gap-2 justify-end items-center w-100 ">
                <IconButton
                  variant={IconButtonVariant.CONTROL}
                  buttonSize={32}
                  iconSize={24}
                  iconName="zoom-in"
                  className="bg-tertiary-bg"
                  onClick={() => setZoomIn(true)}
                />
                <IconButton
                  variant={IconButtonVariant.CONTROL}
                  buttonSize={32}
                  iconName="zoom-out"
                  className="bg-tertiary-bg"
                  onClick={() => setZoomOut(true)}
                />
              </div>
            </div>
          </div>
          <LiquidityChartRangeInput
            currencyA={tokenA ?? undefined}
            currencyB={tokenB ?? undefined}
            feeAmount={tier}
            ticksAtLimit={ticksAtLimit}
            price={
              price
                ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8))
                : undefined
            }
            priceLower={priceLower}
            priceUpper={priceUpper}
            // interactive={!hasExistingPosition}
            onLeftRangeInput={setLeftRangeTypedValue}
            onRightRangeInput={setRightRangeTypedValue}
            interactive={true}
          />
        </>
      )}
    </div>
  );
};
