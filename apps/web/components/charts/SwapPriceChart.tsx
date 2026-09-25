"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { useTrade } from "@/app/[locale]/swap/hooks/useTrade";
import PriceChart from "@/components/charts/PriceChart";
import { ChartRange, PricePoint, usePoolPriceChart } from "@/hooks/usePoolPriceChart";
import { FeeAmount } from "@/sdk_bi/constants";
import { Currency } from "@/sdk_bi/entities/currency";
import { useComputePoolAddressDex } from "@/sdk_bi/utils/computePoolAddress";

const RANGES: ChartRange[] = [7, 30, 90];
const DEFAULT_WIDTH = 440;
const CHART_HEIGHT = 180;

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4);
  return value.toPrecision(4);
}

export default function SwapPriceChart({
  tokenA,
  tokenB,
  height = CHART_HEIGHT,
  feeTier: feeTierOverride,
}: {
  tokenA?: Currency;
  tokenB?: Currency;
  height?: number;
  // Pages with their own trade store (margin swap) pass the routed fee here, since
  // the swap store below holds whatever pair was last quoted on /swap.
  feeTier?: FeeAmount;
}) {
  const t = useTranslations("Swap");
  const [days, setDays] = useState<ChartRange>(30);
  const [hovered, setHovered] = useState<PricePoint | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const chartRef = useRef<HTMLDivElement>(null);

  // Follow the routed pool's fee once a quote exists; otherwise fall back to medium
  // so the chart still loads before the user types an amount.
  const { trade } = useTrade();
  const feeTier =
    feeTierOverride ?? (trade?.route.pools?.[0]?.fee as FeeAmount | undefined) ?? FeeAmount.MEDIUM;

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

  useEffect(() => {
    const el = chartRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const apply = (next: number) => {
      const floored = Math.floor(next);
      if (floored > 0) setWidth(floored);
    };

    apply(el.clientWidth);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) apply(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

      <div ref={chartRef} className="w-full min-w-0">
        <PriceChart
          series={series}
          width={width}
          height={height}
          isLoading={loading}
          emptyLabel={isEmpty ? t("price_chart_no_data") : t("price_chart_data_not_available")}
          onHover={setHovered}
        />
      </div>
    </div>
  );
}
