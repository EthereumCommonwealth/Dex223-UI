"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import PriceChart from "@/components/charts/PriceChart";
import { ChartRange, PricePoint, usePoolPriceChart } from "@/hooks/usePoolPriceChart";
import { Currency } from "@/sdk_bi/entities/currency";
import { FeeAmount } from "@/sdk_bi/constants";
import { useComputePoolAddressDex } from "@/sdk_bi/utils/computePoolAddress";

const RANGES: ChartRange[] = [7, 30, 90];

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4);
  return value.toPrecision(4);
}

export default function SwapPriceChart({
  tokenA,
  tokenB,
  feeTier = FeeAmount.MEDIUM,
  width = 440,
  height = 180,
}: {
  tokenA?: Currency;
  tokenB?: Currency;
  feeTier?: FeeAmount;
  width?: number;
  height?: number;
}) {
  const t = useTranslations("Liquidity");
  const [days, setDays] = useState<ChartRange>(30);
  const [hovered, setHovered] = useState<PricePoint | null>(null);

  const { poolAddress, poolAddressLoading } = useComputePoolAddressDex({
    tokenA,
    tokenB,
    tier: feeTier,
  });

  // The subgraph stores token0Price, and token0 is whichever address sorts lower.
  // When the user is looking at the pair the other way round the series needs
  // inverting, otherwise the chart silently shows the reciprocal of what they expect.
  const inverted = useMemo(() => {
    if (!tokenA?.wrapped?.address0 || !tokenB?.wrapped?.address0) return false;
    return tokenA.wrapped.address0.toLowerCase() > tokenB.wrapped.address0.toLowerCase();
  }, [tokenA, tokenB]);

  const { series, latestPrice, change, isLoading, isEmpty } = usePoolPriceChart({
    poolAddress: poolAddress ?? undefined,
    days,
    inverted,
  });

  const loading = isLoading || Boolean(poolAddressLoading);

  if (!tokenA || !tokenB) return null;

  const shown = hovered?.close ?? latestPrice;

  return (
    <div className="flex flex-col gap-3 rounded-3 bg-primary-bg p-4 md:p-5">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <div className="text-14 text-secondary-text truncate">
            {tokenA.symbol} / {tokenB.symbol}
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-20 md:text-24 font-medium">
              {shown === null ? "—" : formatPrice(shown)}
            </span>
            {change !== null && !hovered && (
              <span className={change >= 0 ? "text-green text-14" : "text-red-light text-14"}>
                {change >= 0 ? "+" : ""}
                {change.toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDays(range)}
              aria-pressed={days === range}
              className={
                "px-2.5 py-1 rounded-2 text-12 duration-200 " +
                (days === range
                  ? "bg-green-bg text-primary-text"
                  : "text-secondary-text hocus:text-primary-text")
              }
            >
              {range}D
            </button>
          ))}
        </div>
      </div>

      <PriceChart
        series={series}
        width={width}
        height={height}
        isLoading={loading}
        // Reuses the message that already existed for the liquidity chart rather than
        // adding a new key, so it is translated in every locale from day one.
        emptyLabel={isEmpty ? t("price_chart_no_data") : t("price_chart_data_not_available")}
        onHover={setHovered}
      />
    </div>
  );
}
