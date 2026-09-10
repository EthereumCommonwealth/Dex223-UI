import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import { MarginSwapSettingsStore } from "@/app/[locale]/margin-swap/stores/useMarginSwapSettingsStore";
import SwapDetailsRow from "@/app/[locale]/swap/components/SwapDetailsRow";
import { TokenTrade } from "@/app/[locale]/swap/hooks/useTrade";
import { useSwapAmountsStore } from "@/app/[locale]/swap/stores/useSwapAmountsStore";
import { useSwapDetailsStateStore } from "@/app/[locale]/swap/stores/useSwapDetailsStateStore";
import { useSwapGasLimitStore } from "@/app/[locale]/swap/stores/useSwapGasSettingsStore";
import {
  SlippageType,
  useSwapSettingsStore,
} from "@/app/[locale]/swap/stores/useSwapSettingsStore";
import Collapse from "@/components/atoms/Collapse";
import Svg from "@/components/atoms/Svg";
import { ThemeColors } from "@/config/theme/colors";
import { formatFloat } from "@/functions/formatFloat";
import { useNativeCurrency } from "@/hooks/useNativeCurrency";
import { useUSDPrice } from "@/hooks/useUSDPrice";
import { useColorScheme } from "@/lib/color-scheme";
import { Currency } from "@/sdk_bi/entities/currency";
import { CurrencyAmount } from "@/sdk_bi/entities/fractions/currencyAmount";
import { Percent } from "@/sdk_bi/entities/fractions/percent";
import { slippageToPercent } from "@/functions/slippageToPercent";

