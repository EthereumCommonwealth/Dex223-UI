"use client";

import JSBI from "jsbi";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

import useRemoveLiquidity, {
  useRemoveLiquidityEstimatedGas,
} from "@/app/[locale]/remove/[tokenId]/hooks/useRemoveLiquidity";
import { useSwapRecentTransactionsStore } from "@/app/[locale]/swap/stores/useSwapRecentTransactions";
import Alert from "@/components/atoms/Alert";
import Container from "@/components/atoms/Container";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Preloader from "@/components/atoms/Preloader";
import Svg from "@/components/atoms/Svg";
import RangeBadge, { PositionRangeStatus } from "@/components/badges/RangeBadge";
import Button from "@/components/buttons/Button";
import IconButton, { IconButtonSize, IconSize } from "@/components/buttons/IconButton";
import InputButton from "@/components/buttons/InputButton";
import RecentTransactions from "@/components/common/RecentTransactions";
import SelectedTokensInfo from "@/components/common/SelectedTokensInfo";
import TokensPair from "@/components/common/TokensPair";
import { useConnectWalletDialogStateStore } from "@/components/dialogs/stores/useConnectWalletStore";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import {
  usePositionFromPositionInfo,
  usePositionFromTokenId,
  usePositionRangeStatus,
} from "@/hooks/usePositions";
import { useRecentTransactionTracking } from "@/hooks/useRecentTransactionTracking";
import { Link, useRouter } from "@/navigation";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { Percent } from "@/sdk_hybrid/entities/fractions/percent";

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
      <div className="flex items-center gap-2">
        <span>{`Pooled ${token?.symbol}:`}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold">{amount}</span>
        <Image
          src={token?.logoURI || "/tokens/placeholder.svg"}
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
  const { address, isConnected } = useAccount();
  const tWallet = useTranslations("Wallet");
  const { setIsOpened: setWalletConnectOpened } = useConnectWalletDialogStateStore();

  const { position: positionInfo, loading } = usePositionFromTokenId(tokenId);
  const position = usePositionFromPositionInfo(positionInfo);
  const chainId = useCurrentChainId();
  // const [value, setValue] = useState(25);
  const [tokenA, tokenB, fee] = useMemo(() => {
    return position?.pool.token0 && position?.pool.token1 && position?.pool.fee
      ? [position.pool.token0, position.pool.token1, position.pool.fee]
      : [undefined, undefined];
  }, [position?.pool.fee, position?.pool.token0, position?.pool.token1]);

  const { inRange, removed } = usePositionRangeStatus({ position });
  // const [showRecentTransactions, setShowRecentTransactions] = useState(true);

  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useSwapRecentTransactionsStore();

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
  const { status, hash } = useRemoveLiquidityStatusStore();

  const { handleRemoveLiquidity } = useRemoveLiquidity();

  const handleClose = () => {
    reset();
    setIsOpen(false);
  };

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
    setTokenId(tokenId);
  }, [tokenId, setTokenId]);

  if (!tokenA || !tokenB) return <div>Error: Token A or B undefined</div>;

  return (
    <Container>
      <div className="lg:w-[600px] bg-primary-bg mx-auto mt-[40px] mb-4 lg:mb-5 px-4 lg:px-10 pb-4 lg:pb-10 rounded-5">
        <div className="grid grid-cols-3 py-1.5 -mx-3">
          <IconButton
            onClick={() => router.push(`/pool/${params.tokenId}`)}
            buttonSize={IconButtonSize.LARGE}
            iconName="back"
            iconSize={IconSize.LARGE}
          />
          <h2 className="text-18 lg:text-20 font-bold flex justify-center items-center text-nowrap">
            Remove liquidity
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

          <div className="mb-4 lg:mb-5">
            <span className="text-12 lg:text-16 mb-2 text-secondary-text">Amount</span>
            <div className="flex justify-between items-center mb-4">
              <span className="text-24 lg:text-32">{percentage}%</span>
              <div className="flex gap-3">
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
                  text={"MAX"}
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPercentage(+e.target.value)}
                className="w-full accent-green absolute top-2 left-0 right-0 duration-200"
                type="range"
              />
              <div
                className="pointer-events-none absolute bg-green h-2 rounded-1 left-0 top-2"
                style={{ width: percentage === 1 ? 0 : `calc(${percentage}% - 2px)` }}
              ></div>
            </div>
          </div>
          <div className="rounded-3 bg-tertiary-bg mb-4 lg:mb-5 p-5">
            <div className="flex justify-between lg:flex-col gap-3">
              <PositionLiquidityCard
                token={tokenA}
                amount={
                  position?.amount0
                    .multiply(new Percent(percentage))
                    .divide(JSBI.BigInt(100))
                    .toSignificant() || "Loading..."
                }
              />
              <PositionLiquidityCard
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
            <Button onClick={() => setWalletConnectOpened(true)} fullWidth>
              {tWallet("connect_wallet")}
            </Button>
          ) : (
            position &&
            tokenA &&
            tokenB && (
              <Button onClick={() => setIsOpen(true)} fullWidth>
                Remove
              </Button>
            )
          )}
        </div>
      </div>
      <div className="flex flex-col lg:w-[600px] mx-auto lg:mb-[40px] gap-5">
        <SelectedTokensInfo tokenA={tokenA} tokenB={tokenB} />
        <RecentTransactions
          showRecentTransactions={showRecentTransactions}
          handleClose={() => setShowRecentTransactions(false)}
          pageSize={5}
        />
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
        <DialogHeader onClose={handleClose} title="Confirm removing liquidity" />
        <div className="px-4 md:px-10 md:w-[570px] pb-4 md:pb-10 md:h-auto overflow-y-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="flex items-center relative w-10 lg:w-12 h-[24px] lg:h-[34px]">
                <Image
                  className="absolute left-0 top-0 w-[24px] lg:w-[34px] h-[24px] lg:h-[34px]"
                  width={32}
                  height={32}
                  src={tokenA.logoURI as any}
                  alt=""
                />
                <div className="w-[24px] lg:w-[34px] h-[24px] lg:h-[34px] flex absolute right-0 top-0 bg-tertiary-bg rounded-full items-center justify-center">
                  <Image width={32} height={32} src={tokenB.logoURI as any} alt="" />
                </div>
              </div>
              <span className="text-16 lg:text-18 font-bold">{`${tokenA.symbol} and ${tokenB.symbol}`}</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              {hash && (
                <a
                  target="_blank"
                  href={getExplorerLink(ExplorerLinkType.TRANSACTION, hash, chainId)}
                >
                  <IconButton iconName="forward" />
                </a>
              )}

              {status === RemoveLiquidityStatus.PENDING && (
                <>
                  <Preloader type="linear" />
                  <span className="text-secondary-text text-14">Proceed in your wallet</span>
                </>
              )}
              {status === RemoveLiquidityStatus.LOADING && <Preloader size={24} />}
              {status === RemoveLiquidityStatus.SUCCESS && (
                <Svg className="text-green" iconName="done" size={24} />
              )}
              {status === RemoveLiquidityStatus.ERROR && (
                <Svg className="text-red-light" iconName="warning" size={24} />
              )}
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
                handleRemoveLiquidity();
              }}
              fullWidth
            >
              Confirm removing liquidity
            </Button>
          ) : null}
          {[RemoveLiquidityStatus.LOADING, RemoveLiquidityStatus.PENDING].includes(status) ? (
            <Button fullWidth disabled>
              <span className="flex items-center gap-2">
                <Preloader size={20} color="black" />
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
                    Transaction failed due to lack of gas or an internal contract error. Try using
                    higher slippage or gas to ensure your transaction is completed. If you still
                    have issues, click{" "}
                    <a href="#" className="text-green hocus:underline">
                      common errors
                    </a>
                    .
                  </span>
                }
              />
              <Button
                onClick={() => {
                  handleRemoveLiquidity();
                }}
                fullWidth
              >
                Try again
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
                    Tokens have been transferred to your position. You can claim them using the
                    following link:{" "}
                    <Link href={`/pool/${params.tokenId}`}>
                      <span className="text-green hocus:underline">claim tokens</span>
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
