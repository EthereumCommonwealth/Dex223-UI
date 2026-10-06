import "react-loading-skeleton/dist/skeleton.css";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { useCallback, useMemo, useState } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { Address } from "viem";

import { useTokenMeta } from "@/app/[locale]/statistics/tokenMeta";
import Svg from "@/components/atoms/Svg";
import TokenLogo from "@/components/atoms/TokenLogo";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonColor, ButtonSize, ButtonVariant } from "@/components/buttons/Button";
import { SortingType } from "@/components/buttons/IconButton";
import IconButton, {
  IconButtonSize,
  IconButtonVariant,
  IconSize,
} from "@/components/buttons/IconButton";
import Pagination from "@/components/common/Pagination";
import { FEE_AMOUNT_DETAIL } from "@/config/constants/liquidityFee";
import { formatNumberKilos } from "@/functions/formatFloat";
import { computePoolTVL } from "@/functions/poolTvl";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { usePoolsOnChainBalances } from "@/hooks/usePoolOnChainBalances";
import { Link, useRouter } from "@/i18n/routing";

import { usePoolPriceIndex, usePoolsData } from "./hooks";

function HeaderItem({
  isFirst = false,
  label,
  sorting,
  handleSort,
}: {
  isFirst?: boolean;
  label: string;
  handleSort?: () => void;
  sorting: SortingType;
}) {
  return (
    <div
      role={handleSort && "button"}
      onClick={handleSort}
      className={clsx(
        "h-[60px] flex items-center justify-end text-tertiary-text relative -left-3 mb-2",
        isFirst && "pl-2",
      )}
    >
      {handleSort && (
        <IconButton
          variant={IconButtonVariant.SORTING}
          buttonSize={IconButtonSize.SMALL}
          iconSize={IconSize.SMALL}
          sorting={sorting}
        />
      )}
      {label}
    </div>
  );
}

const PAGE_SIZE = 10;

// Reading balances costs a handful of contract calls per pool, so the fan-out is bounded.
// Anything past this keeps the subgraph's own figure; DEX223 is nowhere near the limit.
const MAX_ONCHAIN_BALANCE_POOLS = 200;

const MISSING_VALUE = "\u2013";

const renderTVL = (tvlUSD: number | undefined) =>
  tvlUSD === undefined ? MISSING_VALUE : `$${formatNumberKilos(tvlUSD)}`;

type PoolDayVolume = { volumeUSD?: string | number; date?: number | string };

const DAY_SECONDS = 86400;

// Most recent day bucket's volume. The query orders poolDayData by date desc.
const renderVolume1d = (poolDayData: PoolDayVolume[] | undefined) => {
  if (!Array.isArray(poolDayData)) return MISSING_VALUE;
  const value = parseFloat(String(poolDayData[0]?.volumeUSD ?? 0));
  return Number.isFinite(value) ? `$${formatNumberKilos(value)}` : MISSING_VALUE;
};

// Sum of the day buckets that fall inside the last 7 calendar days (UTC, the subgraph's
// day boundary). Days without swaps have no bucket, so an empty window is a real $0.
const renderVolume7d = (poolDayData: PoolDayVolume[] | undefined) => {
  if (!Array.isArray(poolDayData)) return MISSING_VALUE;
  const todayStart = Math.floor(Date.now() / 1000 / DAY_SECONDS) * DAY_SECONDS;
  const windowStart = todayStart - 6 * DAY_SECONDS;
  let total = 0;
  for (const day of poolDayData.slice(0, 7)) {
    if (Number(day?.date) < windowStart) continue;
    const value = parseFloat(String(day?.volumeUSD ?? 0));
    if (!Number.isFinite(value)) return MISSING_VALUE;
    total += value;
  }
  return `$${formatNumberKilos(total)}`;
};

