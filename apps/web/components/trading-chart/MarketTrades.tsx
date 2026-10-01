"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

import Svg from "@/components/atoms/Svg";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import { useColorScheme } from "@/lib/color-scheme";
import { DexChainId } from "@/sdk_bi/chains";

import { Trade } from "./datafeed/types";
import { compact, formatAgo, formatBarTime, formatPrice } from "./format";
import { ChartMarket } from "./hooks/useChartMarket";
import { useMarketTrades } from "./hooks/useMarketData";
import { accentClasses } from "./theme";

type Tab = "market" | "mine";

function order(id: string): [number, number] {
  const [block, log] = id.split("-").map(Number);
  return [block, log];
}

function newestFirst(a: Trade, b: Trade) {
  const [ab, al] = order(a.id);
  const [bb, bl] = order(b.id);
  return bb - ab || bl - al;
}

export default function MarketTrades({
  market,
  liveTrades,
}: {
  market: ChartMarket;
  /** Trades pushed over the live stream since the chart opened, newest first. */
  liveTrades: Trade[];
}) {
  const t = useTranslations("TradingChart");
  const locale = useLocale();
  const accent = accentClasses(useColorScheme());
  const { address } = useAccount();
  const [tab, setTab] = useState<Tab>("market");

  const { data: marketTrades, isLoading } = useMarketTrades(market, { limit: 40 });
  const { data: myTrades } = useMarketTrades(market, { origin: address ?? "", limit: 40 });

  // Re-render every 15s so relative times stay true while the panel is open.
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(timer);
  }, []);

  const liveIds = useMemo(() => new Set(liveTrades.map((x) => x.id)), [liveTrades]);

  const rows = useMemo(() => {
    if (tab === "mine") return myTrades ?? [];
    const byId = new Map<string, Trade>();
    for (const trade of [...(marketTrades ?? []), ...liveTrades]) byId.set(trade.id, trade);
    return [...byId.values()].sort(newestFirst).slice(0, 40);
  }, [tab, marketTrades, liveTrades, myTrades]);

  const base = market.base?.symbol ?? "";
  const quote = market.quote?.symbol ?? "";

  const cols = "grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_88px] gap-x-3";

  return (
    <div className="border-t border-secondary-border">
      <div className="flex items-center gap-1 px-3 md:px-4 pt-3" role="tablist">
        {(["market", "mine"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={clsx(
              "relative px-2 h-8 text-14 duration-200",
              tab === key ? "text-primary-text" : "text-tertiary-text hocus:text-primary-text",
            )}
          >
            {key === "market" ? t("trades_market") : t("trades_mine")}
            {tab === key && (
              <span
                className={clsx(
                  "absolute left-2 right-2 -bottom-px h-0.5 rounded-full",
                  accent.solid,
                )}
              />
            )}
          </button>
        ))}
      </div>

      <div className="px-3 md:px-4 pb-3">
        <div
          className={clsx(
            cols,
            "px-2 py-2 border-b border-secondary-border text-[11px] uppercase tracking-wide text-tertiary-text",
          )}
        >
          <span>
            {t("price")} <span className="hidden sm:inline normal-case">({quote})</span>
          </span>
          <span className="text-right">
            {t("amount")} <span className="hidden sm:inline normal-case">({base})</span>
          </span>
          <span className="text-right">
            {t("value")} <span className="hidden sm:inline normal-case">({quote})</span>
          </span>
          <span className="text-right">{t("time")}</span>
        </div>

        <div className="max-h-[264px] overflow-y-auto pt-1">
          {tab === "mine" && !address ? (
            <p className="py-8 text-center text-14 text-tertiary-text">
              {t("connect_wallet_trades")}
            </p>
          ) : !rows.length ? (
            <p className="py-8 text-center text-14 text-tertiary-text">
              {isLoading ? t("loading") : t("no_trades")}
            </p>
          ) : (
            <ul>
              {rows.map((trade) => {
                const buy = trade.side === "buy";
                return (
                  <li key={trade.id}>
                    <a
                      href={getExplorerLink(
                        ExplorerLinkType.TRANSACTION,
                        trade.tx,
                        market.chainId as DexChainId,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={formatBarTime(trade.time, true)}
                      className={clsx(
                        cols,
                        "group px-2 h-9 items-center rounded-2 text-12 tabular-nums hocus:bg-tertiary-bg duration-200",
                        liveIds.has(trade.id) && "animate-appear",
                      )}
                    >
                      <span
                        className={clsx(
                          "flex items-center gap-2 font-medium",
                          buy ? "text-green" : "text-red-light",
                        )}
                      >
                        <span
                          className={clsx(
                            "w-1 h-4 rounded-full shrink-0",
                            buy ? "bg-green" : "bg-red-light",
                          )}
                          aria-hidden
                        />
                        {formatPrice(trade.price)}
                      </span>
                      <span className="text-right text-primary-text">{compact(trade.amount0)}</span>
                      <span className="text-right text-secondary-text">
                        {compact(trade.amount1)}
                      </span>
                      <span className="flex items-center justify-end gap-1 whitespace-nowrap text-tertiary-text">
                        {formatAgo(trade.time, locale)}
                        <Svg
                          iconName="forward"
                          size={14}
                          className="opacity-0 -mr-1 group-hover:opacity-100 duration-200"
                        />
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
