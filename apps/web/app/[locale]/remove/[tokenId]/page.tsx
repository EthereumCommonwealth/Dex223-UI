"use client";

import clsx from "clsx";
import JSBI from "jsbi";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { NumericFormat } from "react-number-format";
import { useAccount } from "wagmi";

import { useRefreshDepositsDataStore } from "@/app/[locale]/portfolio/components/stores/useRefreshTableStore";
import useRemoveLiquidity, {
  useRemoveLiquidityEstimatedGas,
} from "@/app/[locale]/remove/[tokenId]/hooks/useRemoveLiquidity";
import { useRemoveRecentTransactionsStore } from "@/app/[locale]/remove/[tokenId]/stores/useRemoveLiquidityRecentTransactionsStore";
import Alert from "@/components/atoms/Alert";
import Container from "@/components/atoms/Container";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Preloader from "@/components/atoms/Preloader";
import Svg from "@/components/atoms/Svg";
import RangeBadge, { PositionRangeStatus } from "@/components/badges/RangeBadge";
import Button, { ButtonSize, ButtonVariant } from "@/components/buttons/Button";
import IconButton, {
  IconButtonSize,
  IconButtonVariant,
  IconSize,
} from "@/components/buttons/IconButton";
import InputButton from "@/components/buttons/InputButton";
import RecentTransactions from "@/components/common/RecentTransactions";
import SelectedTokensInfo from "@/components/common/SelectedTokensInfo";
import TokensPair from "@/components/common/TokensPair";
import { useConnectWalletDialogStateStore } from "@/components/dialogs/stores/useConnectWalletStore";
import { clsxMerge } from "@/functions/clsxMerge";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import {
  usePositionFromPositionInfo,
  usePositionFromTokenId,
  usePositionRangeStatus,
} from "@/hooks/usePositions";
import { useRecentTransactionTracking } from "@/hooks/useRecentTransactionTracking";
import { Link, useRouter } from "@/i18n/routing";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { Percent } from "@/sdk_hybrid/entities/fractions/percent";
import { RecentTransactionTitleTemplate } from "@/stores/useRecentTransactionsStore";

import PositionLiquidityCard from "../../pool/[tokenId]/components/PositionLiquidityCard";
import { RemoveLiquidityGasSettings } from "./components/RemoveLiquidityGasSettings";
import {
  useRemoveLiquidityGasLimitStore,
  useRemoveLiquidityGasModeStore,
  useRemoveLiquidityGasPrice,
  useRemoveLiquidityGasPriceStore,
} from "./stores/useRemoveLiquidityGasSettings";
import {
  RemoveLiquidityStatus,
  useRemoveLiquidityStatusStore,
} from "./stores/useRemoveLiquidityStatusStore";
import { useRemoveLiquidityStore } from "./stores/useRemoveLiquidityStore";

const RemoveLiquidityRow = ({ token, amount }: { token: Currency | undefined; amount: string }) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2 text-secondary-text">
        <span>{`Pooled ${token?.symbol}:`}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold">{amount}</span>
        <Image
          src={token?.logoURI || "/images/tokens/placeholder.svg"}
          alt={token?.symbol || ""}
          width={24}
          height={24}
        />
      </div>
    </div>
  );
};

