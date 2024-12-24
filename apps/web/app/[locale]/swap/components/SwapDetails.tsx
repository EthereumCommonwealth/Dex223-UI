import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import SwapDetailsRow from "@/app/[locale]/swap/components/SwapDetailsRow";
import { TokenTrade } from "@/app/[locale]/swap/hooks/useTrade";
import { useSwapAmountsStore } from "@/app/[locale]/swap/stores/useSwapAmountsStore";
import { useSwapDetailsStateStore } from "@/app/[locale]/swap/stores/useSwapDetailsStateStore";
import { useSwapGasLimitStore } from "@/app/[locale]/swap/stores/useSwapGasSettingsStore";
import { useSwapSettingsStore } from "@/app/[locale]/swap/stores/useSwapSettingsStore";
import Collapse from "@/components/atoms/Collapse";
import Svg from "@/components/atoms/Svg";
import Tooltip from "@/components/atoms/Tooltip";
import { formatFloat } from "@/functions/formatFloat";
import { useNativeCurrency } from "@/hooks/useNativeCurrency";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { CurrencyAmount } from "@/sdk_hybrid/entities/fractions/currencyAmount";
import { Percent } from "@/sdk_hybrid/entities/fractions/percent";

export default function SwapDetails({
  trade,
  tokenA,
  tokenB,
  gasPrice,
  networkFee,
}: {
  trade: TokenTrade;
  tokenA: Currency;
  tokenB: Currency;
  gasPrice: string | undefined;
  networkFee: string | undefined;
}) {
  const t = useTranslations("Swap");
  const nativeCurrency = useNativeCurrency();
  const { isDetailsExpanded, setIsDetailsExpanded, setIsPriceInverted, isPriceInverted } =
    useSwapDetailsStateStore();
  const { typedValue } = useSwapAmountsStore();

  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    return trade?.outputAmount;
  }, [trade?.outputAmount]);

  const { slippage, deadline: _deadline } = useSwapSettingsStore();
  const { estimatedGas, customGasLimit } = useSwapGasLimitStore();
  return (
    <>
      <div
        className={clsx("mt-5 bg-tertiary-bg", !isDetailsExpanded ? "rounded-3" : "rounded-t-3")}
      >
        <div
          className={clsx(
            "min-h-12 flex justify-between duration-200 px-5 text-secondary-text py-3 gap-2",
            !isDetailsExpanded ? "hocus:bg-green-bg rounded-3" : "rounded-t-3",
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
            className="text-14 hocus:text-green duration-200 text-left py-0.5"
          >
            <span>1 {isPriceInverted ? tokenB.symbol : tokenA.symbol}</span> <span>= </span>
            <span>
              {isPriceInverted
                ? trade.executionPrice.invert().toSignificant()
                : trade.executionPrice.toSignificant()}{" "}
              {isPriceInverted ? tokenA.symbol : tokenB.symbol}
            </span>{" "}
            <span className="whitespace-nowrap">
              ($0.00){" "}
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
            tooltipText={"Gas price tooltip"}
          />
          <SwapDetailsRow
            title={"Network fee"}
            value={`${networkFee} ${nativeCurrency.symbol}`}
            tooltipText={"Network fee tooltip"}
          />
          <SwapDetailsRow
            title={t("minimum_received")}
            value={
              trade
                ?.minimumAmountOut(new Percent(slippage * 100, 10000), dependentAmount)
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
                ? `${(+typedValue * 0.3) / 100} ${tokenA.symbol}`
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
            value={`${slippage}%`}
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
