import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useCallback, useMemo, useState } from "react";
import { Address } from "viem";

import Preloader from "@/components/atoms/Preloader";
import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonColor, ButtonSize, ButtonVariant } from "@/components/buttons/Button";
import IconButton, {
  IconButtonSize,
  IconButtonVariant,
  IconSize,
} from "@/components/buttons/IconButton";
import Pagination from "@/components/common/Pagination";
import { FEE_AMOUNT_DETAIL } from "@/config/constants/liquidityFee";
import { formatFloat } from "@/functions/formatFloat";
import { formatNumberKilos } from "@/functions/formatFloat";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useRouter } from "@/i18n/routing";

import { usePoolsData } from "./hooks";

export enum SortingType {
  NONE,
  ASCENDING,
  DESCENDING,
}

const GQLSorting: { [index: number]: "asc" | "desc" | undefined } = {
  [SortingType.NONE]: undefined,
  [SortingType.ASCENDING]: "asc",
  [SortingType.DESCENDING]: "desc",
};

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

const PoolsTableDesktop = ({
  tableData,
  currentPage,
  sorting,
  handleSort,
  openPoolHandler,
}: {
  tableData: any[];
  currentPage: number;
  sorting: SortingType;
  handleSort: () => any;
  openPoolHandler: (id: Address) => any;
}) => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <div className="hidden lg:grid pr-3 pl-2 rounded-3 overflow-hidden bg-table-gradient grid-cols-[_minmax(20px,0.5fr),minmax(50px,2.67fr),_minmax(87px,1.33fr),_minmax(30px,1fr),_minmax(30px,1fr),_minmax(30px,1fr)] pb-2">
      <div className=" h-[60px] flex items-center justify-center  text-tertiary-text ">#</div>
      <div className=" h-[60px] flex items-center text-tertiary-text">Pool</div>
      <div className=" h-[60px] flex items-center justify-end  text-tertiary-text ">
        Transactions
      </div>
      <HeaderItem label="TVL" sorting={sorting} handleSort={handleSort} />
      <div className=" h-[60px] flex items-center justify-end text-tertiary-text ">
        1 day volume
      </div>
      <div className=" h-[60px] flex items-center justify-end text-tertiary-text pr-2">
        7 day volume
      </div>

      {tableData.map((o: any, index: number) => {
        return (
          <React.Fragment key={o.id || index}>
            <div
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => openPoolHandler(o.id)}
              className={`h-[56px] cursor-pointer flex items-center rounded-l-4 justify-center text-secondary-text ${hoveredRow === index ? "bg-tertiary-bg" : ""}`}
            >
              {(currentPage - 1) * PAGE_SIZE + index + 1}
            </div>
            <div
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => openPoolHandler(o.id)}
              className={`h-[56px] cursor-pointer flex pl-2 items-center  ${hoveredRow === index ? "bg-tertiary-bg" : ""}`}
            >
              <Image src="/images/tokens/placeholder.svg" width={24} height={24} alt="" />
              <Image
                src="/images/tokens/placeholder.svg"
                width={24}
                height={24}
                alt=""
                className="-ml-3 bg-primary-bg rounded-full"
              />
              <span className="ml-3 mr-2">{`${truncateMiddle(o.token0.symbol, {
                charsFromStart: 4,
                charsFromEnd: 3,
              })}/${truncateMiddle(o.token1.symbol, {
                charsFromStart: 4,
                charsFromEnd: 3,
              })}`}</span>
              <Badge
                variant={BadgeVariant.PERCENTAGE}
                percentage={`${(FEE_AMOUNT_DETAIL as any)[o.feeTier as any].label}%`}
              />
              {hoveredRow === index && <Svg iconName="next" className="ml-1 text-green" />}
            </div>
            <div
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => openPoolHandler(o.id)}
              className={`h-[56px] cursor-pointer flex justify-end items-center text-secondary-text pr-3  ${hoveredRow === index ? "bg-tertiary-bg" : ""}`}
            >
              {formatNumberKilos(o.txCount, { significantDigits: 0 })}
            </div>
            <div
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => openPoolHandler(o.id)}
              className={`h-[56px] cursor-pointer flex justify-end items-center text-secondary-text  ${hoveredRow === index ? "bg-tertiary-bg" : ""}`}
            >
              ${formatNumberKilos(o.totalValueLockedUSD)}
            </div>
            <div
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => openPoolHandler(o.id)}
              className={`h-[56px] cursor-pointer flex justify-end items-center text-secondary-text  ${hoveredRow === index ? "bg-tertiary-bg" : ""}`}
            >
              ${formatNumberKilos(parseFloat(o.poolDayData?.[0]?.volumeUSD) || 0)}
            </div>
            <div
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => openPoolHandler(o.id)}
              className={`h-[56px] cursor-pointer flex justify-end items-center pr-4 rounded-r-4 text-secondary-text  ${hoveredRow === index ? "bg-tertiary-bg" : ""}`}
            >
              {/* TODO still no way to get 7 day value */}${formatFloat(0)}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const PoolsTableItemMobile = ({
  // key,
  pool,
  openPoolHandler,
  index,
}: {
  // key: any;
  pool: any;
  openPoolHandler: (id: Address) => any;
  index: number;
}) => {
  return (
    <React.Fragment key={index}>
      <div className="flex flex-col bg-primary-bg p-4 rounded-3 gap-2">
        <div className="flex justify-between gap-2">
          <div className="flex flex-row items-start gap-x-2 text-16">
            <Image src="/images/tokens/placeholder.svg" width={24} height={24} alt="" />
            <Image
              src="/images/tokens/placeholder.svg"
              width={24}
              height={24}
              alt=""
              className="ml-[-20px] bg-primary-bg rounded-full"
            />
            <span>{`${pool.token0.symbol}/${pool.token1.symbol}`}</span>
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
        <div className="flex justify-between gap-x-2">
          <div className="flex w-full flex-col items-start bg-tertiary-bg rounded-2 px-4 py-[10px]">
            <span className="text-14 text-tertiary-text">Transactions</span>
            <span className="text-14 text-secondary-text">{formatNumberKilos(pool.txCount)}</span>
          </div>
          <div className="flex w-full flex-col items-start bg-tertiary-bg rounded-2 px-4 py-[10px]">
            <span className="text-14 text-tertiary-text">TVL</span>
            <span className="text-14 text-secondary-text">{`$${formatNumberKilos(pool.totalValueLockedUSD)}`}</span>
          </div>
          {/*<div className="flex w-full flex-col items-start gap-1 bg-tertiary-bg rounded-2 px-4 py-[10px]">*/}
          {/*  <span className="text-12 text-secondary-text">Turnover</span>*/}
          {/*  <span className="text-12">{`— %`}</span>*/}
          {/*</div>*/}
        </div>
        <div className="flex justify-between gap-x-2 pb-1">
          <div className="flex w-full flex-col items-start bg-tertiary-bg rounded-2 px-4 py-[10px]">
            <span className="text-14 text-tertiary-text">1 day volume</span>
            <span className="text-14 text-secondary-text">{`$${formatNumberKilos(pool.poolDayData?.[0]?.volumeUSD || 0)}`}</span>
          </div>
          <div className="flex w-full flex-col items-start bg-tertiary-bg rounded-2 px-4 py-[10px]">
            <span className="text-14 text-tertiary-text">7 day volume</span>
            <span className="text-14 text-secondary-text">{`$${pool.poolDayData?.[0]?.volumeUSD || "—"}`}</span>
          </div>
        </div>
        <Button
          variant={ButtonVariant.CONTAINED}
          colorScheme={ButtonColor.LIGHT_GREEN}
          size={ButtonSize.MEDIUM}
          onClick={() => openPoolHandler(pool.id)}
        >
          View pool
        </Button>
      </div>
    </React.Fragment>
  );
};

