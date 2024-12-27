"use client";
import "react-loading-skeleton/dist/skeleton.css";

import clsx from "clsx";
import Image from "next/image";
import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

import RangeBadge, { PositionRangeStatus } from "@/components/badges/RangeBadge";
import {
  PositionInfo,
  usePositionFromPositionInfo,
  usePositionRangeStatus,
} from "@/hooks/usePositions";

import { WalletPositions } from "../../stores/useWalletsPosotions";

const PositionTableItemDesktop = ({ positionInfo }: { positionInfo: PositionInfo }) => {
  const position = usePositionFromPositionInfo(positionInfo);
  const { inRange, removed } = usePositionRangeStatus({ position });

  return (
    <>
      <div
        className={clsx("h-[56px] flex items-center text-secondary-text gap-2 pl-5 rounded-l-3")}
      >
        <span>{`${positionInfo.tokenId}`}</span>
      </div>
      <div className={clsx("h-[56px] flex items-center gap-2")}>
        <Image src="/images/tokens/placeholder.svg" width={24} height={24} alt="" />
        <Image
          src="/images/tokens/placeholder.svg"
          width={24}
          height={24}
          alt=""
          className="ml-[-20px] bg-primary-bg rounded-full"
        />

        {position
          ? `${position.amount0.toSignificant()} ${position.pool.token0.symbol}/${position.amount1.toSignificant()} ${position.pool.token1.symbol}`
          : "Loading..."}
      </div>
      <div className={clsx("h-[56px] flex items-center text-secondary-text")}>$0.00</div>
      <div className={clsx("h-[56px] flex items-center text-secondary-text")}>$0.00</div>
      <div className={clsx("h-[56px] flex items-center pr-5 rounded-r-3")}>
        <RangeBadge
          status={
            removed
              ? PositionRangeStatus.CLOSED
              : inRange
                ? PositionRangeStatus.IN_RANGE
                : PositionRangeStatus.OUT_OF_RANGE
          }
        />
      </div>
    </>
  );
};

export const LiquidityPositionsDesktopTable = ({
  tableData,
  isLoading = false,
}: {
  tableData: WalletPositions[];
  isLoading: boolean;
}) => {
  return (
    <div className="hidden lg:grid pr-5 pl-5 rounded-5 overflow-hidden bg-table-gradient grid-cols-[minmax(50px,1.33fr),_minmax(87px,2.67fr),_minmax(55px,1.33fr),_minmax(50px,1.33fr),_minmax(50px,1.33fr)] pb-2 relative">
      {isLoading ? (
        <React.Fragment>
          <SkeletonTheme
            baseColor="#1D1E1E"
            highlightColor="#2E2F2F"
            borderRadius="0.5rem"
            enableAnimation={false}
            // duration={5}
          >
            <div className="text-tertiary-text pl-5 h-[60px] flex items-center">
              <Skeleton circle width={16} height={16} />
            </div>
            <div className="text-tertiary-text h-[60px] flex items-center gap-2">
              <Skeleton width={117} height={16} />
            </div>
            <div className="text-tertiary-text h-[60px] flex items-center">
              <Skeleton width={80} height={16} />
            </div>
            <div className="text-tertiary-text h-[60px] flex items-center">
              <Skeleton width={119} height={16} />
            </div>
            <div className="text-tertiary-text pr-5 h-[60px] flex items-center mb-2">
              <Skeleton width={50} height={16} />
            </div>
          </SkeletonTheme>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="text-tertiary-text pl-5 h-[60px] flex items-center">ID</div>
          <div className="text-tertiary-text h-[60px] flex items-center gap-2">Amount tokens</div>
          <div className="text-tertiary-text h-[60px] flex items-center">Amount, $</div>
          <div className="text-tertiary-text h-[60px] flex items-center">Unclaimed fees</div>
          <div className="text-tertiary-text pr-5 h-[60px] flex items-center mb-2">Status</div>
        </React.Fragment>
      )}

      {isLoading
        ? [...Array(3)].map((row, index) => (
            <React.Fragment key={index}>
              <SkeletonTheme
                baseColor="#272727"
                highlightColor="#2E2F2F"
                borderRadius="0.5rem"
                enableAnimation={false}
                // duration={5}
              >
                <div className="ml-3 h-[56px] flex justify-start items-center">
                  <Skeleton width={84} height={16} />
                </div>
                <div className="flex flex-row gap-2">
                  <div className="flex relative flex-row h-[56px] w-[40px]">
                    <div className=" absolute left-0 top-3">
                      <Skeleton circle={true} width={24} height={24} />
                    </div>
                    <div className="absolute left-[12px] top-3">
                      <Skeleton circle={true} width={24} height={24} />
                    </div>
                  </div>
                  <div className="h-[56px] flex justify-center items-center">
                    <Skeleton width={180} height={16} />
                  </div>
                </div>
                <div className="h-[56px] flex justify-start items-center">
                  <Skeleton width={60} height={16} />
                </div>
                <div className="h-[56px] flex justify-start items-center">
                  <Skeleton width={60} height={16} />
                </div>
                <div className="h-[56px] flex justify-start items-center">
                  <Skeleton width={92} height={16} />
                </div>
              </SkeletonTheme>
            </React.Fragment>
          ))
        : tableData?.map(({ positions }, index: number) => {
            return (
              <React.Fragment key={index}>
                {positions.map((position) => (
                  <PositionTableItemDesktop key={position.tokenId} positionInfo={position} />
                ))}
              </React.Fragment>
            );
          })}
    </div>
  );
};