export default function DecreaseLiquidityPage({
  params,
}: {
  params: {
    tokenId: string;
  };
}) {
  useRecentTransactionTracking();
  useRemoveLiquidityEstimatedGas();

  const [isOpen, setIsOpen] = useState(false);
  const tokenId = useMemo(() => {
    return BigInt(params.tokenId);
  }, [params.tokenId]);

  const router = useRouter();
  const { isConnected } = useAccount();
  const tWallet = useTranslations("Wallet");
  const { setIsOpened: setWalletConnectOpened } = useConnectWalletDialogStateStore();

  const { position: positionInfo } = usePositionFromTokenId(tokenId, false);
  const position = usePositionFromPositionInfo(positionInfo);
  const chainId = useCurrentChainId();
  // const [value, setValue] = useState(25);
  const [tokenA, tokenB] = useMemo(() => {
    return position?.pool.token0 && position?.pool.token1 && position?.pool.fee
      ? [position.pool.token0, position.pool.token1, position.pool.fee]
      : [undefined, undefined];
  }, [position?.pool.fee, position?.pool.token0, position?.pool.token1]);

  const { inRange, removed } = usePositionRangeStatus({ position });
  // const [showRecentTransactions, setShowRecentTransactions] = useState(true);

  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useRemoveRecentTransactionsStore();

  const { gasPriceOption, gasPriceSettings, setGasPriceOption, setGasPriceSettings } =
    useRemoveLiquidityGasPriceStore();
  const { estimatedGas, customGasLimit, setEstimatedGas, setCustomGasLimit } =
    useRemoveLiquidityGasLimitStore();

  const { isAdvanced, setIsAdvanced } = useRemoveLiquidityGasModeStore();

  const gasPrice: bigint | undefined = useRemoveLiquidityGasPrice();

  const {
    reset,
    percentage,
    setPercentage,
    setPosition,
    setTokenA,
    setTokenB,
    setTokenId,
    position: storedPosition,
  } = useRemoveLiquidityStore();
  const { setStatus, status, hash } = useRemoveLiquidityStatusStore();
  const { setRefreshDepositsTrigger, refreshDepositsTrigger } = useRefreshDepositsDataStore();
  const t = useTranslations("Liquidity");

  const { handleRemoveLiquidity } = useRemoveLiquidity();

  const handleClose = () => {
    // reset();
    setIsOpen(false);
  };

  const [isFocused, setIsFocused] = useState(false);
  const divRef = useRef(null);

  useEffect(() => {
    if (refreshDepositsTrigger) {
      reset(); // do reset only if removed liquidity
      setRefreshDepositsTrigger(false);
    }
  }, [position, refreshDepositsTrigger, reset, setRefreshDepositsTrigger]);

  // Effect to handle clicks outside the div
  useEffect(() => {
    const handleClickOutside = (event: { target: any }) => {
      // @ts-ignore
      if (divRef.current && !divRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    // Attach event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // TODO: recursion, idk why
    if (position && !storedPosition) {
      setPosition(position);
    }
  }, [position, storedPosition, setPosition]);
  useEffect(() => {
    setTokenA(tokenA);
  }, [tokenA, setTokenA]);
  useEffect(() => {
    setTokenB(tokenB);
  }, [tokenB, setTokenB]);
  useEffect(() => {
    reset();
    setTokenId(tokenId);
  }, [tokenId, setTokenId, reset]);

  if (!tokenA || !tokenB) return <div>Error: Token A or B undefined</div>;

  return (
    <Container>
      <div
        className={clsx(
          "grid py-4 lg:py-[40px] grid-cols-1 mx-auto",
          showRecentTransactions
            ? "xl:grid-cols-[580px_600px] xl:max-w-[1200px] gap-4 xl:grid-areas-[left_right] grid-areas-[right,left]"
            : "xl:grid-cols-[600px] xl:max-w-[600px] grid-areas-[right]",
        )}
      >
        <div className="grid-in-[left] flex justify-center">
          <div className="w-full sm:max-w-[600px] xl:max-w-full mx-auto mt-[40px]">
            <RecentTransactions
              filterFunction={[RecentTransactionTitleTemplate.REMOVE]}
              showRecentTransactions={showRecentTransactions}
              handleClose={() => setShowRecentTransactions(false)}
              store={useRemoveRecentTransactionsStore}
            />
          </div>
        </div>

        <div>
          <div className="lg:w-[600px] bg-primary-bg mx-auto mt-[40px] mb-4 lg:mb-5 px-4 lg:px-10 pb-4 lg:pb-10 rounded-5">
            <div className="grid grid-cols-3 py-1.5 -mx-3">
              <IconButton
                onClick={() => router.push(`/pool/${params.tokenId}`)}
                buttonSize={IconButtonSize.LARGE}
                variant={IconButtonVariant.BACK}
                iconSize={IconSize.LARGE}
              />
              <h2 className="text-18 lg:text-20 font-bold flex justify-center items-center text-nowrap">
                {t("remove_liquidity_title")}
              </h2>
              <div className="flex items-center gap-2 justify-end">
                <IconButton
                  onClick={() => setShowRecentTransactions(!showRecentTransactions)}
                  buttonSize={IconButtonSize.LARGE}
                  iconName="recent-transactions"
                  active={showRecentTransactions}
                />
              </div>
            </div>
            <div className="rounded-b-2 bg-primary-bg">
              <div className="flex items-center justify-between mb-4 lg:mb-5">
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

              <div
                ref={divRef}
                className={clsx(
                  "lg:mb-5 mb-4 bg-secondary-bg rounded-3 p-1 border hocus:shadow hocus:shadow-green/60",
                  isFocused ? "border border-green shadow shadow-green/60" : "border-transparent",
                )}
                onFocus={() => setIsFocused(true)} // Set focus state when NumericFormat is focused
                onClick={() => setIsFocused(true)}
                // onBlur={() => setIsFocused(false)} // Remove focus state when NumericFormat loses focus
              >
                <div className="md:mb-5 md:mt-2 md:ml-5 md:mr-5 mt-1 mb-4 ml-4 mr-4">
                  <span className="text-12 lg:text-16 mb-2 text-secondary-text">
                    {t("amount_title")}
                  </span>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-24 lg:text-24 font-medium relative">
                      <NumericFormat
                        inputMode="decimal"
                        allowedDecimalSeparators={[""]}
                        className="h-8 bg-secondary-bg w-[4rem] "
                        value={percentage}
                        onValueChange={(values) => {
                          const { value } = values;
                          const numericValue = value === "" ? 1 : Number(value);
                          setPercentage(numericValue);
                        }}
                        allowNegative={false}
                        type="text"
                        decimalScale={0}
                        isAllowed={(values) => {
                          const { value } = values;
                          const numericValue = value === "" ? 1 : Number(value);
                          return numericValue >= 1 && numericValue <= 100;
                        }}
                      />
                      <span className="text-secondary-text absolute top-0 left-[45px] md:left-[70px]">
                        %
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <InputButton
                        text={"25%"}
                        isActive={percentage === 25}
                        onClick={() => setPercentage(25)}
                      />
                      <InputButton
                        text={"50%"}
                        isActive={percentage === 50}
                        onClick={() => setPercentage(50)}
                      />
                      <InputButton
                        text={"75%"}
                        isActive={percentage === 75}
                        onClick={() => setPercentage(75)}
                      />
                      <InputButton
                        text={"Max"}
                        isActive={percentage === 100}
                        onClick={() => setPercentage(100)}
                      />
                    </div>
                  </div>

                  <div className="relative h-6">
                    <input
                      value={percentage}
                      max={100}
                      min={1}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setPercentage(+e.target.value)
                      }
                      className="w-full accent-green absolute left-0 right-0 top-2  duration-200"
                      type="range"
                    />
                    <div
                      className="pointer-events-none bg-tertiary-bg top-2 absolute h-2 w-full rounded-l-0 rounded-r-1 right-0"
                      style={{
                        width: `calc(${100 - percentage}% - ${20 - (20 / 100) * percentage}px)`,
                      }}
                    ></div>
                    <div
                      className="pointer-events-none bg-green absolute h-2 rounded-1 left-0 top-2 "
                      style={{ width: percentage === 1 ? 0 : `calc(${percentage}% - 2px)` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="rounded-3 bg-tertiary-bg mb-4 lg:mb-5 p-5">
                <div className="flex justify-between flex-col gap-3">
                  <PositionLiquidityCard
                    token={tokenA}
                    standards={["ERC-20", "ERC-223"]} // TODO check if token has standards
                    amount={
                      position?.amount0
                        .multiply(new Percent(percentage))
                        .divide(JSBI.BigInt(100))
                        .toSignificant() || "Loading..."
                    }
                  />
                  <PositionLiquidityCard
                    token={tokenB}
                    standards={["ERC-20", "ERC-223"]}
                    amount={
                      position?.amount1
                        .multiply(new Percent(percentage))
                        .divide(JSBI.BigInt(100))
                        .toSignificant() || "Loading..."
                    }
                  />
                </div>
              </div>
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
              {!isConnected ? (
                <Button
                  className="h-[48px] md:h-[60px]"
                  onClick={() => setWalletConnectOpened(true)}
                  fullWidth
                >
                  {tWallet("connect_wallet")}
                </Button>
              ) : position && tokenA && tokenB ? (
                [RemoveLiquidityStatus.LOADING, RemoveLiquidityStatus.PENDING].includes(status) ? (
                  <>
                    <div className="flex w-full pl-6 min-h-12 bg-tertiary-bg gap-2 flex-row mb-4 rounded-3 items-center justify-between px-2">
                      <Preloader size={20} color="green" type="circular" />
                      <span className="mr-auto items-center text-14 text-primary-text">
                        {t("remove_liquidity_progress")}
                      </span>
                      <Button
                        className="ml-auto mr-3"
                        variant={ButtonVariant.CONTAINED}
                        size={ButtonSize.EXTRA_SMALL}
                        onClick={() => {
                          setIsOpen(true);
                        }}
                      >
                        {t("details")}
                      </Button>
                    </div>
                    <Button className="h-[48px] md:h-[60px]" isLoading={true} fullWidth>
                      {t("remove_title")}
                      <span className="flex items-center gap-2">
                        <Preloader size={20} color="black" type="circular" />
                      </span>
                    </Button>
                  </>
                ) : (
                  <Button
                    className="h-[48px] md:h-[60px]"
                    onClick={() => {
                      setIsOpen(true);
                      setStatus(RemoveLiquidityStatus.INITIAL);
                      setRefreshDepositsTrigger(false);
                    }}
                    fullWidth
                  >
                    {t("remove_title")}
                  </Button>
                )
              ) : null}
            </div>
          </div>
          <div>
            <div className="flex flex-col lg:w-[600px] mx-auto lg:mb-[40px] gap-5">
              <SelectedTokensInfo tokenA={tokenA} tokenB={tokenB} />
            </div>
          </div>
        </div>
      </div>

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
        <DialogHeader onClose={handleClose} title={t("confirm_removing_liquidity")} />
        <div className="card-spacing md:w-[570px] md:h-auto overflow-y-auto">
          <div
            className={clsxMerge(
              "flex justify-between items-start",
              status === RemoveLiquidityStatus.PENDING && "flex-col md:flex-row",
            )}
          >
            <div className="flex items-start gap-2">
              <div className="flex items-start relative min-w-[36px]  h-[24px] lg:h-[34px]">
                <div className="flex absolute left-0 top-0 w-[24px] lg:w-[34px] h-[24px] lg:h-[34px] items-center justify-center">
                  <Image width={32} height={32} src={tokenA.logoURI as any} alt="" />
                </div>
                <div className="w-[24px] lg:w-[34px] h-[24px] lg:h-[34px] flex absolute left-[12px] lg:left-[17px] top-0 bg-tertiary-bg rounded-full items-center justify-center">
                  <Image width={32} height={32} src={tokenB.logoURI as any} alt="" />
                </div>
              </div>
              <div className={clsxMerge("flex gap-x-2 md:mt-1 md:pl-3 md:flex-row")}>
                <span className="text-16 lg:text-18 items-center font-bold text-secondary-text">{`${tokenA.symbol} and ${tokenB.symbol}`}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 mt-1 justify-end">
              {hash && (
                <a
                  className="flex items-center -mt-2 justify-center"
                  target="_blank"
                  href={getExplorerLink(ExplorerLinkType.TRANSACTION, hash, chainId)}
                >
                  <IconButton iconName="forward" />
                </a>
              )}

              <div className="flex items-start">
                {status === RemoveLiquidityStatus.PENDING && (
                  <div className="flex flex-row flex-nowrap gap-2 mt-2 md:mt-1">
                    <div className="-mt-0.5">
                      <Preloader type="linear" smallDots={true} />
                    </div>
                    <span className="mr-3 text-secondary-text text-14 whitespace-nowrap">
                      {t("status_pending")}
                    </span>
                  </div>
                )}
                {status === RemoveLiquidityStatus.LOADING && (
                  <div className="flex flex-row flex-nowrap gap-2 -mt-1 md:mt-0.5">
                    <Preloader size={24} />
                  </div>
                )}
                {status === RemoveLiquidityStatus.SUCCESS && (
                  <div className="flex flex-row flex-nowrap gap-2 -mt-1 md:mt-0.5">
                    <Svg className="text-green" iconName="done" size={24} />
                  </div>
                )}
                {status === RemoveLiquidityStatus.ERROR && (
                  <div className="flex flex-row flex-nowrap gap-2 -mt-1 md:mt-0.5">
                    <Svg className="text-red-light" iconName="warning" size={24} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="py-5">
            <div className="grid gap-3">
              <RemoveLiquidityRow
                token={tokenA}
                amount={
                  position?.amount0
                    .multiply(new Percent(percentage))
                    .divide(JSBI.BigInt(100))
                    .toSignificant() || "Loading..."
                }
              />
              <RemoveLiquidityRow
                token={tokenB}
                amount={
                  position?.amount1
                    .multiply(new Percent(percentage))
                    .divide(JSBI.BigInt(100))
                    .toSignificant() || "Loading..."
                }
              />
            </div>
          </div>

          {[RemoveLiquidityStatus.INITIAL].includes(status) ? (
            <Button
              onClick={() => {
                handleRemoveLiquidity().then();
              }}
              fullWidth
            >
              {t("confirm_removing_liquidity")}
            </Button>
          ) : null}

          {RemoveLiquidityStatus.LOADING === status ? (
            <Button fullWidth isLoading={true}>
              {t("confirm_removing_liquidity")}
              <span className="flex items-center gap-2">
                <Preloader size={20} color="black" />
              </span>
            </Button>
          ) : null}

          {RemoveLiquidityStatus.PENDING === status ? (
            <Button fullWidth disabled className="bg-tertiary-bg opacity-50">
              <span className="flex items-center gap-2">
                <Preloader size={20} color="green" type="linear" />
              </span>
            </Button>
          ) : null}

          {[RemoveLiquidityStatus.ERROR].includes(status) ? (
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
              <Button
                onClick={() => {
                  handleRemoveLiquidity().then();
                }}
                fullWidth
              >
                {t("try_again")}
              </Button>
            </div>
          ) : null}
          {[RemoveLiquidityStatus.SUCCESS].includes(status) ? (
            <div className="flex flex-col gap-5">
              <Alert
                withIcon={false}
                type="info"
                text={
                  <span>
                    {t("removed_liquidity_message")}:{" "}
                    <Link href={`/pool/${params.tokenId}`}>
                      <span className="text-green duration-200 hocus:text-green-hover underline">
                        {t("claim_tokens")}
                      </span>
                    </Link>
                  </span>
                }
              />
              <Button onClick={handleClose} fullWidth>
                Close
              </Button>
            </div>
          ) : null}
        </div>
      </DrawerDialog>
    </Container>
  );
}
