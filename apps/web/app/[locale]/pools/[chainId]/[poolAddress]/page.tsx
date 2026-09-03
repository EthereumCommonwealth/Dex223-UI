"use client";
import "react-loading-skeleton/dist/skeleton.css";

import Image from "next/image";
import { useTranslations } from "next-intl";
import React from "react";
import { use, useMemo } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { useMediaQuery } from "react-responsive";
import { Address } from "viem";

import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonColor } from "@/components/buttons/Button";
import IconButton, {
  IconButtonSize,
  IconButtonVariant,
  IconSize,
} from "@/components/buttons/IconButton";
import SelectedTokensInfo from "@/components/common/SelectedTokensInfo";
import TokensPair from "@/components/common/TokensPair";
import { FEE_AMOUNT_DETAIL } from "@/config/constants/liquidityFee";
import { clsxMerge } from "@/functions/clsxMerge";
import { formatNumberKilos } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import { computePoolTVL } from "@/functions/poolTvl";
import { renderShortAddress } from "@/functions/renderAddress";
import { PoolTokenBalance, usePoolOnChainBalances } from "@/hooks/usePoolOnChainBalances";
import { useTokens } from "@/hooks/useTokenLists";
import { Link, useRouter } from "@/i18n/routing";
import { DexChainId } from "@/sdk_bi/chains";

import { usePoolData, usePoolPriceIndex } from "../../hooks";

