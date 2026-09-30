"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useAccount } from "wagmi";

import Svg from "@/components/atoms/Svg";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import { DexChainId } from "@/sdk_bi/chains";

import { Trade } from "./datafeed/types";
import { compact, formatPrice, formatTradeTime } from "./format";
import { ChartMarket } from "./hooks/useChartMarket";
import { useMarketTrades } from "./hooks/useMarketData";

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
  const { address } = useAccount();
  const [tab, setTab] = useState<Tab>("market");

  const { data: marketTrades, isLoading } = useMarketTrades(market, { limit: 40 });
  const { data: myTrades } = useMarketTrades(market, { origin: address ?? "", limit: 40 });

  const liveIds = useMemo(() => new Set(liveTrades.map((x) => x.id)), [liveTrades]);

  const rows = useMemo(() => {
    if (tab === "mine") return myTrades ?? [];
    const byId = new Map<string, Trade>();
    for (const trade of [...(marketTrades ?? []), ...liveTrades]) byId.set(trade.id, trade);
    return [...byId.values()].sort(newestFirst).slice(0, 40);
  }, [tab, marketTrades, liveTrades, myTrades]);

  const base = market.base?.symbol ?? "";
  const quote = market.quote?.symbol ?? "";

  return (
    <div className="border-t border-secondary-border">
      <div className="flex items-center gap-1 px-3 pt-2" role="tablist">
        {(["market", "mine"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={clsx(
              "px-3 h-8 rounded-2 text-14 duration-200",
              tab === key
                ? "text-primary-text bg-tertiary-bg"
                : "text-tertiary-text hocus:text-primary-text",
            )}
          >
            {key === "market" ? t("trades_market") : t("trades_mine")}
          </button>
        ))}
      </div>

      <div className="px-3 pb-3">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-x-3 px-2 py-2 text-12 text-tertiary-text">
          <span>
            {t("price")} <span className="hidden sm:inline">({quote})</span>
          </span>
          <span className="text-right">
            {t("amount")} <span className="hidden sm:inline">({base})</span>
          </span>
          <span className="text-right">
            {t("value")} <span className="hidden sm:inline">({quote})</span>
          </span>
          <span className="text-right w-[92px] whitespace-nowrap">{t("time")}</span>
        </div>

        <div className="max-h-[264px] overflow-y-auto">
          {tab === "mine" && !address ? (
            <p className="py-6 text-center text-14 text-tertiary-text">
              {t("connect_wallet_trades")}
            </p>
          ) : !rows.length ? (
            <p className="py-6 text-center text-14 text-tertiary-text">
              {isLoading ? t("loading") : t("no_trades")}
            </p>
          ) : (
            <ul>
              {rows.map((trade) => (
                <li key={trade.id}>
                  <a
                    href={getExplorerLink(
                      ExplorerLinkType.TRANSACTION,
                      trade.tx,
                      market.chainId as DexChainId,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      "group grid grid-cols-[1fr_1fr_1fr_auto] gap-x-3 px-2 h-8 items-center rounded-2 text-12 tabular-nums hocus:bg-tertiary-bg duration-200",
                      liveIds.has(trade.id) && "animate-appear",
                    )}
                  >
                    <span className={trade.side === "buy" ? "text-green" : "text-red-light"}>
                      {formatPrice(trade.price)}
                    </span>
                    <span className="text-right text-secondary-text">{compact(trade.amount0)}</span>
                    <span className="text-right text-secondary-text">{compact(trade.amount1)}</span>
                    <span className="flex items-center justify-end gap-1 w-[92px] whitespace-nowrap text-tertiary-text">
                      {formatTradeTime(trade.time)}
                      <Svg
                        iconName="forward"
                        size={14}
                        className="opacity-0 group-hover:opacity-100 duration-200"
                      />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