const PoolsTableDesktop = ({
  tableData,
  currentPage,
  sorting,
  handleSort,
  isLoading = false,
}: {
  tableData: any[];
  currentPage: number;
  sorting: SortingType;
  handleSort: () => any;
  isLoading?: boolean;
}) => {
  const t = useTranslations("Liquidity");
  const chainId = useCurrentChainId();
  const tokenMeta = useTokenMeta();

  return (
    <div className="hidden lg:grid pr-3 pl-2 rounded-3 overflow-hidden bg-table-gradient grid-cols-[_minmax(20px,0.5fr),minmax(50px,2.67fr),_minmax(87px,1.33fr),_minmax(30px,1fr),_minmax(30px,1fr),_minmax(30px,1fr)] pb-2">
      <div className=" h-[60px] flex items-center justify-center  text-tertiary-text ">#</div>
      <div className=" h-[60px] flex items-center text-tertiary-text">{t("pool")}</div>
      <div className=" h-[60px] flex items-center justify-end  text-tertiary-text ">
        {t("transactions")}
      </div>
      <HeaderItem label="TVL" sorting={sorting} handleSort={handleSort} />
      <div className=" h-[60px] flex items-center justify-end text-tertiary-text ">
        {t("volume_1d")}
      </div>
      <div className=" h-[60px] flex items-center justify-end text-tertiary-text pr-2">
        {t("volume_7d")}
      </div>

      {isLoading
        ? [...Array(10)].map((row, index) => (
            <React.Fragment key={index}>
              <SkeletonTheme
                baseColor="#2E2F2F"
                highlightColor="#272727"
                borderRadius="0.5rem"
                duration={5}
              >
                <div className="h-[56px] flex justify-center items-center">
                  <Skeleton width={40} height={16} />
                </div>
                <div className="flex-nowrap flex flex-row h-[56px] gap-2 items-center">
                  <div className="flex relative flex-row h-[56px] w-[40px]">
                    <SkeletonTheme baseColor="#272727" highlightColor="#2E2F2F" duration={5}>
                      <div className=" absolute left-0 top-3">
                        <Skeleton enableAnimation={true} circle={true} width={24} height={24} />
                      </div>
                      <div className="absolute left-[12px] top-3">
                        <Skeleton enableAnimation={true} circle={true} width={24} height={24} />
                      </div>
                    </SkeletonTheme>
                  </div>
                  <Skeleton enableAnimation={true} width={236} height={16} />
                </div>
                <div className="h-[56px] flex justify-end items-center">
                  <Skeleton enableAnimation={true} width={44} height={16} />
                </div>
                <div className="h-[56px] flex justify-end items-center pr-1">
                  <Skeleton enableAnimation={true} width={54} height={16} />
                </div>
                <div className="h-[56px] flex justify-end items-center">
                  <Skeleton enableAnimation={true} width={68} height={16} />
                </div>
                <div className="h-[56px] flex justify-end items-center pr-4">
                  <Skeleton enableAnimation={true} width={60} height={16} />
                </div>
              </SkeletonTheme>
            </React.Fragment>
          ))
        : tableData.map((o: any, index: number) => {
            const { symbol: token0Symbol, image: token0Image } = tokenMeta(o.token0);
            const { symbol: token1Symbol, image: token1Image } = tokenMeta(o.token1);

            return (
              <Link
                href={`/pools/${chainId}/${o.id}`}
                className="contents group"
                key={o.id || index}
              >
                <div className="h-[56px] cursor-pointer flex items-center rounded-l-4 justify-center text-secondary-text group-hocus:bg-tertiary-bg">
                  {(currentPage - 1) * PAGE_SIZE + index + 1}
                </div>
                <div
                  className={`h-[56px] cursor-pointer flex pl-2 items-center group-hocus:bg-tertiary-bg`}
                >
                  <div className="flex items-center ">
                    <span className="w-[26px] h-[26px] rounded-full bg-primary-bg flex items-center justify-center overflow-hidden">
                      <TokenLogo
                        src={token0Image}
                        alt={token0Symbol}
                        size={24}
                        className="h-[24px] w-[24px] rounded-full"
                      />
                    </span>
                    <span className="w-[26px] h-[26px]   rounded-full bg-primary-bg flex items-center justify-center -ml-3.5 overflow-hidden">
                      <TokenLogo
                        src={token1Image}
                        alt={token1Symbol}
                        size={24}
                        className="h-[24px] w-[24px] rounded-full"
                      />
                    </span>
                  </div>
                  <span className="ml-3 mr-2">{`${truncateMiddle(token0Symbol, {
                    charsFromStart: 4,
                    charsFromEnd: 3,
                  })}/${truncateMiddle(token1Symbol, {
                    charsFromStart: 4,
                    charsFromEnd: 3,
                  })}`}</span>
                  <Badge
                    variant={BadgeVariant.PERCENTAGE}
                    percentage={`${(FEE_AMOUNT_DETAIL as any)[o.feeTier as any].label}%`}
                  />
                  <Svg iconName="next" className="ml-1 text-green group-hocus:block hidden" />
                </div>
                <div
                  className={`h-[56px] cursor-pointer flex justify-end items-center text-secondary-text pr-3 group-hocus:bg-tertiary-bg`}
                >
                  {formatNumberKilos(o.txCount, { significantDigits: 0 })}
                </div>
                <div
                  className={`h-[56px] cursor-pointer flex justify-end items-center text-secondary-text group-hocus:bg-tertiary-bg`}
                >
                  {renderTVL(o.tvlUSD)}
                </div>
                <div
                  className={`h-[56px] cursor-pointer flex justify-end items-center text-secondary-text group-hocus:bg-tertiary-bg`}
                >
                  {renderVolume1d(o.poolDayData)}
                </div>
                <div
                  className={`h-[56px] cursor-pointer flex justify-end items-center pr-4 rounded-r-4 text-secondary-text group-hocus:bg-tertiary-bg`}
                >
                  {renderVolume7d(o.poolDayData)}
                </div>
              </Link>
            );
          })}
    </div>
  );
};

