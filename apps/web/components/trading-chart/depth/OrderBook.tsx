"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";

import { compact, formatPrice } from "../format";
import { Book, BookLevel } from "./book";

const COLS = "grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3";

interface Props {
  book: Book | null;
  base: string;
  quote: string;
  /** Rows per side. */
  rows: number;
  loading: boolean;
  /** Message when there is nothing to show and nothing is loading. */
  emptyMessage: string;
  /** Pool books label the size column as liquidity rather than orders. */
  variant: "exchange" | "pool";
  className?: string;
}

/** A price ladder: asks above the spread, bids below, cumulative depth drawn behind. */
export default function OrderBook({
  book,
  base,
  quote,
  rows,
  loading,
  emptyMessage,
  variant,
  className,
}: Props) {
  const t = useTranslations("TradingChart");
  const asks = book?.asks.slice(0, rows) ?? [];
  const bids = book?.bids.slice(0, rows) ?? [];
  const max = Math.max(asks.at(-1)?.total ?? 0, bids.at(-1)?.total ?? 0);
  const empty = !asks.some((l) => l.amount > 0) && !bids.some((l) => l.amount > 0);

  const bestAsk = book?.asks[0]?.price;
  const bestBid = book?.bids[0]?.price;
  const spread =
    variant === "exchange" && bestAsk && bestBid ? ((bestAsk - bestBid) / bestAsk) * 100 : null;

  return (
    <div className={clsx("text-12 tabular-nums", className)}>
      <div
        className={clsx(
          COLS,
          "px-2 py-2 border-b border-secondary-border text-[11px] uppercase tracking-wide text-tertiary-text",
        )}
      >
        <span>
          {t("price")} <span className="hidden sm:inline normal-case">({quote})</span>
        </span>
        <span className="text-right">
          {variant === "pool" ? t("depth_size") : t("amount")}{" "}
          <span className="hidden sm:inline normal-case">({base})</span>
        </span>
        <span className="text-right">{t("depth_total")}</span>
      </div>

      {!book || empty ? (
        <p className="py-10 px-4 text-center text-14 text-tertiary-text">
          {loading ? t("loading") : emptyMessage}
        </p>
      ) : (
        <div className="pt-1">
          <ul aria-label={t("depth_asks")}>
            {[...asks].reverse().map((level) => (
              <Row key={`a${level.price}`} level={level} max={max} side="ask" />
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 px-2 my-1 h-9 rounded-2 bg-tertiary-bg">
            <span className="text-14 font-medium text-primary-text">{formatPrice(book.mid)}</span>
            <span className="text-tertiary-text">
              {variant === "pool"
                ? t("depth_pool_price")
                : spread !== null
                  ? `${t("depth_spread")} ${spread.toFixed(spread < 0.01 ? 4 : 3)}%`
                  : null}
            </span>
          </div>
          <ul aria-label={t("depth_bids")}>
            {bids.map((level) => (
              <Row key={`b${level.price}`} level={level} max={max} side="bid" />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ level, max, side }: { level: BookLevel; max: number; side: "ask" | "bid" }) {
  const width = max > 0 ? Math.min(100, (level.total / max) * 100) : 0;
  return (
    <li className={clsx(COLS, "relative px-2 h-7 items-center rounded-1 overflow-hidden")}>
      <span
        aria-hidden
        className={clsx(
          "absolute inset-y-0.5 right-0 rounded-1 duration-300",
          side === "ask" ? "bg-red-bg" : "bg-green-bg",
        )}
        style={{ width: `${width}%` }}
      />
      <span className={clsx("relative", side === "ask" ? "text-red-light" : "text-green")}>
        {formatPrice(level.price)}
      </span>
      <span className="relative text-right text-primary-text">
        {level.amount > 0 ? compact(level.amount) : "–"}
      </span>
      <span className="relative text-right text-secondary-text">{compact(level.total)}</span>
    </li>
  );
}
