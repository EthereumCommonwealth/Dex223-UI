"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";

import OrderBook from "@/components/trading-chart/depth/OrderBook";
import { useExchangeBook } from "@/components/trading-chart/depth/useExchangeBook";

const QUOTES = ["FDUSD", "USDT", "USDC", "TUSD", "BUSD", "DAI"];

/** ETHUSDT -> ["ETH", "USDT"]. The market API only maps coins to dollar-quoted pairs. */
function splitPair(pair: string): [string, string] {
  const quote = QUOTES.find((q) => pair.endsWith(q) && pair.length > q.length);
  return quote ? [pair.slice(0, -quote.length), quote] : [pair, ""];
}

/** Live Binance order book for a coin page. `pair` is the Binance symbol, e.g. ETHUSDT. */
export default function OrderBookCard({ pair }: { pair: string }) {
  const [base, quote] = splitPair(pair);
  const t = useTranslations("TradingChart");
  const { book, status } = useExchangeBook(pair, 8);
  const live = status === "live" || status === "polling";

  return (
    <section className="bg-primary-bg rounded-5 p-4 md:p-5" aria-label={t("order_book")}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="text-16 font-medium text-primary-text">{t("order_book")}</h2>
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 text-12",
            live ? "text-green" : "text-tertiary-text",
          )}
        >
          <span
            className={clsx(
              "w-1.5 h-1.5 rounded-full",
              live ? "bg-green" : "bg-tertiary-text",
              status === "live" && "animate-pulse",
            )}
          />
          {`Binance ${pair}`}
        </span>
      </div>
      <OrderBook
        book={book}
        base={base}
        quote={quote}
        rows={8}
        loading={status === "loading"}
        emptyMessage={t("book_unavailable")}
        variant="exchange"
        className="-mx-2"
      />
    </section>
  );
}