const PoolsTableItemMobile = ({
  // key,
  pool,
  index,
}: {
  // key: any;
  pool: any;
  index: number;
}) => {
  const t = useTranslations("Liquidity");
  const chainId = useCurrentChainId();
  const tokenMeta = useTokenMeta();
  const token0 = tokenMeta(pool.token0);
  const token1 = tokenMeta(pool.token1);

  return (
    <React.Fragment key={index}>
      <div className="flex flex-col bg-primary-bg pt-3 px-4 pb-4 rounded-3 gap-3">
        <div className="flex justify-between gap-2">
          <div className="flex flex-row items-start gap-x-2 text-16">
            <TokenLogo src={token0.image} alt={token0.symbol} size={24} className="rounded-full" />
            <TokenLogo
              src={token1.image}
              alt={token1.symbol}
              size={24}
              className="ml-[-20px] bg-primary-bg rounded-full"
            />
            <span>{`${token0.symbol}/${token1.symbol}`}</span>
          </div>
          <div className="flex gap-2 items-baseline mt-0.5 justify-start mr-auto">
            <Badge
              // size="small"
              variant={BadgeVariant.PERCENTAGE}
              percentage={`${(FEE_AMOUNT_DETAIL as any)[pool.feeTier].label}%`}
            />
          </div>
          <span className="text-secondary-text items-baseline whitespace-nowrap font-normal">{`# ${index}`}</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between gap-x-2">
            <div className="flex w-full flex-col items-start bg-tertiary-bg rounded-2 px-4 py-[10px]">
              <span className="text-14 text-tertiary-text">{t("transactions")}</span>
              <span className="text-14 text-secondary-text">{formatNumberKilos(pool.txCount)}</span>
            </div>
            <div className="flex w-full flex-col items-start bg-tertiary-bg rounded-2 px-4 py-[10px]">
              <span className="text-14 text-tertiary-text">TVL</span>
              <span className="text-14 text-secondary-text">{renderTVL(pool.tvlUSD)}</span>
            </div>
            {/*<div className="flex w-full flex-col items-start gap-1 bg-tertiary-bg rounded-2 px-4 py-[10px]">*/}
            {/*  <span className="text-12 text-secondary-text">Turnover</span>*/}
            {/*  <span className="text-12">{`— %`}</span>*/}
            {/*</div>*/}
          </div>
          <div className="flex justify-between gap-x-2 pb-1">
            <div className="flex w-full flex-col items-start bg-tertiary-bg rounded-2 px-4 py-[10px]">
              <span className="text-14 text-tertiary-text">{t("volume_1d")}</span>
              <span className="text-14 text-secondary-text">
                {renderVolume1d(pool.poolDayData)}
              </span>
            </div>
            <div className="flex w-full flex-col items-start bg-tertiary-bg rounded-2 px-4 py-[10px]">
              <span className="text-14 text-tertiary-text">{t("volume_7d")}</span>
              <span className="text-14 text-secondary-text">
                {renderVolume7d(pool.poolDayData)}
              </span>
            </div>
          </div>
        </div>

        <Link href={`/pools/${chainId}/${pool.id}`}>
          <Button
            variant={ButtonVariant.CONTAINED}
            colorScheme={ButtonColor.LIGHT_GREEN}
            size={ButtonSize.MEDIUM}
          >
            {t("view_pool")}
          </Button>
        </Link>
      </div>
    </React.Fragment>
  );
};

