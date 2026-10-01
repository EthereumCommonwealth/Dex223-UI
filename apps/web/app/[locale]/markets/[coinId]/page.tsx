"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { use, useState } from "react";

import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import TokenLogo from "@/components/atoms/TokenLogo";
import { NotFoundError, useCoin } from "@/components/markets/api";
import CoinChart from "@/components/markets/CoinChart";
import { Bar } from "@/components/trading-chart/datafeed/types";
import { compact, formatPercent, formatPrice } from "@/components/trading-chart/format";
import { Link } from "@/i18n/routing";

const usd = (v: number | null | undefined) =>
  v === null || v === undefined ? "–" : `$${formatPrice(v)}`;
const usdCompact = (v: number | null | undefined) =>
  v === null || v === undefined ? "–" : `$${compact(v)}`;

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export default function CoinPage({ params }: { params: Promise<{ coinId: string }> }) {
  const { coinId } = use(params);
  const t = useTranslations("Markets");
  const { data: coin, error, isLoading } = useCoin(coinId);
  const [liveBar, setLiveBar] = useState<Bar | null>(null);

  if (error instanceof NotFoundError || (!isLoading && !coin)) {
    return (
      <Container>
        <div className="py-16 text-center">
          <p className="text-20 text-primary-text mb-3">
            {error instanceof NotFoundError ? t("not_found") : t("unavailable")}
          </p>
          <Link href="/markets" className="text-green hocus:text-green-hover">
            {t("back")}
          </Link>
        </div>
      </Container>
    );
  }

  // The chart's live bar is fresher than the listing, which refreshes every few minutes.
  const price = liveBar?.close ?? coin?.price ?? null;
  const change = coin?.change_24h ?? null;
  const fromAth = coin?.ath && price ? ((price - coin.ath) / coin.ath) * 100 : null;
  const source = coin?.binance_symbol ? `Binance ${coin.binance_symbol}` : "CoinGecko";

  return (
    <Container>
      <div className="py-4 md:py-6">
        <Link
          href="/markets"
          className="inline-flex items-center gap-1 text-14 text-secondary-text hocus:text-primary-text duration-200 mb-4"
        >
          <Svg iconName="back" size={20} />
          {t("back")}
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
          <div className="flex flex-col gap-5 min-w-0">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-3">
                {coin ? (
                  <TokenLogo
                    src={coin.image}
                    alt={coin.symbol}
                    size={40}
                    className="rounded-full w-10 h-10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-tertiary-bg animate-pulse" />
                )}
                <div>
                  <h1 className="text-20 md:text-24 font-medium text-primary-text leading-tight">
                    {coin?.name ?? " "}{" "}
                    <span className="text-16 text-tertiary-text font-normal">{coin?.symbol}</span>
                  </h1>
                  {coin?.rank && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-1 bg-tertiary-bg text-12 text-secondary-text">
                      {t("rank", { rank: coin.rank })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-32 font-medium text-primary-text tabular-nums">
                  {usd(price)}
                </span>
                {change !== null && (
                  <span
                    className={clsx(
                      "px-2 py-0.5 rounded-2 text-14 font-medium tabular-nums",
                      change >= 0 ? "bg-green-bg text-green" : "bg-red-bg text-red-light",
                    )}
                  >
                    {formatPercent(change)} <span className="text-12 opacity-70">24h</span>
                  </span>
                )}
              </div>
            </div>

            {coin && (
              <CoinChart
                symbol={coin.chart_symbol}
                label={`${coin.symbol}/USD`}
                volumeUnit={coin.symbol}
                sourceLong={`${t("chart_source", { source })} · ${t("attribution")}`}
                onLastBar={setLiveBar}
              />
            )}
          </div>

          {/* Stats */}
          <aside className="flex flex-col gap-3">
            <div className="bg-primary-bg rounded-5 p-5">
              <RangeBar
                label={t("range_24h")}
                low={coin?.low_24h ?? null}
                high={coin?.high_24h ?? null}
                value={price}
              />
            </div>
            <div className="bg-primary-bg rounded-5 p-5 flex flex-col gap-3 text-14">
              <StatRow label={t("market_cap")} value={usdCompact(coin?.market_cap)} />
              <StatRow label={t("fdv")} value={usdCompact(coin?.fdv)} />
              <StatRow label={t("volume_24h")} value={usdCompact(coin?.volume_24h)} />
              <StatRow
                label={t("volume_market_cap")}
                value={
                  coin?.volume_24h && coin.market_cap
                    ? `${((coin.volume_24h / coin.market_cap) * 100).toFixed(2)}%`
                    : "–"
                }
              />
            </div>
            <div className="bg-primary-bg rounded-5 p-5 flex flex-col gap-3 text-14">
              <StatRow
                label={t("circulating")}
                value={
                  coin?.circulating_supply
                    ? `${compact(coin.circulating_supply)} ${coin.symbol}`
                    : "–"
                }
              />
              {coin?.circulating_supply && coin.max_supply ? (
                <div className="h-1.5 rounded-full bg-tertiary-bg overflow-hidden -mt-1">
                  <div
                    className="h-full bg-green rounded-full"
                    style={{
                      width: `${Math.min(100, (coin.circulating_supply / coin.max_supply) * 100)}%`,
                    }}
                  />
                </div>
              ) : null}
              <StatRow
                label={t("total_supply")}
                value={coin?.total_supply ? `${compact(coin.total_supply)} ${coin.symbol}` : "–"}
              />
              <StatRow
                label={t("max_supply")}
                value={coin?.max_supply ? `${compact(coin.max_supply)} ${coin.symbol}` : "∞"}
              />
            </div>
            <div className="bg-primary-bg rounded-5 p-5 flex flex-col gap-3 text-14">
              <StatRow
                label={t("ath")}
                value={usd(coin?.ath)}
                detail={
                  coin?.ath
                    ? `${formatDate(coin.ath_date)}${fromAth !== null ? ` · ${t("from_ath", { percent: formatPercent(fromAth) })}` : ""}`
                    : undefined
                }
              />
              <StatRow
                label={t("atl")}
                value={usd(coin?.atl)}
                detail={formatDate(coin?.atl_date ?? null) || undefined}
              />
            </div>
          </aside>
        </div>
      </div>
    </Container>
  );
}

function StatRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-tertiary-text">{label}</span>
      <span className="text-right">
        <span className="block text-primary-text tabular-nums">{value}</span>
        {detail && <span className="block text-12 text-tertiary-text">{detail}</span>}
      </span>
    </div>
  );
}

function RangeBar({
  label,
  low,
  high,
  value,
}: {
  label: string;
  low: number | null;
  high: number | null;
  value: number | null;
}) {
  const position =
    low !== null && high !== null && value !== null && high > low
      ? Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100))
      : null;
  return (
    <div>
      <div className="text-14 text-tertiary-text mb-3">{label}</div>
      <div className="relative h-1.5 rounded-full bg-gradient-to-r from-red via-yellow-light to-green">
        {position !== null && (
          <span
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary-text border-2 border-primary-bg"
            style={{ left: `${position}%` }}
          />
        )}
      </div>
      <div className="flex justify-between mt-2 text-12 tabular-nums text-secondary-text">
        <span>{low !== null ? `$${formatPrice(low)}` : "–"}</span>
        <span>{high !== null ? `$${formatPrice(high)}` : "–"}</span>
      </div>
    </div>
  );
}
