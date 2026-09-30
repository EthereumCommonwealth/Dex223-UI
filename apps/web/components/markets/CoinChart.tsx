"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import ChartCanvas, { LoadState } from "@/components/trading-chart/ChartCanvas";
import { MarketApiDatafeed } from "@/components/trading-chart/datafeed/marketApi";
import { Bar, Resolution } from "@/components/trading-chart/datafeed/types";
import { formatPrice } from "@/components/trading-chart/format";
import { ChartType } from "@/components/trading-chart/store";
import { chartTheme } from "@/components/trading-chart/theme";
import { ThemeColors } from "@/config/theme/colors";

const datafeed = new MarketApiDatafeed();

// CoinMarketCap-style ranges, each at a resolution that gives a readable number of bars.
const RANGES: { key: string; resolution: Resolution; bars: number }[] = [
  { key: "1D", resolution: "15", bars: 96 },
  { key: "7D", resolution: "60", bars: 168 },
  { key: "1M", resolution: "240", bars: 180 },
  { key: "3M", resolution: "1D", bars: 90 },
  { key: "1Y", resolution: "1D", bars: 365 },
  { key: "ALL", resolution: "1W", bars: Infinity },
];

export default function CoinChart({
  symbol,
  label,
  onLastBar,
}: {
  symbol: string;
  /** Shown faintly behind the plot, e.g. "ETH/USD". */
  label?: string;
  onLastBar?: (bar: Bar | null) => void;
}) {
  const t = useTranslations("TradingChart");
  const [range, setRange] = useState(RANGES[1]);
  const [chartType, setChartType] = useState<ChartType>("area");
  const [hovered, setHovered] = useState<Bar | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const theme = useMemo(() => chartTheme(ThemeColors.GREEN), []);

  return (
    <div className="bg-primary-bg rounded-5 overflow-hidden">
      <div className="flex items-center gap-2 px-3 md:px-4 py-2 border-b border-secondary-border overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-0.5" role="radiogroup">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              role="radio"
              aria-checked={range.key === r.key}
              onClick={() => setRange(r)}
              className={clsx(
                "px-3 h-8 rounded-2 text-12 font-medium duration-200 shrink-0",
                range.key === r.key
                  ? "bg-tertiary-bg text-primary-text"
                  : "text-tertiary-text hocus:text-primary-text",
              )}
            >
              {r.key}
            </button>
          ))}
        </div>
        <div
          className="ml-auto flex items-center bg-secondary-bg rounded-2 p-0.5"
          role="radiogroup"
        >
          {(["area", "candles"] as const).map((type) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={chartType === type}
              onClick={() => setChartType(type)}
              className={clsx(
                "px-3 h-7 rounded-2 text-12 duration-200",
                chartType === type ? "bg-tertiary-bg text-primary-text" : "text-tertiary-text",
              )}
            >
              {t(type)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[340px] md:h-[440px]">
        <ChartCanvas
          datafeed={datafeed}
          symbol={symbol}
          resolution={range.resolution}
          chartType={chartType}
          showVolume
          theme={theme}
          pageSize={Number.isFinite(range.bars) ? Math.max(300, range.bars + 10) : 1000}
          initialVisible={range.bars}
          watermark={label}
          onHover={(bar) => setHovered(bar)}
          onLastBar={(bar) => onLastBar?.(bar)}
          onState={setState}
        />
        {hovered && (
          <div className="absolute left-3 top-2 z-10 text-12 tabular-nums text-tertiary-text pointer-events-none">
            O <span className="text-secondary-text">{formatPrice(hovered.open)}</span> H{" "}
            <span className="text-secondary-text">{formatPrice(hovered.high)}</span> L{" "}
            <span className="text-secondary-text">{formatPrice(hovered.low)}</span> C{" "}
            <span className="text-secondary-text">{formatPrice(hovered.close)}</span>
          </div>
        )}
        {state === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-14 text-tertiary-text">
            {t("loading")}
          </div>
        )}
        {(state === "empty" || state === "error") && (
          <div className="absolute inset-0 flex items-center justify-center text-14 text-tertiary-text px-6 text-center">
            {state === "empty" ? t("empty_title") : t("error_title")}
          </div>
        )}
      </div>
      <div className="flex justify-end px-4 h-8 items-center border-t border-secondary-border text-12 text-tertiary-text">
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hocus:text-secondary-text duration-200"
        >
          {t("charts_by")}
        </a>
      </div>
    </div>
  );
}