const PoolsTableMobile = ({
  tableData,
  currentPage,
  handleSort,
  sorting,
  isLoading = false,
}: {
  tableData: any[];
  currentPage: number;
  handleSort: () => any;
  sorting: SortingType;
  isLoading?: boolean;
}) => {
  return (
    <>
      <div
        className="flex mb-4 gap-2 text-secondary-text flex-row cursor-pointer lg:hidden"
        onClick={handleSort}
      >
        <span className={sorting === SortingType.NONE ? "text-secondary-text" : "text-green"}>
          TVL
        </span>
        <Svg
          iconName={sorting === SortingType.ASCENDING ? "sort-up" : "sort-down"}
          className={sorting === SortingType.NONE ? "text-secondary-text" : "text-green"}
        />
      </div>
      <div className="flex lg:hidden flex-col gap-4">
        {/* Without this the cards render their TVL before the price index lands, which is
            the one number they exist to show and the one that changes once it does. */}
        {isLoading
          ? [...Array(5)].map((_, index) => (
              <div
                key={index}
                className="h-[148px] bg-primary-bg rounded-3 motion-safe:animate-pulse"
              />
            ))
          : tableData.map((pool: any, index: number) => {
              return (
                <PoolsTableItemMobile
                  key={pool.id || index}
                  index={(currentPage - 1) * PAGE_SIZE + index + 1}
                  pool={pool}
                />
              );
            })}
      </div>
    </>
  );
};

function localSorting(data: any[], sorting: SortingType): any[] {
  const arrayForSort = [...data];

  if (sorting === SortingType.NONE) {
    return arrayForSort;
  }

  const direction = sorting === SortingType.DESCENDING ? -1 : 1;

  arrayForSort.sort((a, b) => {
    if (a.tvlUSD === undefined || b.tvlUSD === undefined) {
      return (a.tvlUSD === undefined ? 1 : 0) - (b.tvlUSD === undefined ? 1 : 0);
    }

    return direction * (a.tvlUSD - b.tvlUSD);
  });

  return arrayForSort;
}

