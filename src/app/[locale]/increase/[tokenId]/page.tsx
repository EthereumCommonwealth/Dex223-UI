"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

import { Bound } from "@/app/[locale]/add/components/PriceRange/LiquidityChartRangeInput/types";
import { useAddLiquidityTokensStore } from "@/app/[locale]/add/stores/useAddLiquidityTokensStore";
import { useLiquidityPriceRangeStore } from "@/app/[locale]/add/stores/useLiquidityPriceRangeStore";
import { useLiquidityTierStore } from "@/app/[locale]/add/stores/useLiquidityTierStore";
import PositionLiquidityCard from "@/app/[locale]/pool/[tokenId]/components/PositionLiquidityCard";
import PositionPriceRangeCard from "@/app/[locale]/pool/[tokenId]/components/PositionPriceRangeCard";
import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import RangeBadge, { PositionRangeStatus } from "@/components/badges/RangeBadge";
import IconButton, { IconButtonSize, IconSize } from "@/components/buttons/IconButton";
import RecentTransactions from "@/components/common/RecentTransactions";
import SelectedTokensInfo from "@/components/common/SelectedTokensInfo";
import TokensPair from "@/components/common/TokensPair";
import { useTransactionSettingsDialogStore } from "@/components/dialogs/stores/useTransactionSettingsDialogStore";
import { FEE_AMOUNT_DETAIL } from "@/config/constants/liquidityFee";
import {
  usePositionFromPositionInfo,
  usePositionFromTokenId,
  usePositionPrices,
  usePositionRangeStatus,
} from "@/hooks/usePositions";
import { useRecentTransactionTracking } from "@/hooks/useRecentTransactionTracking";
import { useRouter } from "@/navigation";

import { DepositAmounts } from "../../add/components/DepositAmounts/DepositAmounts";
import ConfirmLiquidityDialog from "../../add/components/LiquidityActionButton/ConfirmLiquidityDialog";
import { LiquidityActionButton } from "../../add/components/LiquidityActionButton/LiquidityActionButton";
import { usePriceRange } from "../../add/hooks/usePrice";
import { useSortedTokens } from "../../add/hooks/useSortedTokens";
import { useV3DerivedMintInfo } from "../../add/hooks/useV3DerivedMintInfo";