const PoolsTableMobile = ({
  tableData,
  currentPage,
  openPoolHandler,
  handleSort,
  sorting,
}: {
  tableData: any[];
  currentPage: number;
  handleSort: () => any;
  openPoolHandler: (id: Address) => any;
  sorting: SortingType;
}) => {
  return (
    <>
      <div
        className="flex mb-4 gap-2 text-secondary-text flex-row cursor-pointer md:hidden"
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
      <div className="flex md:hidden flex-col gap-4">
        {tableData.map((pool: any, index: number) => {
          return (
            <PoolsTableItemMobile
              key={pool.id || index}
              index={(currentPage - 1) * PAGE_SIZE + index + 1}
              pool={pool}
              openPoolHandler={openPoolHandler}
            />
          );
        })}
      </div>
    </>
  );
};

function localSorting(data: any[], sorting: SortingType): any[] {
  const arrayForSort = [...data];
  if (sorting === SortingType.DESCENDING) {
    arrayForSort.sort((a, b) => {
      return Number(b.totalValueLockedUSD) - Number(a.totalValueLockedUSD);
    });
  }
  if (sorting === SortingType.ASCENDING) {
    arrayForSort.sort((a, b) => {
      return Number(a.totalValueLockedUSD) - Number(b.totalValueLockedUSD);
    });
  }
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
  const { data, loading } = usePoolsData({
    chainId,
    orderDirection: GQLSorting[SortingType.NONE], //sorting],
    filter,
  });

  const pools: any[] = useMemo(() => {
    const pools = data?.pools || [];
    return localSorting(pools, sorting);
  }, [data?.pools, sorting]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * PAGE_SIZE;
    const lastPageIndex = firstPageIndex + PAGE_SIZE;
    return pools.slice(firstPageIndex, lastPageIndex);
  }, [pools, currentPage]);
  const router = useRouter();

  const openPoolHandler = (poolAddress: Address) => {
    router.push(`/pools/${chainId}/${poolAddress}`);
  };

  return (
    <>
      <div className="min-h-[640px] mb-5 w-full">
        {loading ? (
          <div className="flex justify-center items-center h-full min-h-[550px]">
            <Preloader type="awaiting" size={48} />
          </div>
        ) : (
          <>
            {pools.length > 0 ? (
              <>
                <PoolsTableDesktop
                  tableData={currentTableData}
                  sorting={sorting}
                  currentPage={currentPage}
                  handleSort={handleSort}
                  openPoolHandler={openPoolHandler}
                />
                <PoolsTableMobile
                  tableData={currentTableData}
                  sorting={sorting}
                  currentPage={currentPage}
                  handleSort={handleSort}
                  openPoolHandler={openPoolHandler}
                />
              </>
            ) : (
              <div className="min-h-[340px] bg-primary-bg flex items-center justify-center w-full rounded-5 bg-empty-not-found-pools bg-right-top bg-no-repeat max-md:bg-size-180">
                <p className="text-secondary-text">{t("pools_not_found")}</p>
              </div>
            )}
          </>
        )}
      </div>

      <Pagination
        className="pagination-bar"
        currentPage={currentPage}
        totalCount={pools.length}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => setCurrentPage(page as number)}
      />
    </>
  );
}
