import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import LiquidityChartRangeInput from "@/app/[locale]/add/components/PriceRange/LiquidityChartRangeInput";
import { ZOOM_LEVELS } from "@/app/[locale]/add/hooks/types";
import { useDerivedTokens } from "@/app/[locale]/add/hooks/useDerivedTokens";
import { useRefreshTicksDataStore } from "@/app/[locale]/add/stores/useRefreshTicksDataStore";
import { useZoomStateStore } from "@/app/[locale]/add/stores/useZoomStateStore";
import Svg from "@/components/atoms/Svg";
import IconButton, { IconButtonVariant } from "@/components/buttons/IconButton";
import { getTickToPrice, tryParseTick } from "@/functions/tryParseTick";
import { usePool } from "@/hooks/usePools";
import { FeeAmount } from "@/sdk_bi/constants";
import { Price } from "@/sdk_bi/entities/fractions/price";
import { Token } from "@/sdk_bi/entities/token";

import { useRangeHopCallbacks } from "../../hooks/useRangeHopCallbacks";
import { useAddLiquidityTokensStore } from "../../stores/useAddLiquidityTokensStore";
import { useLiquidityPriceRangeStore } from "../../stores/useLiquidityPriceRangeStore";
import { useLiquidityTierStore } from "../../stores/useLiquidityTierStore";
import { CurrentPrice } from "./CurrentPrice";
import { Bound } from "./LiquidityChartRangeInput/types";
import { PriceRangeHeader } from "./PriceRangeHeader";
import PriceRangeInput from "./PriceRangeInput";