export default function ExplorePoolPage({
  params,
}: {
  params: Promise<{
    chainId: string;
    poolAddress: string;
  }>;
}) {
  const { chainId, poolAddress } = use(params);
  const router = useRouter();
  const t = useTranslations("Liquidity");
  const tn = useTranslations("Navigation");
  const isMobile = useMediaQuery({ query: "(max-width: 640px)" });

  const tokens = useTokens();
  // const loading = true;
  const { data, loading } = usePoolData({
    chainId,
    poolAddress,
  } as any);

  const { pool } = data || { pool: undefined };

  // Balances are read from the token contracts rather than taken from the subgraph's
  // totalValueLockedToken0/1, which are running sums of event amounts and drift away
  // from what the pool actually holds whenever an event and its transfers disagree.
  const { balances, isLoading: balancesLoading } = usePoolOnChainBalances({
    poolAddress: poolAddress as Address,
    chainId: Number(chainId) as DexChainId,
  });

  const { priceIndex, loading: pricesLoading } = usePoolPriceIndex(Number(chainId) as DexChainId);

  const balancesPending = loading || balancesLoading;

  const tokenA = tokens.find((t) => t.wrapped.address0.toLowerCase() === pool?.token0?.id);
  const tokenB = tokens.find((t) => t.wrapped.address0.toLowerCase() === pool?.token1?.id);

  const valuePercent = balances
    ? (balances.token0.formatted * 100) / (balances.token0.formatted + balances.token1.formatted)
    : 0;

  // On-chain balances valued at the pool's own spot price. The subgraph's own
  // totalValueLockedUSD prices this pair off whichever pool it considers deepest, which is
  // how a pool holding $2.40 comes to report $16.3K - see computePoolTVL. Chains with no
  // stablecoin to anchor on have nothing better to offer, so they keep that figure.
  const totalValueLockedUSD = useMemo(() => {
    if (!pool || !balances || pricesLoading) {
      return undefined;
    }

    return computePoolTVL({
      pool,
      balance0: balances.token0.formatted,
      balance1: balances.token1.formatted,
      priceIndex,
    });
  }, [balances, pool, priceIndex, pricesLoading]);

  const renderBalance = (balance: PoolTokenBalance | undefined) =>
    balance ? formatNumberKilos(balance.formatted) : "\u2014";

  return (
    <Container>
      <SkeletonTheme
        baseColor="#1D1E1E"
        highlightColor="#272727"
        borderRadius="20px"
        enableAnimation={false}
        // duration={5}
      >
        <div className="w-full md:w-[800px] md:mx-auto md:mt-[40px] mb-5 bg-primary-bg px-4 lg:px-10 pb-4 lg:pb-10 rounded-5">
          {/* First line:  Icons | Tokens | Badge | Link */}
          <div className="flex justify-between items-center py-1.5 -mx-3">
            <IconButton
              variant={IconButtonVariant.BACK}
              iconSize={IconSize.REGULAR}
              buttonSize={IconButtonSize.LARGE}
              onClick={() => router.push("/pools")}
            />
            <h2 className="text-18 lg:text-20 font-bold">{t("stats_title")}</h2>
            <div className="w-12"></div>
          </div>
          <div className="bg-tertiary-bg rounded-[12px] p-4 lg:p-5">
            <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
              {loading ? (
                <div className="md:flex-nowrap flex-wrap flex flex-row gap-2 items-center md:mb-1">
                  <div className="flex relative flex-row h-[32px] w-[50px]">
                    <div className=" absolute left-0 ">
                      <Skeleton circle={true} width={32} height={32} />
                    </div>
                    <div className="absolute left-[18px]">
                      <Skeleton circle={true} width={32} height={32} />
                    </div>
                  </div>
                  <div className="flex items-center mt-1">
                    <Skeleton width={isMobile ? 146 : 180} height={18} />
                  </div>
                  <div className="flex items-center">
                    <Skeleton width={153} height={24} />
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 items-start lg:items-center">
                  <TokensPair tokenA={pool?.token0} tokenB={pool?.token1} />
                  <Badge
                    className="mt-1 md:mt-0"
                    variant={BadgeVariant.PERCENTAGE}
                    percentage={`${(FEE_AMOUNT_DETAIL as any)[pool?.feeTier as any]?.label}%`}
                  />
                </div>
              )}

              {!loading && (
                <a
                  target="_blank"
                  href={getExplorerLink(ExplorerLinkType.ADDRESS, pool?.id, chainId as any)}
                  className="w-max"
                >
                  <div className="flex items-center duration-200 gap-1 bg-quaternary-bg rounded-[8px] px-2 py-0.5 text-secondary-text hocus:text-primary-text hocus:bg-erc-20-bg ">
                    <span className="text-14">
                      {renderShortAddress(pool?.id?.toUpperCase().replace("0X", "0x"))}
                    </span>
                    <Svg iconName="forward" size={20} />
                  </div>
                </a>
              )}
            </div>

            {/* Inner line:  Pool balances */}
            <div
              className={clsxMerge(
                "flex flex-col mt-4 bg-quaternary-bg px-5 py-4 rounded-[12px] gap-3",
                balancesPending && "bg-primary-bg",
              )}
            >
              <SkeletonTheme
                baseColor="#272727"
                highlightColor="#1D1E1E"
                borderRadius="20px"
                enableAnimation={false}
                // duration={5}
              >
                {balancesPending ? (
                  <Skeleton width={112} height={16} />
                ) : (
                  <span className="font-bold text-secondary-text">{t("pool_balances_title")}</span>
                )}
                <div className="flex justify-between">
                  {balancesPending ? (
                    <>
                      {isMobile ? (
                        <div className="flex gap-2 items-center -mt-2">
                          <Skeleton circle width={32} height={32} />
                          <div className="flex flex-col mt-1">
                            <Skeleton width={56} height={14} />
                            <div className="-mt-2">
                              <Skeleton width={32} height={12} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <Skeleton width={40} height={16} />
                          <Skeleton circle width={24} height={24} />
                          <Skeleton width={60} height={16} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <span className="text-12 lg:text-16 font-bold text-primary-text">
                        {renderBalance(balances?.token0)}
                      </span>
                      <Image
                        src="/images/tokens/placeholder.svg"
                        alt="Ethereum"
                        width={24}
                        height={24}
                        className="h-[32px] w-[32px] md:h-[24px] md:w-[24px]"
                      />
                      <div className="flex flex-col lg:flex-row lg:gap-2">
                        <span className="text-14 lg:text-16 font-medium text-secondary-text">
                          {pool?.token0?.symbol}
                        </span>
                      </div>
                    </div>
                  )}
                  {balancesPending ? (
                    <>
                      {isMobile ? (
                        <div className="flex gap-2 items-center -mt-2">
                          <Skeleton circle width={32} height={32} />
                          <div className="flex flex-col mt-1">
                            <Skeleton width={56} height={14} />
                            <div className="-mt-2">
                              <Skeleton width={32} height={12} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <Skeleton width={40} height={16} />
                          <Skeleton circle width={24} height={24} />
                          <Skeleton width={60} height={16} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <span className="text-12 lg:text-16 font-bold text-primary-text">
                        {renderBalance(balances?.token1)}
                      </span>
                      <Image
                        src="/images/tokens/placeholder.svg"
                        alt="Ethereum"
                        width={24}
                        height={24}
                        className="h-[32px] w-[32px] md:h-[24px] md:w-[24px]"
                      />
                      <div className="flex flex-col lg:flex-row lg:gap-2">
                        <span className="text-14 lg:text-16 font-medium text-secondary-text">
                          {pool?.token1?.symbol}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={clsxMerge(
                    "bg-green h-2 w-full rounded-[20px] overflow-hidden",
                    balancesPending && "bg-tertiary-bg",
                    isMobile && "-mt-2",
                  )}
                >
                  {!balancesPending && (
                    <div
                      className="bg-purple h-2 "
                      style={{
                        width:
                          valuePercent < 1 ? `1%` : valuePercent > 99 ? `99%` : `${valuePercent}%`,
                      }}
                    />
                  )}
                </div>
              </SkeletonTheme>
            </div>
          </div>

          {/* Buttons line:  SWAP | Add liquidity */}
          {loading ? (
            <SkeletonTheme
              baseColor="#272727"
              highlightColor="#1D1E1E"
              borderRadius="12px"
              enableAnimation={false}
              // duration={5}
            >
              <div className="flex flex-col lg:flex-row gap-1 lg:gap-3 mt-4 lg:mt-3">
                <Skeleton width={isMobile ? undefined : 354} height={isMobile ? 48 : 60} />
                <Skeleton width={isMobile ? undefined : 354} height={isMobile ? 48 : 60} />
              </div>
            </SkeletonTheme>
          ) : (
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 mt-4 lg:mt-4">
              <Link
                href={`/swap?tokenA=${pool?.token0?.id}&tokenB=${pool?.token1?.id}`}
                className="w-full"
              >
                <Button colorScheme={ButtonColor.LIGHT_GREEN} fullWidth>
                  <span className="flex items-center gap-2">
                    {tn("swap")}
                    <Svg iconName="swap" />
                  </span>
                </Button>
              </Link>
              <Link
                href={`/add?tier=${pool.feeTier}&tokenA=${pool?.token0?.id}&tokenB=${pool?.token1?.id}&chainId=${chainId}`}
                className="w-full"
              >
                <Button fullWidth>
                  <span className="flex items-center gap-2">
                    {t("add_liquidity_title")}
                    <Svg iconName="add" />
                  </span>
                </Button>
              </Link>
            </div>
          )}

          {/* Last line:  TVL | 24H Volume | 24H Fees */}
          {loading ? (
            <div className="flex flex-col lg:flex-row w-full justify-between gap-2 lg:gap-3 mt-4 md:h-[94px]">
              {[...Array(3)].map((row, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-1 bg-tertiary-bg rounded-[12px] px-5 pb-[10px] pt-3.5 w-full"
                >
                  <div className="md:mt-1">
                    <Skeleton width={60} height={isMobile ? 14 : 16} />
                  </div>
                  <div className="flex flex-row gap-2 items-center md:mt-0 -mt-2">
                    <Skeleton width={120} height={isMobile ? 20 : 24} />
                    <div className="md:mt-1 mt-1.5">
                      <Skeleton width={40} height={isMobile ? 14 : 16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row w-full justify-between gap-2 lg:gap-3 mt-4 md:h-[94px]">
              <div className="flex flex-col gap-1 bg-tertiary-bg rounded-[12px] px-5 pb-[10px] pt-3.5 w-full">
                <span className="text-secondary-text text-14 lg:text-16">{t("tvl_title")}</span>
                <span className="text-20 lg:text-24 font-medium">
                  {totalValueLockedUSD !== undefined
                    ? `$${formatNumberKilos(totalValueLockedUSD)}`
                    : "\u2014"}
                </span>
              </div>
              <div className="flex flex-col gap-1 bg-tertiary-bg rounded-[12px] px-5 pb-[10px] pt-3.5 w-full">
                <span className="text-secondary-text text-14 lg:text-16">{t("day_volume")}</span>
                <span className="text-20 lg:text-24 font-medium">{`$${formatNumberKilos(pool?.poolDayData?.[0]?.volumeUSD || 0)}`}</span>
              </div>
              <div className="flex flex-col gap-1 bg-tertiary-bg rounded-[12px] px-5 pb-[10px] pt-3.5 w-full">
                <span className="text-secondary-text text-14 lg:text-16">{t("day_fees")}</span>
                <span className="text-20 lg:text-24 font-medium">{`$${formatNumberKilos(pool?.poolDayData?.[0]?.feesUSD || 0)}`}</span>
              </div>
            </div>
          )}
        </div>
        <div className="lg:w-[800px] lg:mx-auto lg:mb-[40px] gap-5 flex flex-col">
          <SelectedTokensInfo tokenA={tokenA} tokenB={tokenB} />
        </div>
      </SkeletonTheme>
    </Container>
  );
}