export default function PoolsTable({
  filter,
}: {
  filter?: {
    token0Address?: Address;
    token1Address?: Address;
    searchString?: string;
  };
}) {
  const [sorting, setSorting] = useState<SortingType>(SortingType.NONE);
  const t = useTranslations("Liquidity");

  const handleSort = useCallback(() => {
    switch (sorting) {
      case SortingType.NONE:
        setSorting(SortingType.DESCENDING);
        return;
      case SortingType.DESCENDING:
        setSorting(SortingType.ASCENDING);
        return;
      case SortingType.ASCENDING:
        setSorting(SortingType.NONE);
        return;
    }
  }, [sorting]);

  const [currentPage, setCurrentPage] = useState(1);

  const chainId = useCurrentChainId();
  const { data, loading, error, refetch } = usePoolsData({
    chainId,
    orderDirection: undefined, //sorting],
    filter,
  });
  const { priceIndex, loading: pricesLoading } = usePoolPriceIndex(chainId);

  const poolAddresses = useMemo(
    () =>
      (data?.pools || [])
        .slice(0, MAX_ONCHAIN_BALANCE_POOLS)
        .map((pool: any) => pool.id as Address),
    [data?.pools],
  );

  // Same reason the pool page reads balances on-chain: the subgraph's per-token totals
  // drift from what a pool holds, and valuing the drift is what makes a $423 pool read
  // $827. The list has to read them too, or its rows contradict the page they open.
  const { balances: onChainBalances, isLoading: balancesLoading } = usePoolsOnChainBalances({
    poolAddresses,
    chainId,
  });

  const pools: any[] = useMemo(() => {
    // The subgraph also prices every pool with one global price per token, which overstates
    // any pool trading away from that price - see computePoolTVL. Chains with no stablecoin
    // to anchor on have nothing better to offer, so they keep the subgraph's figure.
    const pools = (data?.pools || []).map((pool: any) => {
      const balances = onChainBalances[pool.id?.toLowerCase()];

      return {
        ...pool,
        tvlUSD: computePoolTVL({
          pool,
          balance0: balances?.token0.formatted,
          balance1: balances?.token1.formatted,
          priceIndex,
        }),
      };
    });

    return localSorting(pools, sorting);
  }, [data?.pools, onChainBalances, priceIndex, sorting]);

  const isLoading = loading || pricesLoading || balancesLoading;

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * PAGE_SIZE;
    const lastPageIndex = firstPageIndex + PAGE_SIZE;
    return pools.slice(firstPageIndex, lastPageIndex);
  }, [pools, currentPage]);

  return (
    <>
      <div className="min-h-[640px] mb-5 w-full">
        <>
          {error && pools.length === 0 ? (
            <div className="min-h-[340px] bg-primary-bg flex flex-col gap-4 items-center justify-center w-full rounded-5 px-4 text-center">
              <p className="text-secondary-text">{t("pools_load_error")}</p>
              <Button
                size={ButtonSize.MEDIUM}
                colorScheme={ButtonColor.LIGHT_GREEN}
                onClick={() => refetch()}
              >
                {t("try_again")}
              </Button>
            </div>
          ) : isLoading || pools.length > 0 ? (
            <>
              <PoolsTableDesktop
                isLoading={isLoading}
                tableData={currentTableData}
                sorting={sorting}
                currentPage={currentPage}
                handleSort={handleSort}
              />
              <PoolsTableMobile
                isLoading={isLoading}
                tableData={currentTableData}
                sorting={sorting}
                currentPage={currentPage}
                handleSort={handleSort}
              />
            </>
          ) : (
            <div className="min-h-[340px] bg-primary-bg flex items-center justify-center w-full rounded-5 bg-empty-not-found-pools bg-right-top bg-no-repeat max-md:bg-size-180">
              <p className="text-secondary-text">{t("pools_not_found")}</p>
            </div>
          )}
        </>
        {/*)}*/}
      </div>

      <Pagination
        isLoading={isLoading}
        className="pagination-bar"
        currentPage={currentPage}
        totalCount={pools.length}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => setCurrentPage(page as number)}
      />
    </>
  );
}