export const PriceRange = ({
  noLiquidity,
  formattedPrice,
  price,
  ticksAtLimit,
  outOfRange,
  isFormDisabled,
  tickSpaceLimits,
}: {
  noLiquidity: boolean;
  price: Price<Token, Token> | undefined;
  formattedPrice: string | number;
  pricesAtTicks: {
    LOWER: Price<Token, Token> | undefined;
    UPPER: Price<Token, Token> | undefined;
  };
  ticksAtLimit: {
    LOWER: boolean;
    UPPER: boolean;
  };
  leftPrice: Price<Token, Token> | undefined;
  rightPrice: Price<Token, Token> | undefined;
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
    startPriceTypedValue,
    setLeftRangeTypedValue,
    setRightRangeTypedValue,
    setStartPriceTypedValue,
    setTicks,
  } = useLiquidityPriceRangeStore();
  const { tier } = useLiquidityTierStore();
  const [, pool] = usePool({
    currencyA: tokenA,
    currencyB: tokenB,
    tier,
  });
  const { baseToken, quoteToken, invertPrice, toggleInvertPrice } = useDerivedTokens();

  const initializePriceRangeWithZoom = useCallback(
    ({
      price,
      feeAmount,
      baseToken,
      quoteToken,
    }: {
      price?: number;
      feeAmount: FeeAmount;
      baseToken?: Token;
      quoteToken?: Token;
    }) => {
      if (!price || !baseToken || !quoteToken) return;

      const zoom = ZOOM_LEVELS[feeAmount];
      const left = (price * zoom.initialMin).toFixed(8);
      const right = (price * zoom.initialMax).toFixed(8);

      setLeftRangeTypedValue(left);
      setRightRangeTypedValue(right);

      const [token0, token1] =
        baseToken && quoteToken
          ? baseToken.sortsBefore(quoteToken)
            ? [baseToken, quoteToken]
            : [quoteToken, baseToken]
          : [undefined, undefined];

      const lowerTick = tryParseTick(token0, token1, feeAmount, left);
      const upperTick = tryParseTick(token0, token1, feeAmount, right);

      if (lowerTick !== undefined || upperTick !== undefined) {
        setTicks({
          ...(lowerTick !== undefined && { [Bound.LOWER]: lowerTick }),
          ...(upperTick !== undefined && { [Bound.UPPER]: upperTick }),
        });
      }

      // resetUserModified(); // Optional
    },
    [setLeftRangeTypedValue, setRightRangeTypedValue, setTicks],
  );

  const isFullRange = useMemo(() => {
    return (
      tickSpaceLimits.UPPER === ticks[Bound.UPPER] && tickSpaceLimits.LOWER === ticks[Bound.LOWER]
    );
  }, [ticks, tickSpaceLimits]);

  const handleSetFullRange = useCallback(() => {
    if (!isFullRange) {
      setTicks({
        [Bound.LOWER]: tickSpaceLimits.LOWER,
        [Bound.UPPER]: tickSpaceLimits.UPPER,
      });
    } else {
      if (price !== undefined && baseToken && quoteToken && tier !== undefined) {
        initializePriceRangeWithZoom({
          price: parseFloat(price.toSignificant(8)),
          feeAmount: tier,
          baseToken: baseToken.wrapped,
          quoteToken: quoteToken.wrapped,
        });
      }
    }
  }, [
    isFullRange,
    setTicks,
    tickSpaceLimits.LOWER,
    tickSpaceLimits.UPPER,
    price,
    baseToken,
    quoteToken,
    tier,
    initializePriceRangeWithZoom,
  ]);

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper } =
    useRangeHopCallbacks(
      tokenA ?? undefined,
      tokenB ?? undefined,
      tier,
      ticks.LOWER,
      ticks.UPPER,
      pool,
    );

  const handleBlur = (
    side: "left" | "right",
    value: string,
    baseToken?: Token,
    quoteToken?: Token,
  ) => {
    if (!tier || !baseToken || !quoteToken) return;

    const parsedTick = tryParseTick(baseToken, quoteToken, tier, value);

    if (parsedTick !== undefined) {
      setTicks({
        [side === "left" ? Bound.LOWER : Bound.UPPER]: parsedTick,
      });
    }
  };

  useEffect(() => {
    if (price !== undefined && baseToken && quoteToken && tier !== undefined) {
      initializePriceRangeWithZoom({
        price: parseFloat(price.toSignificant(8)),
        feeAmount: tier,
        baseToken: baseToken.wrapped,
        quoteToken: quoteToken.wrapped,
      });
    }
  }, [price, baseToken, quoteToken, tier, initializePriceRangeWithZoom]);

  const isInverted = invertPrice;

  // Prices:
  const priceLower = getTickToPrice(baseToken?.wrapped, quoteToken?.wrapped, ticks[Bound.LOWER]);
  const priceUpper = getTickToPrice(baseToken?.wrapped, quoteToken?.wrapped, ticks[Bound.UPPER]);

  const inputTopValue = isInverted ? priceUpper : priceLower;
  const inputBottomValue = isInverted ? priceLower : priceUpper;

  // Handlers:
  const inputTopSetter = isInverted ? setRightRangeTypedValue : setLeftRangeTypedValue;
  const inputBottomSetter = isInverted ? setLeftRangeTypedValue : setRightRangeTypedValue;

  const inputTopBlur = (value: string) =>
    handleBlur(isInverted ? "right" : "left", value, baseToken?.wrapped, quoteToken?.wrapped);

  const inputBottomBlur = (value: string) =>
    handleBlur(isInverted ? "left" : "right", value, baseToken?.wrapped, quoteToken?.wrapped);

  const incrementTopInput = useCallback(() => {
    const value = isInverted ? getDecrementUpper() : getIncrementLower();
    const tick = tryParseTick(tokenA?.wrapped, tokenB?.wrapped, tier, value);
    if (tick !== undefined) {
      setTicks({
        [isInverted ? Bound.UPPER : Bound.LOWER]: tick, // or UPPER depending on which input
      });
    }
  }, [
    getDecrementUpper,
    getIncrementLower,
    isInverted,
    setTicks,
    tier,
    tokenA?.wrapped,
    tokenB?.wrapped,
  ]);

  const decrementTopInput = useCallback(() => {
    const value = isInverted ? getIncrementUpper() : getDecrementLower();
    const tick = tryParseTick(tokenA?.wrapped, tokenB?.wrapped, tier, value);
    if (tick !== undefined) {
      setTicks({
        [isInverted ? Bound.UPPER : Bound.LOWER]: tick, // or UPPER depending on which input
      });
    }
  }, [
    getDecrementLower,
    getIncrementUpper,
    isInverted,
    setTicks,
    tier,
    tokenA?.wrapped,
    tokenB?.wrapped,
  ]);

  const incrementBottomInput = useCallback(() => {
    const value = isInverted ? getDecrementLower() : getIncrementUpper();

    const tick = tryParseTick(tokenA?.wrapped, tokenB?.wrapped, tier, value);
    if (tick !== undefined) {
      setTicks({
        [isInverted ? Bound.LOWER : Bound.UPPER]: tick, // or UPPER depending on which input
      });
    }
  }, [
    getDecrementLower,
    getIncrementUpper,
    isInverted,
    setTicks,
    tier,
    tokenA?.wrapped,
    tokenB?.wrapped,
  ]);

  const decrementBottomInput = useCallback(() => {
    const value = isInverted ? getIncrementLower() : getDecrementUpper();

    const tick = tryParseTick(tokenA?.wrapped, tokenB?.wrapped, tier, value);
    if (tick !== undefined) {
      setTicks({
        [isInverted ? Bound.LOWER : Bound.UPPER]: tick, // or UPPER depending on which input
      });
    }
  }, [
    getDecrementUpper,
    getIncrementLower,
    isInverted,
    setTicks,
    tier,
    tokenA?.wrapped,
    tokenB?.wrapped,
  ]);

  return (
    <div
      className={clsx(
        "flex flex-col gap-3 bg-tertiary-bg px-4 lg:px-5 py-3 lg:py-4 rounded-3",
        isFormDisabled && "opacity-20",
      )}
    >
      <PriceRangeHeader
        isFullRange={isFullRange}
        handleSetFullRange={handleSetFullRange}
        baseSymbol={baseToken?.symbol}
        quoteSymbol={quoteToken?.symbol}
        invertPrice={invertPrice}
        onFlip={toggleInvertPrice}
      />
      <PriceRangeInput
        title={t("low_price")}
        value={ticksAtLimit[Bound.LOWER] ? "0" : (inputTopValue?.toSignificant(8) ?? "0")}
        onUserInput={inputTopSetter}
        decrement={decrementTopInput}
        increment={incrementTopInput}
        tokenA={baseToken}
        tokenB={quoteToken}
        noLiquidity={noLiquidity}
        handleBlur={inputTopBlur}
      />

      <PriceRangeInput
        title={t("high_price")}
        value={ticksAtLimit[Bound.UPPER] ? "∞" : (inputBottomValue?.toSignificant(8) ?? "0")}
        onUserInput={inputBottomSetter}
        decrement={decrementBottomInput}
        increment={incrementBottomInput}
        tokenA={baseToken}
        tokenB={quoteToken}
        noLiquidity={noLiquidity}
        handleBlur={inputBottomBlur}
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
              aria-label={t("starting_price")}
              value={startPriceTypedValue}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d*$/.test(value)) {
                  setStartPriceTypedValue(value);
                }
              }}
            />
            <div className="flex justify-between text-12 text-tertiary-text">
              <span>{`${t("token_starting_price", { symbol: baseToken?.symbol })}:`}</span>
              <span>
                {formattedPrice !== "-" && baseToken && quoteToken
                  ? `${formattedPrice} ${quoteToken.symbol} = 1 ${baseToken.symbol}`
                  : ""}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex w-full flex-row mt-1">
            <CurrentPrice
              price={formattedPrice}
              description={
                formattedPrice !== "-" && baseToken && quoteToken
                  ? `${quoteToken.symbol} = 1 ${baseToken.symbol}`
                  : ""
              }
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
            currencyA={tokenA}
            currencyB={tokenB}
            feeAmount={tier}
            ticksAtLimit={ticksAtLimit}
            price={
              price
                ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8))
                : undefined
            }
            priceLower={inputTopValue}
            priceUpper={inputBottomValue}
            onLeftRangeInput={(val) => {
              inputTopBlur(val); // Or whatever your function is
            }}
            onRightRangeInput={(val) => {
              inputBottomBlur(val);
            }}
            interactive={true}
          />
        </>
      )}
    </div>
  );
};
