"use client";

import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";

import Svg from "@/components/atoms/Svg";
import TokenLogo from "@/components/atoms/TokenLogo";
import { Link } from "@/i18n/routing";
import { useColorScheme } from "@/lib/color-scheme";
import { Currency } from "@/sdk_bi/entities/currency";

import ChartCanvas, { ChartCanvasHandle, LoadState } from "./ChartCanvas";
import { Bar, RESOLUTIONS, Trade } from "./datafeed/types";
import { compact, formatPercent, formatPrice } from "./format";
import { useChartMarket } from "./hooks/useChartMarket";
import { useMarketTrades, usePairStats } from "./hooks/useMarketData";
import MarketTrades from "./MarketTrades";
import { ChartType, useTradingChartStore } from "./store";
import { chartTheme } from "./theme";

const CHART_TYPES: ChartType[] = ["candles", "line", "area"];

interface Props {
  tokenA?: Currency;
  tokenB?: Currency;
  /** Fee tier the current quote routes through, so the chart follows the pool traded. */
  routedFee?: number;
  /** Tailwind height classes for the plotting area. */
  heightClassName?: string;
  /** Show the market and personal trades panel under the chart. */
  showTrades?: boolean;
  className?: string;
}

export default function TradingChart({
  tokenA,
  tokenB,
  routedFee,
  heightClassName = "h-[360px] md:h-[440px] xl:h-[520px]",
  showTrades = true,
  className,
}: Props) {
  const t = useTranslations("TradingChart");
  const scheme = useColorScheme();
  const theme = useMemo(() => chartTheme(scheme), [scheme]);
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const market = useChartMarket({ tokenA, tokenB, routedFee });
  const { resolution, chartType, showVolume, setResolution, setChartType, setShowVolume } =
    useTradingChartStore();

  const { data: stats } = usePairStats(market);
  const { data: myTrades } = useMarketTrades(market, { origin: address ?? "", limit: 200 });

  const canvasRef = useRef<ChartCanvasHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Bar | null>(null);
  const [lastBar, setLastBar] = useState<Bar | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const datafeed = market.datafeed;
  // The fallback feed has no minute data; show the nearest resolution it does have.
  const activeResolution =
    datafeed && !datafeed.resolutions.includes(resolution) ? datafeed.resolutions[0] : resolution;

  useEffect(() => setLiveTrades([]), [market.symbol]);

  const onTrades = useCallback(
    (trades: Trade[]) => {
      setLiveTrades((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        return [...trades.filter((x) => !seen.has(x.id)).reverse(), ...prev].slice(0, 100);
      });
      // A trade moves the 24h figures; mine also adds a marker.
      queryClient.invalidateQueries({ queryKey: ["chart-pool-stats"] });
      if (address && trades.some((x) => x.origin?.toLowerCase() === address.toLowerCase())) {
        queryClient.invalidateQueries({ queryKey: ["chart-trades"] });
      }
    },
    [address, queryClient],
  );

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen?.();
  };

  const saveImage = () => {
    const canvas = canvasRef.current?.screenshot();
    if (!canvas || !market.base || !market.quote) return;
    const link = document.createElement("a");
    link.download = `${market.base.symbol}-${market.quote.symbol}-${activeResolution}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Header price: the live bar beats the stats poll, which trails it by up to 15s.
  const price = lastBar?.close ?? stats?.price ?? null;
  const change =
    price !== null && stats?.price_24h_ago
      ? ((price - stats.price_24h_ago) / stats.price_24h_ago) * 100
      : (stats?.change_24h ?? null);

  const flash = usePriceFlash(price);

  if (!tokenA || !tokenB) {
    return (
      <Panel className={className}>
        <EmptyState icon="chart" title={t("select_pair")} />
      </Panel>
    );
  }

  const legendBar = hovered ?? lastBar;
  const isFallback = datafeed?.kind === "subgraph";

  return (
    <div
      ref={rootRef}
      className={clsx(
        "flex flex-col bg-primary-bg rounded-3 overflow-hidden",
        fullscreen && "fixed inset-0 z-[100] rounded-0",
        className,
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 md:px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center shrink-0">
            <TokenLogo
              src={(market.base ?? tokenB).logoURI}
              alt={(market.base ?? tokenB).symbol ?? ""}
              size={32}
              className="rounded-full w-8 h-8 relative z-10 border-2 border-primary-bg"
            />
            <TokenLogo
              src={(market.quote ?? tokenA).logoURI}
              alt={(market.quote ?? tokenA).symbol ?? ""}
              size={32}
              className="rounded-full w-8 h-8 -ml-3"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-16 md:text-18 font-medium text-primary-text truncate">
                {(market.base ?? tokenB).symbol}
                <span className="text-tertiary-text"> / {(market.quote ?? tokenA).symbol}</span>
              </span>
              <button
                type="button"
                onClick={market.flip}
                disabled={market.status !== "ready"}
                aria-label={t("flip")}
                title={t("flip")}
                className="p-1 rounded-2 text-tertiary-text hocus:text-primary-text hocus:bg-tertiary-bg duration-200 disabled:opacity-40"
              >
                <Svg iconName="swap" size={18} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-12 text-tertiary-text">
              <FeeTierSelect market={market} />
              {market.status === "ready" && (
                <span className="flex items-center gap-1">
                  <span
                    className={clsx(
                      "w-1.5 h-1.5 rounded-full",
                      isFallback ? "bg-orange" : "bg-green animate-pulse",
                    )}
                  />
                  {isFallback ? t("hourly_data") : t("live")}
                </span>
              )}
            </div>
          </div>
        </div>

        {market.status !== "no-pool" && (
          <div className="flex items-baseline gap-2">
            <span
              className={clsx(
                "text-24 md:text-[28px] font-medium tabular-nums duration-500",
                flash === "up"
                  ? "text-green"
                  : flash === "down"
                    ? "text-red-light"
                    : "text-primary-text",
              )}
            >
              {formatPrice(price)}
            </span>
            <ChangePill value={change} />
          </div>
        )}

        {market.status !== "no-pool" && (
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-12 md:ml-auto">
            <Stat label={t("high_24h")} value={formatPrice(stats?.high_24h)} />
            <Stat label={t("low_24h")} value={formatPrice(stats?.low_24h)} />
            <Stat
              label={t("volume_24h")}
              value={
                stats
                  ? `${compact(stats.volume1_24h)} ${(market.quote ?? tokenA).symbol ?? ""}`
                  : "–"
              }
            />
            <Stat label={t("trades_24h")} value={stats ? String(stats.trades_24h) : "–"} />
          </dl>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 md:px-3 py-1.5 border-y border-secondary-border overflow-x-auto no-scrollbar">
        <div className="flex items-center" role="radiogroup" aria-label={t("interval")}>
          {RESOLUTIONS.map((r) => {
            const available = !datafeed || datafeed.resolutions.includes(r.value);
            const active = activeResolution === r.value;
            return (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!available}
                title={available ? undefined : t("interval_unavailable")}
                onClick={() => setResolution(r.value)}
                className={clsx(
                  "px-2.5 h-7 rounded-2 text-12 font-medium duration-200 shrink-0",
                  active
                    ? "bg-tertiary-bg text-primary-text"
                    : "text-tertiary-text hocus:text-primary-text disabled:opacity-30 disabled:hover:text-tertiary-text",
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        <Divider />

        <div className="flex items-center" role="radiogroup" aria-label={t("chart_type")}>
          {CHART_TYPES.map((type) => (
            <ToolButton
              key={type}
              label={t(type)}
              active={chartType === type}
              onClick={() => setChartType(type)}
              role="radio"
            >
              <ChartTypeIcon type={type} />
            </ToolButton>
          ))}
        </div>

        <Divider />

        <button
          type="button"
          onClick={() => setShowVolume(!showVolume)}
          aria-pressed={showVolume}
          className={clsx(
            "px-2.5 h-7 rounded-2 text-12 font-medium duration-200 shrink-0",
            showVolume ? "text-primary-text" : "text-tertiary-text hocus:text-primary-text",
          )}
        >
          {t("volume")}
        </button>

        <div className="ml-auto flex items-center">
          <ToolButton label={t("reset_view")} onClick={() => canvasRef.current?.resetView()}>
            <Svg iconName="reset" size={18} />
          </ToolButton>
          <ToolButton label={t("save_image")} onClick={saveImage}>
            <Svg iconName="download" size={18} />
          </ToolButton>
          <ToolButton
            label={fullscreen ? t("exit_fullscreen") : t("fullscreen")}
            onClick={toggleFullscreen}
          >
            <FullscreenIcon exit={fullscreen} />
          </ToolButton>
        </div>
      </div>

      {/* Plot */}
      <div className={clsx("relative", fullscreen ? "flex-1" : heightClassName)}>
        {market.status === "ready" && datafeed && market.symbol && (
          <ChartCanvas
            key={reloadKey}
            ref={canvasRef}
            datafeed={datafeed}
            symbol={market.symbol}
            resolution={activeResolution}
            chartType={chartType}
            showVolume={showVolume}
            theme={theme}
            myTrades={myTrades}
            onHover={setHovered}
            onLastBar={setLastBar}
            onState={setLoadState}
            onTrades={onTrades}
          />
        )}

        {market.status === "ready" && loadState === "ready" && legendBar && (
          <Legend
            bar={legendBar}
            volumeLabel={t("volume")}
            volumeUnit={(market.base ?? tokenB).symbol ?? ""}
          />
        )}

        {(market.status === "loading" ||
          market.status === "idle" ||
          (market.status === "ready" && loadState === "loading")) && <ChartSkeleton />}
        {market.status === "no-pool" && (
          <EmptyState
            icon="pool"
            title={t("no_pool_title")}
            description={t("no_pool_description", {
              base: tokenB.symbol ?? "",
              quote: tokenA.symbol ?? "",
            })}
            action={
              <Link
                href="/add"
                className="mt-1 px-4 h-9 inline-flex items-center rounded-2 bg-green-bg text-primary-text text-14 hocus:bg-green-bg-hover duration-200"
              >
                {t("create_pool")}
              </Link>
            }
          />
        )}
        {market.status === "ready" && loadState === "empty" && (
          <EmptyState icon="candle" title={t("empty_title")} description={t("empty_description")} />
        )}
        {market.status === "ready" && loadState === "error" && (
          <EmptyState
            icon="warning"
            title={t("error_title")}
            description={t("error_description")}
            action={
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="mt-1 px-4 h-9 rounded-2 bg-tertiary-bg text-primary-text text-14 hocus:bg-quaternary-bg duration-200"
              >
                {t("retry")}
              </button>
            }
          />
        )}
      </div>

      {showTrades && !fullscreen && market.status === "ready" && datafeed?.supportsTrades && (
        <MarketTrades market={market} liveTrades={liveTrades} />
      )}
    </div>
  );
}

function usePriceFlash(price: number | null): "up" | "down" | null {
  const previous = useRef<number | null>(null);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    const before = previous.current;
    previous.current = price;
    if (before === null || price === null || before === price) return;
    setFlash(price > before ? "up" : "down");
    const timer = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(timer);
  }, [price]);
  return flash;
}

function FeeTierSelect({ market }: { market: ReturnType<typeof useChartMarket> }) {
  const t = useTranslations("TradingChart");
  if (!market.pool) return null;
  const label = (fee: number) => t("fee_tier", { fee: fee / 10_000 });
  if (market.pools.length < 2) {
    return <span className="text-secondary-text">{label(market.pool.fee)}</span>;
  }
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("pool")}</span>
      <select
        value={market.pool.fee}
        onChange={(e) => market.selectFee(Number(e.target.value))}
        className="appearance-none bg-transparent text-secondary-text pr-4 cursor-pointer hocus:text-primary-text focus:outline-none"
      >
        {market.pools.map((p) => (
          <option key={p.address} value={p.fee} className="bg-primary-bg">
            {label(p.fee)}
          </option>
        ))}
      </select>
      <Svg
        iconName="small-expand-arrow"
        size={14}
        className="absolute right-0 pointer-events-none"
      />
    </label>
  );
}

function ChangePill({ value }: { value: number | null }) {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  return (
    <span
      className={clsx(
        "px-1.5 py-0.5 rounded-1 text-12 font-medium tabular-nums",
        up ? "bg-green-bg text-green" : "bg-red-bg text-red-light",
      )}
    >
      {formatPercent(value)}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-tertiary-text">{label}</dt>
      <dd className="text-primary-text tabular-nums">{value}</dd>
    </div>
  );
}

function Legend({
  bar,
  volumeLabel,
  volumeUnit,
}: {
  bar: Bar;
  volumeLabel: string;
  volumeUnit: string;
}) {
  const up = bar.close >= bar.open;
  const change = bar.open ? ((bar.close - bar.open) / bar.open) * 100 : 0;
  const tone = up ? "text-green" : "text-red-light";
  return (
    <div className="absolute left-3 top-2 z-10 flex flex-wrap gap-x-3 gap-y-0.5 text-12 tabular-nums pointer-events-none pr-16">
      {(
        [
          ["O", bar.open],
          ["H", bar.high],
          ["L", bar.low],
          ["C", bar.close],
        ] as const
      ).map(([k, v]) => (
        <span key={k} className="text-tertiary-text">
          {k} <span className={tone}>{formatPrice(v)}</span>
        </span>
      ))}
      <span className={tone}>{formatPercent(change)}</span>
      <span className="text-tertiary-text">
        {volumeLabel}{" "}
        <span className="text-secondary-text">
          {compact(bar.volume)} {volumeUnit}
        </span>
      </span>
    </div>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
  role,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  role?: "radio";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      role={role}
      aria-checked={role === "radio" ? !!active : undefined}
      className={clsx(
        "w-8 h-7 inline-flex items-center justify-center rounded-2 duration-200 shrink-0",
        active
          ? "bg-tertiary-bg text-primary-text"
          : "text-tertiary-text hocus:text-primary-text hocus:bg-tertiary-bg",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-4 bg-secondary-border mx-1 shrink-0" aria-hidden />;
}

function ChartTypeIcon({ type }: { type: ChartType }) {
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      {type === "candles" && (
        <>
          <path d="M5 2.5v2.5M5 13v2.5M13 4v2M13 12.5V16" {...stroke} />
          <rect x="3" y="5" width="4" height="8" rx="1" {...stroke} />
          <rect x="11" y="6" width="4" height="6.5" rx="1" fill="currentColor" {...stroke} />
        </>
      )}
      {type === "line" && <path d="M2 13.5l4-4.5 3.5 3L16 4.5" {...stroke} />}
      {type === "area" && (
        <>
          <path d="M2 13l4-4.5 3.5 3L16 4v11.5H2V13z" fill="currentColor" opacity="0.3" />
          <path d="M2 13l4-4.5 3.5 3L16 4" {...stroke} />
        </>
      )}
    </svg>
  );
}

function FullscreenIcon({ exit }: { exit: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      {exit ? (
        <path
          d="M6 1v5H1M10 1v5h5M6 15v-5H1M10 15v-5h5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M1 6V1h5M15 6V1h-5M1 10v5h5M15 10v5h-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function ChartSkeleton() {
  // Faint candles rising and falling, so the loading state already reads as a chart.
  const heights = [38, 52, 44, 61, 57, 70, 63, 49, 58, 72, 66, 80, 74, 69, 83, 77, 88, 81];
  return (
    <div
      className="absolute inset-0 flex items-end gap-[3%] px-6 pb-10 pt-12 overflow-hidden"
      aria-busy
    >
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-1 bg-tertiary-bg animate-pulse"
          style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

const EMPTY_ICONS: Record<"chart" | "candle" | "pool" | "warning", React.ReactNode> = {
  chart: <path d="M4 17l5-5 4 3 7-8M4 21h16" />,
  candle: (
    <>
      <path d="M8 3v3M8 16v5M16 5v4M16 16v3" />
      <rect x="5.5" y="6" width="5" height="10" rx="1" />
      <rect x="13.5" y="9" width="5" height="7" rx="1" />
    </>
  ),
  pool: (
    <>
      <circle cx="9" cy="12" r="5" />
      <circle cx="15" cy="12" r="5" />
    </>
  ),
  warning: <path d="M12 4l9 16H3l9-16zM12 10v4M12 17.5v.01" />,
};

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: keyof typeof EMPTY_ICONS;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
      <span className="w-12 h-12 rounded-full bg-tertiary-bg flex items-center justify-center text-tertiary-text">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {EMPTY_ICONS[icon]}
        </svg>
      </span>
      <p className="text-16 text-primary-text font-medium">{title}</p>
      {description && <p className="text-14 text-tertiary-text max-w-[380px]">{description}</p>}
      {action}
    </div>
  );
}

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx("relative bg-primary-bg rounded-3 h-[240px]", className)}>{children}</div>
  );
}