export default function SwapDetails({
  trade,
  tokenA,
  tokenB,
  gasPrice,
  networkFee,
  settingsStore,
}: {
  trade: TokenTrade;
  tokenA: Currency;
  tokenB: Currency;
  gasPrice: string | undefined;
  networkFee: string | undefined;
  settingsStore: MarginSwapSettingsStore;
}) {
  const t = useTranslations("Swap");
  const nativeCurrency = useNativeCurrency();
  const { isDetailsExpanded, setIsDetailsExpanded, setIsPriceInverted, isPriceInverted } =
    useSwapDetailsStateStore();
  const { typedValue } = useSwapAmountsStore();

  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    return trade?.outputAmount;
  }, [trade?.outputAmount]);

  const { slippage, deadline: _deadline, slippageType } = settingsStore;
  const { estimatedGas, customGasLimit } = useSwapGasLimitStore();

  const feeMultiplier = useMemo(() => {
    const fee = trade?.swaps[0].route.pools[0].fee;
    return fee ? fee / 100000 : 0.3;
  }, [trade?.swaps]);

  const slippageValue = useMemo(() => {
    if (slippageType === SlippageType.AUTO) {
      return (
        <span className="flex items-center gap-2">
          <span className="flex items-center justify-center px-2 text-12 md:text-14 h-5 rounded-20 font-500 text-tertiary-text border border-secondary-border">
            Auto
          </span>
          {slippage}%
        </span>
      );
    }
    if (slippageType === SlippageType.CUSTOM) {
      return (
        <span className="flex items-center gap-2">
          <span className="flex items-center justify-center px-2 text-12 h-5 rounded-20 font-500 text-tertiary-text border border-secondary-border">
            Custom
          </span>
          {slippage}%
        </span>
      );
    }

    return `${slippage}%`;
  }, [slippage, slippageType]);

  const { price: priceA } = useUSDPrice(tokenA.wrapped.address0);
  const { price: priceB } = useUSDPrice(tokenB.wrapped.address0);

  const colorScheme = useColorScheme();

  return (
    <>
      <div
        className={clsx("mt-5 bg-tertiary-bg", !isDetailsExpanded ? "rounded-3" : "rounded-t-3")}
      >
        <div
          className={clsx(
            "min-h-12 flex justify-between duration-200 px-5 text-secondary-text py-3 gap-2",
            !isDetailsExpanded
              ? {
                  [ThemeColors.GREEN]: "hocus:bg-green-bg rounded-3",
                  [ThemeColors.PURPLE]: "hocus:bg-purple-bg rounded-3",
                }[colorScheme]
              : "rounded-t-3",
          )}
          role="button"
          tabIndex={0}
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPriceInverted(!isPriceInverted);
            }}
            className={clsx(
              "text-14  duration-200 text-left py-0.5",
              {
                [ThemeColors.GREEN]: "hocus:text-green",
                [ThemeColors.PURPLE]: "hocus:text-purple",
              }[colorScheme],
            )}
          >
            <span>1 {isPriceInverted ? tokenB.symbol : tokenA.symbol}</span> <span>= </span>
            <span>
              {isPriceInverted
                ? trade.executionPrice.invert().toSignificant()
                : trade.executionPrice.toSignificant()}{" "}
              {isPriceInverted ? tokenA.symbol : tokenB.symbol}
            </span>{" "}
            <span className="whitespace-nowrap">
              {isPriceInverted
                ? priceB && `($${formatFloat(priceB)})`
                : priceA && `($${formatFloat(priceA)})`}

              <span className="text-14 inline-flex items-center justify-center align-middle relative bottom-[1px]">
                <Svg iconName="swap" size={16} />
              </span>
            </span>
          </button>

          <div className="flex gap-3">
            <div
              className={clsx(
                "max-sm:hidden text-14 flex items-center duration-200",
                isDetailsExpanded && "opacity-0",
              )}
            >
              {t("swap_details")}
            </div>
            <span>
              <Svg
                className={clsx("duration-200", isDetailsExpanded && "-rotate-180")}
                iconName="small-expand-arrow"
              />
            </span>
          </div>
        </div>
      </div>
      <Collapse open={isDetailsExpanded}>
        <div className="flex flex-col gap-2 pb-4 px-5 bg-tertiary-bg rounded-b-3 text-14">
          <SwapDetailsRow
            title={"Gas price"}
            value={`${gasPrice} GWEI`}
            tooltipText={
              "Network fee is calculated as tx gas quantity * gas price. If the gas price value of your transaction will be lower than the gas price value on the network then your transaction will not confirm until the network gas prices will drop."
            }
          />
          <SwapDetailsRow
            title={"Network fee"}
            value={`${networkFee} ${nativeCurrency.symbol}`}
            tooltipText={
              "Network fee is paid to the network operators to include your transaction in a block. It does not depend on Dex223 team. Network fee is calculated as tx gas quantity * tx gas price."
            }
          />
          <SwapDetailsRow
            title={t("minimum_received")}
            value={
              trade
                ?.minimumAmountOut(slippageToPercent(slippage), dependentAmount)
                .toSignificant() || "Loading..."
            }
            tooltipText={t("minimum_received_tooltip")}
          />
          <SwapDetailsRow
            title={t("price_impact")}
            value={trade ? `${formatFloat(trade.priceImpact.toSignificant())}%` : "Loading..."}
            tooltipText={t("price_impact_tooltip")}
          />
          <SwapDetailsRow
            title={t("trading_fee")}
            value={
              typedValue && Boolean(+typedValue) && tokenA
                ? `${formatFloat((+typedValue * feeMultiplier) / 100)} ${tokenA.symbol}`
                : "Loading..."
            }
            tooltipText={t("trading_fee_tooltip")}
          />
          <SwapDetailsRow
            title={t("order_routing")}
            value={t("direct_swap")}
            tooltipText={t("route_tooltip")}
          />
          <SwapDetailsRow
            title={t("maximum_slippage")}
            value={slippageValue}
            tooltipText={t("maximum_slippage_tooltip")}
          />
          <SwapDetailsRow
            title={t("gas_limit")}
            value={
              customGasLimit
                ? customGasLimit.toString()
                : (estimatedGas + BigInt(30000)).toString() || "Loading..."
            }
            tooltipText={t("gas_limit_tooltip")}
          />
        </div>
      </Collapse>
    </>
  );
}
