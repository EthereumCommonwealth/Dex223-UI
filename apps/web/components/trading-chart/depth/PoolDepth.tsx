"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ChartMarket } from "../hooks/useChartMarket";
import { poolBook } from "./book";
import OrderBook from "./OrderBook";
import { usePoolState } from "./usePoolDepth";

const STEPS = [0.001, 0.005, 0.01, 0.02, 0.05];

/** The traded pool's liquidity laid out as a price ladder. */
export default function PoolDepth({ market }: { market: ChartMarket }) {
  const t = useTranslations("TradingChart");
  const [step, setStep] = useState(0.01);
  const { data: state, isLoading } = usePoolState(market.chainId, market.pool?.address ?? null);

  const book = useMemo(
    () => (state ? poolBook(state, { inverted: market.inverted, step, levels: 7 }) : null),
    [state, market.inverted, step],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-2 pb-1">
        <p className="text-12 text-tertiary-text max-w-[420px]">{t("depth_pool_hint")}</p>
        <div
          className="flex items-center bg-secondary-bg rounded-2 p-0.5"
          role="radiogroup"
          aria-label={t("depth_band")}
        >
          {STEPS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={step === value}
              onClick={() => setStep(value)}
              className={clsx(
                "px-2 h-6 rounded-1 text-12 tabular-nums duration-200",
                step === value
                  ? "bg-tertiary-bg text-primary-text"
                  : "text-tertiary-text hocus:text-primary-text",
              )}
            >
              {value * 100}%
            </button>
          ))}
        </div>
      </div>
      <OrderBook
        book={book}
        base={market.base?.symbol ?? ""}
        quote={market.quote?.symbol ?? ""}
        rows={7}
        loading={isLoading}
        emptyMessage={t("depth_unavailable")}
        variant="pool"
      />
    </div>
  );
}