const PositionTableItemMobile = ({ positionInfo }: { positionInfo: PositionInfo }) => {
  const position = usePositionFromPositionInfo(positionInfo);
  const { inRange, removed } = usePositionRangeStatus({ position });

  return (
    <>
      <div className="flex flex-col bg-primary-bg p-4 rounded-3 gap-2">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 text-14">
            <Image src="/images/tokens/placeholder.svg" width={24} height={24} alt="" />
            <Image
              src="/images/tokens/placeholder.svg"
              width={24}
              height={24}
              alt=""
              className="ml-[-20px] bg-primary-bg rounded-full"
            />

            {position
              ? `${position.amount0.toSignificant()} ${position.pool.token0.symbol}/${position.amount1.toSignificant()} ${position.pool.token1.symbol}`
              : "Loading..."}
          </div>
          <RangeBadge
            status={
              removed
                ? PositionRangeStatus.CLOSED
                : inRange
                  ? PositionRangeStatus.IN_RANGE
                  : PositionRangeStatus.OUT_OF_RANGE
            }
          />
        </div>
        <div className="flex justify-between gap-2">
          <div className="flex w-full items-center gap-1 bg-tertiary-bg rounded-2 px-4 py-[10px]">
            <span className="text-14 text-secondary-text">ID:</span>
            <span className="text-14 font-medium">{`${positionInfo.tokenId}`}</span>
          </div>
          <div className="flex w-full items-center gap-1 bg-tertiary-bg rounded-2 px-4 py-[10px]">
            <span className="text-14 text-secondary-text">Amount:</span>
            <span className="text-14 font-medium">{`$ —`}</span>
          </div>
        </div>
        <div className="flex w-full items-center gap-1 bg-tertiary-bg rounded-2 px-4 py-[10px]">
          <span className="text-14 text-secondary-text">Unclaimed fees:</span>
          <span className="text-14 font-medium">{`$ —`}</span>
        </div>
      </div>
    </>
  );
};

export const LiquidityPositionsMobileTable = ({ tableData }: { tableData: WalletPositions[] }) => {
  return (
    <div className="flex lg:hidden flex-col gap-4">
      {tableData?.map(({ positions }, index: number) => {
        return (
          <React.Fragment key={index}>
            {positions.map((position) => (
              <PositionTableItemMobile key={position.tokenId} positionInfo={position} />
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
};
