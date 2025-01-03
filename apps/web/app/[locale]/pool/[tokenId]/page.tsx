"use client";
import "react-loading-skeleton/dist/skeleton.css";

import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { use, useEffect, useMemo, useState } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { useMediaQuery } from "react-responsive";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import PositionLiquidityCard from "@/app/[locale]/pool/[tokenId]/components/PositionLiquidityCard";
import PositionPriceRangeCard from "@/app/[locale]/pool/[tokenId]/components/PositionPriceRangeCard";
import {
  useCollectFeesGasLimitStore,
  useCollectFeesGasModeStore,
  useCollectFeesGasPrice,
  useCollectFeesGasPriceStore,
} from "@/app/[locale]/pool/[tokenId]/stores/useCollectFeesGasSettings";
import { usePoolRecentTransactionsStore } from "@/app/[locale]/pool/[tokenId]/stores/usePoolRecentTransactionsStore";
import { RemoveLiquidityGasSettings } from "@/app/[locale]/remove/[tokenId]/components/RemoveLiquidityGasSettings";
import Alert from "@/components/atoms/Alert";
import Container from "@/components/atoms/Container";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import ExternalTextLink from "@/components/atoms/ExternalTextLink";
import Preloader from "@/components/atoms/Preloader";
import Svg from "@/components/atoms/Svg";
import Tooltip from "@/components/atoms/Tooltip";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import RangeBadge, { PositionRangeStatus } from "@/components/badges/RangeBadge";
import Button, { ButtonColor, ButtonSize, ButtonVariant } from "@/components/buttons/Button";
import IconButton, { IconButtonSize, IconButtonVariant } from "@/components/buttons/IconButton";
import RadioButton from "@/components/buttons/RadioButton";
import RecentTransactions from "@/components/common/RecentTransactions";
import SelectedTokensInfo from "@/components/common/SelectedTokensInfo";
import TokensPair from "@/components/common/TokensPair";
import { useTransactionSpeedUpDialogStore } from "@/components/dialogs/stores/useTransactionSpeedUpDialogStore";
import { FEE_AMOUNT_DETAIL } from "@/config/constants/liquidityFee";
import { formatFloat } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import { useCollectFeesEstimatedGas, usePositionFees } from "@/hooks/useCollectFees";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import {
  usePositionFromPositionInfo,
  usePositionFromTokenId,
  usePositionPrices,
  usePositionRangeStatus,
} from "@/hooks/usePositions";
import { useRecentTransactionTracking } from "@/hooks/useRecentTransactionTracking";
import { useRouter } from "@/i18n/routing";
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESS } from "@/sdk_hybrid/addresses";
import { Standard } from "@/sdk_hybrid/standard";
import { useComputePoolAddressDex } from "@/sdk_hybrid/utils/computePoolAddress";
import {
  RecentTransactionTitleTemplate,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

import { CollectFeesStatus, useCollectFeesStatusStore } from "./stores/useCollectFeesStatusStore";
import { useCollectFeesStore, useRefreshStore } from "./stores/useCollectFeesStore";

export default function PoolPage({
  params,
}: {
  params: Promise<{
    tokenId: string;
  }>;
}) {
  const { tokenId } = use(params);
  useRecentTransactionTracking();
  useCollectFeesEstimatedGas();

  const chainId = useCurrentChainId();
  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    usePoolRecentTransactionsStore();

  const { forceRefresh } = useRefreshStore();

  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();

  //TODO: make centralize function instead of boolean useState value to control invert
  const [showFirst, setShowFirst] = useState(true);

  const { position: positionInfo, loading } = usePositionFromTokenId(BigInt(tokenId));
  let position = usePositionFromPositionInfo(positionInfo);

  const token0 = position?.pool.token0;
  const token1 = position?.pool.token1;
  const fee = position?.pool.fee;

  const { poolAddress, poolAddressLoading } = useComputePoolAddressDex({
    tokenA: token0,
    tokenB: token1,
    tier: fee,
  });

  const isLoading = loading || poolAddressLoading;

  const { isAdvanced, setIsAdvanced } = useCollectFeesGasModeStore();
  const {
    gasPriceOption,
    gasPriceSettings,
    setGasPriceOption,
    setGasPriceSettings,
    updateDefaultState,
  } = useCollectFeesGasPriceStore();
  const { estimatedGas, customGasLimit, setEstimatedGas, setCustomGasLimit } =
    useCollectFeesGasLimitStore();

  useEffect(() => {
    updateDefaultState(chainId);
  }, [chainId, updateDefaultState]);

  const gasPrice: bigint | undefined = useCollectFeesGasPrice();
  const isMobile = useMediaQuery({ query: "(max-width: 640px)" });

  const {
    token0Standard,
    token1Standard,
    reset,
    setToken0Standard,
    setToken1Standard,
    setPool,
    setPoolAddress,
    setTokenId,
  } = useCollectFeesStore();
  const { status, hash, setStatus } = useCollectFeesStatusStore();
  const t = useTranslations("Liquidity");
  const tr = useTranslations("RecentTransactions");

  useEffect(() => {
    setPool(position?.pool);
    setPoolAddress(poolAddress);
    setTokenId(positionInfo?.tokenId);
  }, [position?.pool, poolAddress, positionInfo?.tokenId, setPool, setPoolAddress, setTokenId]);

  const { fees, handleCollectFees } = usePositionFees();

  const { inRange, removed } = usePositionRangeStatus({ position });
  const { minPriceString, maxPriceString, currentPriceString, ratio } = usePositionPrices({
    position,
    showFirst,
  });

  const { address: accountAddress } = useAccount();
  const { transactions } = useRecentTransactionsStore();
  const { hash: liquidityHash } = useCollectFeesStatusStore();
  const { handleSpeedUp, handleCancel, replacement } = useTransactionSpeedUpDialogStore();

  const transaction = useMemo(() => {
    if (liquidityHash && accountAddress) {
      const txs = transactions[accountAddress];
      for (let tx of txs) {
        if (tx.hash === liquidityHash) {
          return tx;
        }
      }
    }
  }, [accountAddress, liquidityHash, transactions]);

  const handleClose = () => {
    reset();
    setIsOpen(false);
    forceRefresh();
    setStatus(CollectFeesStatus.INITIAL);
  };

  // if (!token0 || !token1) return <div>{t("error_tokens_undefined")}</div>;

  const token0FeeFormatted = formatFloat(formatUnits(fees[0] || BigInt(0), token0?.decimals || 18));
  const token1FeeFormatted = formatFloat(formatUnits(fees[1] || BigInt(0), token1?.decimals || 18));

  return (
    <Container>
      <div className="w-full md:w-[800px] md:mx-auto md:mt-[40px] mb-5 bg-primary-bg px-4 lg:px-10 pb-4 lg:pb-10 rounded-5">
        <SkeletonTheme
          baseColor="#272727"
          highlightColor="#1D1E1E"
          borderRadius="20px"
          enableAnimation={false}
          // duration={5}
        >
          <div className="flex justify-between items-center py-1.5 -mx-3">
            <IconButton
              buttonSize={IconButtonSize.LARGE}
              variant={IconButtonVariant.BACK}
              // iconName="back"
              onClick={() => router.push("/pools/positions")}
            />
            <h2 className="text-18 lg:text-20 font-bold">{t("liquidity_position")}</h2>
            <IconButton
              buttonSize={IconButtonSize.LARGE}
              iconName="recent-transactions"
              onClick={() => setShowRecentTransactions(!showRecentTransactions)}
              active={showRecentTransactions}
            />
          </div>

          {/* Tokens Pair line */}
          <div className="w-full flex flex-col mb-4 lg:mb-5">
            {isLoading ? (
              <div className="flex-nowrap flex flex-row md:h-[32px] h-6 gap-2 items-center">
                <div className="flex relative flex-row md:h-[32px] h-6 md:w-[50px] w-[37px]">
                  <div className=" absolute left-0 ">
                    <Skeleton
                      circle={true}
                      width={isMobile ? 24 : 32}
                      height={isMobile ? 24 : 32}
                    />
                  </div>
                  <div className="absolute md:left-[18px] left-[13px]">
                    <Skeleton
                      circle={true}
                      width={isMobile ? 24 : 32}
                      height={isMobile ? 24 : 32}
                    />
                  </div>
                </div>
                <div className="flex items-center mt-[7px]">
                  <Skeleton width={138} height={isMobile ? 16 : 18} />
                </div>
                <div className="flex items-center md:mt-1 mt-[3px]">
                  <Skeleton width={isMobile ? 35 : 46} height={isMobile ? 20 : 24} />
                </div>
                <div className="md:flex items-center mt-2 md:box hidden">
                  <Skeleton width={91} height={16} />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <div>
                  <TokensPair tokenA={token0} tokenB={token1} />
                </div>
                <div className="flex flex-wrap items-center gap-2 md:-mt-0.5">
                  {position && (
                    <Badge
                      percentage={`${FEE_AMOUNT_DETAIL[position.pool.fee].label}%`}
                      variant={BadgeVariant.PERCENTAGE}
                    />
                  )}
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
              </div>
            )}
          </div>

          {/* NFT badges line */}
          <SkeletonTheme
            baseColor="#1D1E1E"
            highlightColor="#272727"
            borderRadius="20px"
            enableAnimation={false}
            // duration={5}
          >
            {isLoading ? (
              <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-5 flex-wrap">
                {[...Array(3)].map((row, index) => (
                  <div
                    key={index}
                    className="flex items-center md:w-[200px] w-[160px] md:h-[40px] h-[32px] gap-1 px-3 justify-between py-2 rounded-2 bg-tertiary-bg"
                  >
                    <Skeleton width={isMobile ? 66 : 85} height={isMobile ? 12 : 16} />
                    <Skeleton width={isMobile ? 66 : 85} height={isMobile ? 12 : 16} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-5 flex-wrap">
                <div className="flex items-center gap-1 px-3 justify-between py-2 rounded-2 bg-tertiary-bg">
                  <Tooltip text="Tooltip text" iconSize={isMobile ? 16 : 24} />
                  <span className="text-tertiary-text text-12 lg:text-16">NFT ID:</span>
                  <ExternalTextLink
                    text={tokenId}
                    className="text-12 lg:text-16"
                    arrowSize={isMobile ? 16 : 24}
                    href={getExplorerLink(
                      ExplorerLinkType.TOKEN,
                      `${NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId]}?a=${tokenId}`,
                      chainId,
                    )}
                  />
                </div>
                <div className="flex items-center gap-1 px-3 py-2 rounded-2 bg-tertiary-bg">
                  <Tooltip text="Tooltip text" iconSize={isMobile ? 16 : 24} />
                  <span className="text-tertiary-text text-12 lg:text-16">{t("min_tick")}:</span>
                  <span className="text-12 text-secondary-text lg:text-16">
                    {position?.tickLower}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-3 py-2 rounded-2 bg-tertiary-bg">
                  <Tooltip text="Tooltip text" iconSize={isMobile ? 16 : 24} />
                  <span className="text-tertiary-text text-12 lg:text-16">{t("max_tick")}:</span>
                  <span className="text-12 text-secondary-text lg:text-16">
                    {position?.tickUpper}
                  </span>
                </div>
              </div>
            )}
          </SkeletonTheme>

          {/* Liquidity buttons line */}
          {isLoading ? (
            <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-5 flex-wrap">
              {[...Array(2)].map((row, index) => (
                <div
                  key={index}
                  className="flex items-center md:w-[354px] w-full h-[40px] gap-1 px-3 justify-between py-2 rounded-2 bg-tertiary-bg"
                ></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col lg:grid lg:grid-cols-2 items-center gap-2 lg:gap-3 mb-4 lg:mb-5">
              <Button
                size={ButtonSize.MEDIUM}
                onClick={() => router.push(`/increase/${tokenId}`)}
                colorScheme={ButtonColor.LIGHT_GREEN}
                fullWidth
              >
                {t("increase_liquidity")}
              </Button>
              <Button
                size={ButtonSize.MEDIUM}
                onClick={() => router.push(`/remove/${tokenId}`)}
                colorScheme={ButtonColor.LIGHT_GREEN}
                fullWidth
              >
                {tr("remove_liquidity_title")}
              </Button>
            </div>
          )}

          {/* Liquidity Info block */}
          {isLoading ? (
            <>
              {[...Array(2)].map((row, index) => (
                <div key={index} className="p-4 lg:p-5 bg-tertiary-bg mb-4 lg:mb-5 rounded-3">
                  <div>
                    <div className="mb-3 md:mb-0">
                      <SkeletonTheme
                        baseColor="#1D1E1E"
                        highlightColor="#272727"
                        borderRadius="20px"
                        enableAnimation={false}
                        // duration={5}
                      >
                        <Skeleton width={66} height={isMobile ? 12 : 14} />
                        <Skeleton width={80} height={isMobile ? 16 : 20} />
                      </SkeletonTheme>
                    </div>
                    {isMobile ? (
                      <>
                        {[...Array(2)].map((row, indexi) => (
                          <div
                            key={indexi}
                            className="flex gap-1 rounded-3 bg-primary-bg pt-3 pb-3 mt-2 flex-col items-center justify-center"
                          >
                            <div className="flex gap-2 items-center justify-center w-auto">
                              <Skeleton circle width={16} height={16} />
                              <div className="flex flex-row gap-2 mt-[2px] w-full">
                                <Skeleton width={44} height={14} />
                                <Skeleton width={60} height={14} />
                              </div>
                            </div>
                            <div className="flex justify-center w-auto items-center">
                              <Skeleton width={90} height={16} />
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="lg:p-5 grid gap-2 rounded-3 bg-primary-bg mt-4">
                        {[...Array(2)].map((row, indexi) => (
                          <div key={indexi} className="flex flex-row gap-2 items-center">
                            <Skeleton circle width={24} height={24} />
                            <div className="flex flex-row gap-2 mt-[2px] w-full">
                              <Skeleton width={44} height={20} />
                              <Skeleton width={60} height={20} />
                              <Skeleton width={66} height={20} />
                              <div className="flex ml-auto">
                                <Skeleton width={90} height={20} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="p-4 lg:p-5 bg-tertiary-bg mb-4 lg:mb-5 rounded-3">
              <div>
                <h3 className="text-12 lg:text-14 text-secondary-text">{t("liquidity")}</h3>
                <p className="text-16 lg:text-20 font-bold mb-3">$0.00</p>
                <div className="lg:p-5 grid gap-2 lg:gap-3 rounded-3 lg:bg-quaternary-bg">
                  <div className="p-4 lg:p-0 bg-quaternary-bg lg:bg-transparent rounded-3">
                    <PositionLiquidityCard
                      token={token0}
                      standards={token0?.isNative ? ["Native"] : ["ERC-20", "ERC-223"]}
                      amount={position?.amount0.toSignificant() || "Loading..."}
                      percentage={ratio ? (showFirst ? ratio : 100 - ratio) : "Loading..."}
                    />
                  </div>
                  <div className="p-4 lg:p-0 bg-quaternary-bg lg:bg-transparent rounded-3">
                    <PositionLiquidityCard
                      token={token1}
                      standards={token1?.isNative ? ["Native"] : ["ERC-20", "ERC-223"]}
                      amount={position?.amount1.toSignificant() || "Loading..."}
                      percentage={ratio ? (!showFirst ? ratio : 100 - ratio) : "Loading..."}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unclaimed Fees block */}
          {!isLoading && (
            <div className="p-4 lg:p-5 bg-tertiary-bg mb-4 lg:mb-5 rounded-3">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-12 lg:text-14 text-secondary-text">
                      {t("unclaimed_fees")}
                    </h3>
                    <p className="text-16 lg:text-20 font-bold mb-3 text-green">$0.00</p>
                  </div>
                  <Button
                    onClick={() => setIsOpen(true)}
                    size={ButtonSize.MEDIUM}
                    mobileSize={ButtonSize.SMALL}
                    disabled={!fees[0] && !fees[1]}
                  >
                    {t("collect_fees_title")}
                  </Button>
                </div>

                <div className="lg:p-5 grid gap-2 lg:gap-3 rounded-3 lg:bg-quaternary-bg">
                  <div className="p-4 lg:p-0 bg-quaternary-bg lg:bg-transparent rounded-3">
                    <PositionLiquidityCard
                      token={token0}
                      standards={token0?.isNative ? ["Native"] : ["ERC-20", "ERC-223"]}
                      amount={token0FeeFormatted}
                    />
                  </div>
                  <div className="p-4 lg:p-0 bg-quaternary-bg lg:bg-transparent rounded-3">
                    <PositionLiquidityCard
                      token={token1}
                      standards={token1?.isNative ? ["Native"] : ["ERC-20", "ERC-223"]}
                      amount={token1FeeFormatted}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected range block */}
          <div>
            {isLoading ? (
              <div className="flex justify-between items-center mb-3 w-full">
                <div className="flex items-center gap-2 md:mt-2 mt-1">
                  <div className="mt-0.5 md:mt-0">
                    <Skeleton width={isMobile ? 108 : 110} height={isMobile ? 14 : 16} />
                  </div>
                  <Skeleton width={isMobile ? 68 : 91} height={isMobile ? 12 : 16} />
                </div>
                <div className="flex ml-auto">
                  <SkeletonTheme
                    baseColor="#272727"
                    highlightColor="#1D1E1E"
                    borderRadius="8px"
                    enableAnimation={false}
                    // duration={5}
                  >
                    <Skeleton width={126} height={32} />
                  </SkeletonTheme>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-14 lg:text-16 font-bold text-secondary-text">
                    Selected Range
                  </span>
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
                <div className="flex gap-0.5 bg-secondary-bg rounded-2 p-0.5">
                  <button
                    onClick={() => setShowFirst(true)}
                    className={clsx(
                      "text-12 h-7 rounded-1 min-w-[60px] px-3 border duration-200",
                      showFirst
                        ? "bg-green-bg border-green text-primary-text"
                        : "hocus:bg-green-bg bg-primary-bg border-transparent text-secondary-text",
                    )}
                  >
                    {truncateMiddle(token0?.symbol || "", { charsFromStart: 4, charsFromEnd: 4 })}
                  </button>
                  <button
                    onClick={() => setShowFirst(false)}
                    className={clsx(
                      "text-12 h-7 rounded-1 min-w-[60px] px-3 border duration-200",
                      !showFirst
                        ? "bg-green-bg border-green text-primary-text"
                        : "hocus:bg-green-bg bg-primary-bg border-transparent text-secondary-text",
                    )}
                  >
                    {truncateMiddle(token1?.symbol || "", { charsFromStart: 4, charsFromEnd: 4 })}
                  </button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-row md:gap-2.5 gap-1.5 rounded-2 w-full mb-3 md:mb-6">
                <SkeletonTheme
                  baseColor="#1D1E1E"
                  highlightColor="#272727"
                  borderRadius="20px"
                  enableAnimation={false}
                  // duration={5}
                >
                  <div className="flex flex-col rounded-3 py-3 md:py-0  md:w-[350px] w-full h-[136px] md:h-[156px] items-center justify-center bg-tertiary-bg ">
                    <Skeleton width={62} height={isMobile ? 12 : 14} />
                    <div className="-mt-0.5 md:mb-0.5">
                      <Skeleton width={140} height={isMobile ? 16 : 18} />
                    </div>
                    <div className="md:-mt-0 -mt-0.5">
                      <Skeleton width={81} height={isMobile ? 12 : 14} />
                    </div>
                    <div className="flex-col flex md:mt-4 mt-0 items-center">
                      <div className="md:hidden mt-1">
                        <Skeleton width={81} height={12} />
                      </div>
                      <div className="md:mt-0 -mt-1.5">
                        <Skeleton width={isMobile ? 144 : 310} height={isMobile ? 12 : 14} />
                      </div>
                      <div className="md:-mt-0 -mt-1.5">
                        <Skeleton width={isMobile ? 81 : 180} height={isMobile ? 12 : 14} />
                      </div>
                    </div>
                  </div>

                  <div className="relative bg-primary-bg ">
                    <div className="flex-shrink-0 bg-primary-bg w-10 md:w-[50px] h-10 md:h-12 rounded-full text-tertiary-text absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                      {/*<Skeleton circle width={48} height={48} />*/}
                    </div>
                  </div>

                  <div className="flex flex-col rounded-3 py-3 md:py-0  md:w-[350px] w-full h-[136px] md:h-[156px] items-center justify-center bg-tertiary-bg ">
                    <Skeleton width={62} height={isMobile ? 12 : 14} />
                    <div className="-mt-0.5 md:mb-0.5">
                      <Skeleton width={140} height={isMobile ? 16 : 18} />
                    </div>
                    <div className="md:-mt-0 -mt-0.5">
                      <Skeleton width={81} height={isMobile ? 12 : 14} />
                    </div>
                    <div className="flex-col flex md:mt-4 mt-0 items-center">
                      <div className="md:hidden mt-1">
                        <Skeleton width={81} height={12} />
                      </div>
                      <div className="md:mt-0 -mt-1.5">
                        <Skeleton width={isMobile ? 144 : 310} height={isMobile ? 12 : 14} />
                      </div>
                      <div className="md:-mt-0 -mt-1.5">
                        <Skeleton width={isMobile ? 81 : 180} height={isMobile ? 12 : 14} />
                      </div>
                    </div>
                  </div>
                </SkeletonTheme>
              </div>
            ) : (
              <div className="grid grid-cols-[1fr_8px_1fr] lg:grid-cols-[1fr_20px_1fr] mb-2 lg:mb-5">
                <PositionPriceRangeCard
                  showFirst={showFirst}
                  token0={token0}
                  token1={token1}
                  price={minPriceString}
                />
                <div className="relative">
                  <div className="bg-primary-bg w-12 h-12 rounded-full text-tertiary-text absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
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
            )}

            {isLoading ? (
              <div className="rounded-3 overflow-hidden">
                <SkeletonTheme
                  baseColor="#1D1E1E"
                  highlightColor="#272727"
                  borderRadius="20px"
                  enableAnimation={false}
                  // duration={5}
                >
                  <div className="bg-tertiary-bg flex items-center justify-center flex-col py-1 lg:py-3">
                    <Skeleton width={62} height={isMobile ? 12 : 14} />
                    <div className="md:-mt-0.5 -mt-1 md:mb-0.5">
                      <Skeleton width={140} height={isMobile ? 16 : 18} />
                    </div>
                    <div className="-mt-0.5 md:mt-0">
                      <Skeleton width={81} height={isMobile ? 12 : 14} />
                    </div>
                  </div>
                </SkeletonTheme>
              </div>
            ) : (
              <div className="rounded-3 overflow-hidden">
                <div className="bg-tertiary-bg flex items-center justify-center flex-col py-2 lg:py-3">
                  <div className="text-12 lg:text-14 text-secondary-text">{t("current_price")}</div>
                  <div className="text-16 lg:text-18">{currentPriceString}</div>
                  <div className="text-12 lg:text-14 text-tertiary-text">
                    {showFirst
                      ? `${token0?.symbol} per ${token1?.symbol}`
                      : `${token1?.symbol} per ${token0?.symbol}`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SkeletonTheme>
      </div>

      {/* Tokens Info & Recent transactions block */}
      <div className="lg:w-[800px] mx-auto lg:mb-[40px] gap-5 flex flex-col">
        <SelectedTokensInfo tokenA={token0} tokenB={token1} />
        <RecentTransactions
          filterFunction={[
            RecentTransactionTitleTemplate.REMOVE,
            RecentTransactionTitleTemplate.ADD,
          ]}
          showRecentTransactions={showRecentTransactions}
          handleClose={() => setShowRecentTransactions(false)}
          pageSize={5}
          store={usePoolRecentTransactionsStore}
        />
      </div>

      {/* Collect / claim Fee dialog */}
      <div>
        <DrawerDialog
          isOpen={isOpen}
          setIsOpen={(isOpen) => {
            if (isOpen) {
              setIsOpen(isOpen);
            } else {
              handleClose();
            }
          }}
        >
          <div className="flex flex-col max-h-svh md:h-auto">
            <DialogHeader onClose={handleClose} title={t("claim_fees_title")} />
            <div className="flex-grow card-spacing-x md:w-[570px] overflow-y-auto md:overflow-y-hidden">
              <div className="flex justify-between items-center">
                <div className="flex items-center md:gap-2 gap-1">
                  <div className="flex items-start relative md:min-w-[50px] md:h-[34px] min-w-[38px] h-[26px]">
                    <div className="absolute left-0 top-0 md:w-[34px] md:h-[34px] w-[26px] h-[26px] items-start justify-center">
                      <Image
                        width={isMobile ? 24 : 32}
                        height={isMobile ? 24 : 32}
                        src={token0?.logoURI as any}
                        alt=""
                      />
                    </div>
                    <div className="md:w-[34px] md:h-[34px] w-[26px] h-[26px] absolute md:left-[16px] left-[12px] top-0 bg-tertiary-bg rounded-full items-start">
                      <Image
                        width={isMobile ? 24 : 32}
                        height={isMobile ? 24 : 32}
                        src={token1?.logoURI as any}
                        alt=""
                      />
                    </div>
                  </div>
                  <span className="text-16 lg:text-18 -mt-0.5 md:mt-0 font-bold text-secondary-text">{`${token0?.symbol} and ${token1?.symbol}`}</span>
                </div>
                <div className="flex items-center gap-4 justify-end">
                  {hash && (
                    <a
                      target="_blank"
                      href={getExplorerLink(ExplorerLinkType.TRANSACTION, hash, chainId)}
                    >
                      <IconButton iconName="forward" />
                    </a>
                  )}

                  {/* Speed Up button */}
                  {transaction && status === CollectFeesStatus.LOADING && (
                    <Button
                      className="relative hidden md:block"
                      colorScheme={ButtonColor.LIGHT_GREEN}
                      variant={ButtonVariant.CONTAINED}
                      size={ButtonSize.EXTRA_SMALL}
                      onClick={() => handleSpeedUp(transaction)}
                    >
                      {transaction.replacement === "repriced" && (
                        <span className="absolute -top-1.5 right-0.5 text-green">
                          <Svg size={16} iconName="speed-up" />
                        </span>
                      )}
                      <span className="text-12 font-medium pb-[3px] pt-[1px] flex items-center flex-row text-nowrap">
                        {t("speed_up")}
                      </span>
                    </Button>
                  )}

                  {status === CollectFeesStatus.PENDING && !isMobile && (
                    <>
                      <Preloader type="linear" />
                      <span className="text-secondary-text text-14">Proceed in your wallet</span>
                    </>
                  )}
                  {status === CollectFeesStatus.LOADING && (
                    <div className="-mt-0.5 md:mt-0">
                      {" "}
                      <Preloader size={20} />
                    </div>
                  )}
                  {status === CollectFeesStatus.SUCCESS && (
                    <div className="-mt-0.5 md:mt-0">
                      <Svg className="text-green" iconName="done" size={20} />
                    </div>
                  )}
                  {status === CollectFeesStatus.ERROR && (
                    <div className="-mt-0.5 md:mt-0">
                      <Svg className="text-red-light" iconName="warning" size={24} />
                    </div>
                  )}
                </div>
              </div>

              {status === CollectFeesStatus.PENDING && isMobile && (
                <div className="flex flex-nowrap gap-2 mt-2 items-center">
                  <Preloader type="linear" />
                  <span className="text-secondary-text text-14">Proceed in your wallet</span>
                </div>
              )}

              {/* Speed Up button - on Mobile */}
              {transaction && status === CollectFeesStatus.LOADING && (
                <Button
                  className="relative md:hidden rounded-5 mt-3"
                  fullWidth
                  colorScheme={ButtonColor.LIGHT_GREEN}
                  variant={ButtonVariant.CONTAINED}
                  size={ButtonSize.SMALL}
                  onClick={() => handleSpeedUp(transaction)}
                >
                  {transaction.replacement === "repriced" && (
                    <span className="absolute -top-2 right-4 text-green">
                      <Svg size={20} iconName="speed-up" />
                    </span>
                  )}
                  <span className="text-14 font-medium pb-[5px] pt-[5px] flex items-center flex-row text-nowrap">
                    {t("speed_up")}
                  </span>
                </Button>
              )}

              {/* Standard A */}
              <div className="flex flex-col rounded-3 bg-tertiary-bg px-4 lg:px-5 py-3 mt-4">
                <div
                  className={clsx("flex gap-2 items-start", token0?.isNative && "justify-between")}
                >
                  {token0?.isNative ? (
                    <>
                      <div className="flex gap-2 items-center">
                        <Image width={24} height={24} src={token0?.logoURI as any} alt="" />
                        <span className="text-16 font-bold text-secondary-text">{`${token0?.isNative ? "Collecting" : "Standard for collecting"} ${token0?.symbol}`}</span>
                        <Badge color="green" text="Native" />
                      </div>
                      <span className="text-14 lg:text-16">
                        {`${token0FeeFormatted} ${token0.symbol}`}
                      </span>
                    </>
                  ) : (
                    <>
                      <Image width={24} height={24} src={token0?.logoURI as any} alt="" />
                      <span className="text-16 font-bold text-secondary-text">{`${token0?.isNative ? "Collecting" : "Standard for collecting"} ${token0?.symbol}`}</span>
                    </>
                  )}
                </div>
                {token0?.isNative ? null : (
                  <div className="flex flex-col gap-2 md:gap-3 mt-3">
                    <RadioButton
                      isActive={token0Standard === Standard.ERC20}
                      onClick={() => setToken0Standard(Standard.ERC20)}
                      disabled={
                        token0Standard !== Standard.ERC20 && status !== CollectFeesStatus.INITIAL
                      }
                    >
                      <div className="flex flex-wrap md:flex-row items-start md:items-center md:justify-between w-full gap-1 md:gap-0">
                        <div className="flex items-center gap-2 md:w-auto">
                          <span className="text-sm lg:text-base ">{t("standard")}</span>
                          <Badge color="green" text="ERC-20" />
                        </div>
                        <span className="text-sm lg:text-base ml-auto md:w-auto text-right md:text-left whitespace-nowrap">
                          {`${token0FeeFormatted} ${token0?.symbol}`}
                        </span>
                      </div>
                    </RadioButton>
                    <RadioButton
                      isActive={token0Standard === Standard.ERC223}
                      onClick={() => setToken0Standard(Standard.ERC223)}
                      disabled={
                        token0Standard !== Standard.ERC223 && status !== CollectFeesStatus.INITIAL
                      }
                    >
                      <div className="flex flex-wrap md:flex-row items-start md:items-center md:justify-between w-full gap-1 md:gap-0">
                        <div className="flex items-center gap-2 md:w-auto">
                          <span className="text-sm lg:text-base ">{t("standard")}</span>
                          <Badge color="green" text="ERC-223" />
                        </div>
                        <span className="text-sm lg:text-base ml-auto md:w-auto text-right md:text-left whitespace-nowrap">
                          {`${token0FeeFormatted} ${token0?.symbol}`}
                        </span>
                      </div>
                    </RadioButton>
                  </div>
                )}
              </div>
              {/* Standard B */}
              <div className="flex flex-col rounded-3 bg-tertiary-bg px-4 lg:px-5 py-3 mt-4">
                <div
                  className={clsx("flex gap-2 items-start", token1?.isNative && "justify-between")}
                >
                  {token1?.isNative ? (
                    <>
                      <div className="flex gap-2 items-center">
                        <Image width={24} height={24} src={token1?.logoURI as any} alt="" />
                        <span className="text-16 font-bold text-secondary-text">{`${token1?.isNative ? "Collecting" : "Standard for collecting"} ${token1?.symbol}`}</span>
                        <Badge color="green" text="Native" />
                      </div>
                      <span className="text-14 lg:text-16">{token1FeeFormatted}</span>
                    </>
                  ) : (
                    <>
                      <Image width={24} height={24} src={token1?.logoURI as any} alt="" />
                      <span className="text-16 font-bold text-secondary-text">{`${token1?.isNative ? "Collecting" : "Standard for collecting"} ${token1?.symbol}`}</span>
                    </>
                  )}
                </div>
                {token1?.isNative ? null : (
                  <div className="flex flex-col gap-2 mt-3">
                    <RadioButton
                      isActive={token1Standard === Standard.ERC20}
                      onClick={() => setToken1Standard(Standard.ERC20)}
                      disabled={
                        token1Standard !== Standard.ERC20 && status !== CollectFeesStatus.INITIAL
                      }
                    >
                      <div className="flex flex-wrap md:flex-row items-start md:items-center md:justify-between w-full gap-1 md:gap-0">
                        <div className="flex items-center gap-2 md:w-auto">
                          <span className="text-sm lg:text-base ">{t("standard")}</span>
                          <Badge color="green" text="ERC-20" />
                        </div>
                        <span className="text-sm lg:text-base ml-auto md:w-auto text-right md:text-left whitespace-nowrap">
                          {`${token1FeeFormatted} ${token1?.symbol}`}
                        </span>
                      </div>
                    </RadioButton>
                    <RadioButton
                      isActive={token1Standard === Standard.ERC223}
                      onClick={() => setToken1Standard(Standard.ERC223)}
                      disabled={
                        token1Standard !== Standard.ERC223 && status !== CollectFeesStatus.INITIAL
                      }
                    >
                      <div className="flex flex-wrap md:flex-row items-start md:items-center md:justify-between w-full gap-1 md:gap-0">
                        <div className="flex items-center gap-2 md:w-auto">
                          <span className="text-sm lg:text-base ">{t("standard")}</span>
                          <Badge color="green" text="ERC-223" />
                        </div>
                        <span className="text-sm lg:text-base ml-auto md:w-auto text-right md:text-left whitespace-nowrap">
                          {`${token1FeeFormatted} ${token1?.symbol}`}
                        </span>
                      </div>
                    </RadioButton>
                  </div>
                )}
              </div>
              <div className="text-secondary-text my-4 text-14 lg:text-16">
                {t("collecting_fee_message")}
              </div>
            </div>
            <div className="flex-shrink-0 w-full h-[1px] bg-quaternary-bg mb-4 md:hidden" />
            <div className="flex-shrink-0 card-spacing md:w-[570px] md:h-auto">
              <RemoveLiquidityGasSettings
                gasPriceOption={gasPriceOption}
                gasPriceSettings={gasPriceSettings}
                setGasPriceOption={setGasPriceOption}
                setGasPriceSettings={setGasPriceSettings}
                estimatedGas={estimatedGas}
                customGasLimit={customGasLimit}
                setEstimatedGas={setEstimatedGas}
                setCustomGasLimit={setCustomGasLimit}
                isAdvanced={isAdvanced}
                setIsAdvanced={setIsAdvanced}
                gasPrice={gasPrice}
              />

              {[CollectFeesStatus.INITIAL].includes(status) ? (
                <Button onClick={() => handleCollectFees()} fullWidth>
                  {t("collect_fees_title")}
                </Button>
              ) : null}
              {CollectFeesStatus.LOADING === status ? (
                <Button fullWidth isLoading={true}>
                  {t("collect_fees_title")}
                  <span className="flex items-center gap-2">
                    <Preloader size={20} color="black" />
                  </span>
                </Button>
              ) : null}
              {CollectFeesStatus.PENDING === status ? (
                <Button fullWidth disabled>
                  <span className="flex items-center gap-2">
                    <Preloader size={20} color="green" type="linear" />
                  </span>
                </Button>
              ) : null}
              {[CollectFeesStatus.ERROR].includes(status) ? (
                <div className="flex flex-col gap-5">
                  <Alert
                    withIcon={false}
                    type="error"
                    text={
                      <span>
                        {t("failed_transaction_error_message")}{" "}
                        <a href="#" className="text-green hocus:text-green-hover underline">
                          {t("common_errors")}
                        </a>
                        .
                      </span>
                    }
                  />
                  <Button onClick={() => handleCollectFees()} fullWidth>
                    Try again
                  </Button>
                </div>
              ) : null}
              {[CollectFeesStatus.SUCCESS].includes(status) ? (
                <Button onClick={handleClose} fullWidth>
                  Close
                </Button>
              ) : null}
            </div>
          </div>
        </DrawerDialog>
      </div>
    </Container>
  );
}