export default function IncreaseLiquidityPage({
  params,
}: {
  params: {
    tokenId: string;
  };
}) {
  useRecentTransactionTracking();
  const [showRecentTransactions, setShowRecentTransactions] = useState(true);

  const { setIsOpen } = useTransactionSettingsDialogStore();
  const { setTicks } = useLiquidityPriceRangeStore();

  const router = useRouter();

  const [showFirst, setShowFirst] = useState(true);

  const { position: positionInfo, loading } = usePositionFromTokenId(BigInt(params.tokenId));
  const existedPosition = usePositionFromPositionInfo(positionInfo);

  // TODO: tokens already sorted, rename tokenA\B -> token0\1
  const [tokenA, tokenB, fee] = useMemo(() => {
    return existedPosition?.pool.token0 && existedPosition?.pool.token1 && existedPosition?.pool.fee
      ? [existedPosition.pool.token0, existedPosition.pool.token1, existedPosition.pool.fee]
      : [undefined, undefined];
  }, [existedPosition?.pool.fee, existedPosition?.pool.token0, existedPosition?.pool.token1]);
  const { token0, token1 } = useSortedTokens({
    tokenA,
    tokenB,
  });

  const { inRange, removed } = usePositionRangeStatus({ position: existedPosition });
  const { minPriceString, maxPriceString, currentPriceString, ratio } = usePositionPrices({
    position: existedPosition,
    showFirst,
  });

  const [initialized, setInitialized] = useState(false);

  const { setBothTokens } = useAddLiquidityTokensStore();
  const { tier, setTier } = useLiquidityTierStore();

  useEffect(() => {
    if (tokenA && tokenB && existedPosition && !initialized) {
      setBothTokens({ tokenA, tokenB });
      setTier(existedPosition.pool.fee);
      setTicks({
        [Bound.LOWER]: existedPosition.tickLower,
        [Bound.UPPER]: existedPosition.tickUpper,
      });
      setInitialized(true);
    }
  }, [initialized, existedPosition, setBothTokens, setTicks, setTier, tokenA, tokenB]);

  // PRICE RANGE HOOK START
  const { price } = usePriceRange();
  // PRICE RANGE HOOK END

  // Deposit Amounts START
  const {
    parsedAmounts,
    position,
    currencies,
    noLiquidity,
    outOfRange,
    depositADisabled,
    depositBDisabled,
  } = useV3DerivedMintInfo({
    tokenA,
    tokenB,
    tier,
    price,
  });

  // Deposit Amounts END

  return (
    <Container>
      <div className="lg:w-[1200px] mx-auto my-4 lg:my-[40px]">
        <div className="flex justify-between items-center bg-primary-bg rounded-t-3 lg:rounded-t-5 py-1 lg:py-2.5 px-2 lg:px-6">
          <div className="w-[96px] md:w-[104px]">
            <IconButton
              onClick={() => router.push(`/pool/${params.tokenId}`)}
              buttonSize={IconButtonSize.LARGE}
              iconName="back"
              iconSize={IconSize.LARGE}
              className="text-tertiary-text"
            />
          </div>
          <h2 className="text-18 md:text-20 font-bold">Increase Liquidity</h2>
          <div className="w-[96px] md:w-[104px] flex items-center gap-0 lg:gap-2 justify-end">
            <IconButton
              buttonSize={IconButtonSize.LARGE}
              iconName="recent-transactions"
              onClick={() => setShowRecentTransactions(!showRecentTransactions)}
              className={showRecentTransactions ? "text-green" : "text-tertiary-text"}
            />
            <IconButton
              buttonSize={IconButtonSize.LARGE}
              iconName="settings"
              onClick={() => setIsOpen(true)}
              className="text-tertiary-text"
            />
          </div>
        </div>
        <div className="flex flex-col bg-primary-bg p-4 lg:p-10 pt-0 mb-5 rounded-3 rounded-t-0">
          <div className="flex items-start mb-4 lg:mb-5 gap-2">
            <TokensPair tokenA={tokenA} tokenB={tokenB} />
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

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-5 mb-4 lg:mb-5">
            <DepositAmounts
              parsedAmounts={parsedAmounts}
              currencies={currencies}
              depositADisabled={depositADisabled}
              depositBDisabled={depositBDisabled}
              isFormDisabled={false}
            />
            <div className="rounded-3 p-4 lg:p-5 bg-tertiary-bg h-min">
              <div className="rounded-3 bg-quaternary-bg mb-4">
                <div className="grid gap-3 px-4 py-3 lg:p-5">
                  <PositionLiquidityCard
                    token={tokenA}
                    amount={existedPosition?.amount0.toSignificant() || "Loading..."}
                    percentage={ratio ? (showFirst ? ratio : 100 - ratio) : "Loading..."}
                    standards={["ERC-20", "ERC-223"]} // TODO
                  />
                  <PositionLiquidityCard
                    token={tokenB}
                    amount={existedPosition?.amount1.toSignificant() || "Loading..."}
                    percentage={ratio ? (!showFirst ? ratio : 100 - ratio) : "Loading..."}
                    standards={["ERC-20", "ERC-223"]} // TODO
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-14 lg:text-16">Fee tier</span>
                <span className="text-14 lg:text-16">
                  {existedPosition
                    ? FEE_AMOUNT_DETAIL[existedPosition?.pool.fee].label
                    : "Loading..."}
                  %
                </span>
              </div>

              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-secondary-text">Selected range</span>
                <div className="flex p-0.5 gap-0.5 rounded-2 bg-secondary-bg">
                  <button
                    onClick={() => setShowFirst(true)}
                    className={clsx(
                      "text-12 h-7 rounded-2 min-w-[60px] px-3 border duration-200",
                      showFirst
                        ? "bg-green-bg border-green text-primary-text"
                        : "hover:bg-green-bg focus:outline-0 focus:bg-green-bg bg-primary-bg border-transparent text-secondary-text",
                    )}
                  >
                    {tokenA?.symbol}
                  </button>
                  <button
                    onClick={() => setShowFirst(false)}
                    className={clsx(
                      "text-12 h-7 rounded-2 min-w-[60px] px-3 border duration-200",
                      !showFirst
                        ? "bg-green-bg border-green text-primary-text"
                        : "hover:bg-green-bg focus:outline-0 focus:bg-green-bg bg-primary-bg border-transparent text-secondary-text",
                    )}
                  >
                    {tokenB?.symbol}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_8px_1fr] lg:grid-cols-[1fr_12px_1fr] mb-2 lg:mb-3">
                <PositionPriceRangeCard
                  showFirst={showFirst}
                  token0={token0}
                  token1={token1}
                  price={minPriceString}
                />
                <div className="relative">
                  <div className="bg-primary-bg w-10 lg:w-12 h-10 lg:h-12 rounded-full text-tertiary-text absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    <Svg iconName="double-arrow" />
                  </div>
                </div>
                <PositionPriceRangeCard
                  showFirst={showFirst}
                  token0={token0}
                  token1={token1}
                  price={maxPriceString}
                  isMax
                />
              </div>

              <div className="bg-quaternary-bg flex items-center justify-center flex-col py-3 px-5 rounded-3">
                <div className="text-12 lg:text-14 text-secondary-text">Current price</div>
                <div className="text-16 lg:text-18">{currentPriceString}</div>
                <div className="text-12 lg:text-14 text-tertiary-text">
                  {showFirst
                    ? `${token0?.symbol} per ${token1?.symbol}`
                    : `${token1?.symbol} per ${token0?.symbol}`}
                </div>
              </div>
            </div>
          </div>
          <LiquidityActionButton increase tokenId={params.tokenId} />
        </div>
        <div className="flex flex-col gap-5">
          <SelectedTokensInfo tokenA={tokenA} tokenB={tokenB} />
          <RecentTransactions
            showRecentTransactions={showRecentTransactions}
            handleClose={() => setShowRecentTransactions(false)}
            pageSize={5}
          />
        </div>
      </div>
      <ConfirmLiquidityDialog increase tokenId={params.tokenId} />
    </Container>
  );
}
