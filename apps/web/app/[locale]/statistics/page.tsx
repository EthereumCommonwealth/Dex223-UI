"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";
import { getAddress } from "viem";

import { usePoolsData } from "@/app/[locale]/pools/hooks";
import { useFactoryStats } from "@/app/[locale]/statistics/hooks";
import Container from "@/components/atoms/Container";
import { FEE_AMOUNT_DETAIL } from "@/config/constants/liquidityFee";
import { formatNumberKilos } from "@/functions/formatFloat";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { Link } from "@/i18n/routing";
import { FeeAmount } from "@/sdk_bi/constants";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-primary-bg rounded-5 px-5 py-4 flex flex-col gap-1">
      <span className="text-14 text-secondary-text">{label}</span>
      <span className="text-24 font-medium text-primary-text">{value}</span>
    </div>
  );
}

function poolTokenMeta(token: { id: string; symbol: string; addressERC223?: string | null }): {
  symbol: string;
  image: string;
} {
  let symbol = token.symbol;
  let image = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${getAddress(token.id)}/logo.png`;

  const d223 = "0x0908078Da2935A14BC7a17770292818C85b580dd";
  if (token.addressERC223 === d223.toLowerCase()) {
    symbol = "D223";
    image = "/images/tokens/DEX.svg";
  }

  const weth9 = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  if (token.id === weth9.toLowerCase()) {
    symbol = "ETH";
    image = "/images/tokens/ETH.svg";
  }

  return { symbol, image };
}

export default function StatisticsPage() {
  const t = useTranslations("Statistics");
  const chainId = useCurrentChainId();
  const {
    data: factoryData,
    loading: factoryLoading,
    error: factoryError,
  } = useFactoryStats(chainId);
  const {
    data: poolsData,
    loading: poolsLoading,
    error: poolsError,
  } = usePoolsData({
    first: 10,
    orderDirection: "desc",
    chainId,
  });

  const factory = factoryData?.factories?.[0];
  const pools = useMemo(() => poolsData?.pools ?? [], [poolsData?.pools]);
  const loading = factoryLoading || poolsLoading;
  const hasError = Boolean(factoryError || poolsError);
  const hasFactory = Boolean(factory);

  return (
    <Container>
      <div className="md:py-5 py-4">
        <h1 className="mb-2 text-24 lg:text-40">{t("title")}</h1>
        <p className="text-secondary-text text-14 md:text-16 mb-5">{t("description")}</p>

        {hasError && !hasFactory ? (
          <div className="bg-primary-bg rounded-5 px-5 py-8 text-center text-secondary-text">
            {t("unavailable")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6">
              <StatCard
                label={t("tvl")}
                value={
                  loading && !factory
                    ? "—"
                    : `$${formatNumberKilos(Number(factory?.totalValueLockedUSD ?? 0))}`
                }
              />
              <StatCard
                label={t("volume")}
                value={
                  loading && !factory
                    ? "—"
                    : `$${formatNumberKilos(Number(factory?.totalVolumeUSD ?? 0))}`
                }
              />
              <StatCard
                label={t("pools")}
                value={
                  loading && !factory ? "—" : formatNumberKilos(Number(factory?.poolCount ?? 0))
                }
              />
              <StatCard
                label={t("transactions")}
                value={loading && !factory ? "—" : formatNumberKilos(Number(factory?.txCount ?? 0))}
              />
            </div>

            <div className="bg-primary-bg rounded-5 overflow-hidden">
              <div className="px-5 py-4 border-b border-secondary-border flex items-center justify-between">
                <h2 className="text-18 md:text-20 font-medium">{t("top_pools")}</h2>
                <Link
                  href="/pools"
                  className="text-14 text-green hocus:text-green-hover duration-200"
                >
                  {t("view_all_pools")}
                </Link>
              </div>

              {loading && pools.length === 0 ? (
                <div className="px-5 py-8 text-center text-secondary-text">{t("loading")}</div>
              ) : pools.length === 0 ? (
                <div className="px-5 py-8 text-center text-secondary-text">{t("no_pools")}</div>
              ) : (
                <div className="divide-y divide-secondary-border">
                  {pools.map((pool: any, index: number) => {
                    const token0 = poolTokenMeta(pool.token0);
                    const token1 = poolTokenMeta(pool.token1);
                    const feeLabel =
                      FEE_AMOUNT_DETAIL[pool.feeTier as FeeAmount]?.label ??
                      String(Number(pool.feeTier) / 10000);

                    return (
                      <Link
                        key={pool.id}
                        href={`/pools/${chainId}/${pool.id}`}
                        className="flex items-center gap-3 px-5 py-3 hocus:bg-tertiary-bg duration-200"
                      >
                        <span className="text-secondary-text w-6 shrink-0 text-14">
                          {index + 1}
                        </span>
                        <div className="relative w-10 h-6 shrink-0">
                          <span className="absolute left-0 top-0 w-6 h-6 rounded-full overflow-hidden bg-secondary-bg">
                            <Image
                              src={token0.image}
                              alt={token0.symbol}
                              width={24}
                              height={24}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/images/tokens/placeholder.svg";
                              }}
                            />
                          </span>
                          <span className="absolute left-3 top-0 w-6 h-6 rounded-full overflow-hidden bg-secondary-bg">
                            <Image
                              src={token1.image}
                              alt={token1.symbol}
                              width={24}
                              height={24}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/images/tokens/placeholder.svg";
                              }}
                            />
                          </span>
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="text-14 md:text-16 font-medium truncate">
                            {token0.symbol} / {token1.symbol}
                          </div>
                          <div className="text-12 text-secondary-text">{feeLabel}%</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-14 md:text-16 font-medium">
                            ${formatNumberKilos(Number(pool.totalValueLockedUSD))}
                          </div>
                          <div className="text-12 text-secondary-text">{t("tvl")}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Container>
  );
}
