import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { PropsWithChildren, ReactNode, useEffect, useMemo, useState } from "react";
import { NumericFormat } from "react-number-format";
import { Address, formatGwei, parseUnits } from "viem";
import { useGasPrice } from "wagmi";

import SwapDetailsRow from "@/app/[locale]/swap/components/SwapDetailsRow";
import useSwap, { useSwapStatus } from "@/app/[locale]/swap/hooks/useSwap";
import { useTrade } from "@/app/[locale]/swap/hooks/useTrade";
import { useConfirmSwapDialogStore } from "@/app/[locale]/swap/stores/useConfirmSwapDialogOpened";
import { useSwapAmountsStore } from "@/app/[locale]/swap/stores/useSwapAmountsStore";
import {
  useSwapGasLimitStore,
  useSwapGasPriceStore,
} from "@/app/[locale]/swap/stores/useSwapGasSettingsStore";
import { useSwapSettingsStore } from "@/app/[locale]/swap/stores/useSwapSettingsStore";
import {
  SwapError,
  SwapStatus,
  useSwapStatusStore,
} from "@/app/[locale]/swap/stores/useSwapStatusStore";
import { useSwapTokensStore } from "@/app/[locale]/swap/stores/useSwapTokensStore";
import Alert from "@/components/atoms/Alert";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import Input from "@/components/atoms/Input";
import Preloader from "@/components/atoms/Preloader";
import Svg from "@/components/atoms/Svg";
import Tooltip from "@/components/atoms/Tooltip";
import Badge from "@/components/badges/Badge";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import IconButton from "@/components/buttons/IconButton";
import { networks } from "@/config/networks";
import { clsxMerge } from "@/functions/clsxMerge";
import { formatFloat } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import { useStoreAllowance } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { ROUTER_ADDRESS } from "@/sdk_hybrid/addresses";
import { DexChainId } from "@/sdk_hybrid/chains";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { CurrencyAmount } from "@/sdk_hybrid/entities/fractions/currencyAmount";
import { Percent } from "@/sdk_hybrid/entities/fractions/percent";
import { Standard } from "@/sdk_hybrid/standard";
import { GasFeeModel } from "@/stores/useRecentTransactionsStore";

function ApproveRow({
  logoURI = "",
  isPending = false,
  isLoading = false,
  isSuccess = false,
  isReverted = false,
  hash,
}: {
  logoURI: string | undefined;
  isLoading?: boolean;
  isPending?: boolean;
  isSuccess?: boolean;
  isReverted?: boolean;
  hash?: Address | undefined;
}) {
  const t = useTranslations("Swap");

  return (
    <div
      className={clsx(
        "grid grid-cols-[32px_1fr_1fr] gap-2 h-10 before:absolute relative before:left-[15px] before:-bottom-4 before:w-0.5 before:h-3 before:rounded-1",
        isSuccess ? "before:bg-green" : "before:bg-green-bg",
      )}
    >
      <div className="flex items-center">
        <Image
          className={clsx(isSuccess && "", "rounded-full")}
          src={logoURI}
          alt=""
          width={32}
          height={32}
        />
      </div>

      <div className="flex flex-col justify-center">
        <span className={isSuccess ? "text-secondary-text text-14" : "text-14"}>
          {isSuccess && t("approved")}
          {isPending && "Confirm in your wallet"}
          {isLoading && "Approving"}
          {!isSuccess && !isPending && !isReverted && !isLoading && "Approve"}
          {isReverted && "Approve failed"}
        </span>
        {!isSuccess && <span className="text-green text-12">{t("why_do_i_have_to_approve")}</span>}
      </div>
      <div className="flex items-center gap-2 justify-end">
        {hash && (
          <a
            target="_blank"
            href={getExplorerLink(ExplorerLinkType.TRANSACTION, hash, DexChainId.SEPOLIA)}
          >
            <IconButton iconName="forward" />
          </a>
        )}
        {isPending && (
          <>
            <Preloader type="linear" />
            <span className="text-secondary-text text-14">{t("proceed_in_your_wallet")}</span>
          </>
        )}
        {isLoading && <Preloader size={20} />}
        {isSuccess && <Svg className="text-green" iconName="done" size={20} />}
        {isReverted && <Svg className="text-red-light" iconName="warning" size={20} />}
      </div>
    </div>
  );
}

function SwapRow({
  isPending = false,
  isLoading = false,
  isSuccess = false,
  isSettled = false,
  isReverted = false,
  isDisabled = false,
  hash,
}: {
  isLoading?: boolean;
  isPending?: boolean;
  isSettled?: boolean;
  isSuccess?: boolean;
  isReverted?: boolean;
  isDisabled?: boolean;
  hash?: Address | undefined;
}) {
  const t = useTranslations("Swap");

  return (
    <div className="grid grid-cols-[32px_1fr_1fr] gap-2 h-10">
      <div className="flex items-center h-full">
        <div
          className={clsxMerge(
            "p-1 rounded-full h-8 w-8",
            isDisabled ? "bg-tertiary-bg" : "bg-green-bg",
            isReverted && "bg-red-bg",
          )}
        >
          <Svg
            className={clsxMerge(
              "rotate-90",
              isDisabled ? "text-tertiary-text" : "text-green",
              isReverted && "text-red-light",
            )}
            iconName="swap"
          />
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <span className={clsx("text-14", isDisabled ? "text-tertiary-text" : "text-primary-text")}>
          {(isPending || (!isLoading && !isReverted && !isSuccess)) && t("confirm_swap")}
          {isLoading && t("executing_swap")}
          {isReverted && "Failed to confirm a swap"}
          {isSuccess && "Executed swap"}
        </span>
        {(isPending || isLoading) && (
          <span className="text-green text-12">{t("learn_more_about_swap")}</span>
        )}
      </div>
      <div className="flex items-center gap-2 justify-end">
        {hash && (
          <a
            target="_blank"
            href={getExplorerLink(ExplorerLinkType.TRANSACTION, hash, DexChainId.SEPOLIA)}
          >
            <IconButton iconName="forward" />
          </a>
        )}
        {isPending && (
          <>
            <Preloader type="linear" />
            <span className="text-secondary-text text-14">{t("proceed_in_your_wallet")}</span>
          </>
        )}
        {isLoading && <Preloader size={20} />}
        {isSuccess && <Svg className="text-green" iconName="done" size={20} />}
        {isReverted && <Svg className="text-red-light" iconName="warning" size={20} />}
      </div>
    </div>
  );
}
function Rows({ children }: PropsWithChildren<{}>) {
  return <div className="flex flex-col gap-5">{children}</div>;
}

function SwapActionButton({
  amountToApprove,
  isEditApproveActive,
}: {
  amountToApprove: string;
  isEditApproveActive: boolean;
}) {
  const t = useTranslations("Swap");
  const { tokenA, tokenB, tokenAStandard } = useSwapTokensStore();
  const { typedValue } = useSwapAmountsStore();
  const { isOpen, setIsOpen } = useConfirmSwapDialogStore();
  const { status: swapStatus } = useSwapStatusStore();

  const { handleSwap } = useSwap();

  const {
    isPendingApprove,
    isLoadingApprove,
    isPendingSwap,
    isLoadingSwap,
    isSuccessSwap,
    isSettledSwap,
    isRevertedSwap,
    isRevertedApprove,
  } = useSwapStatus();

  const { swapHash, approveHash, errorType } = useSwapStatusStore();

  if (!tokenA || !tokenB) {
    return (
      <Button fullWidth disabled>
        {t("select_tokens")}
      </Button>
    );
  }

  if (!typedValue) {
    return (
      <Button fullWidth disabled>
        {t("enter_amount")}
      </Button>
    );
  }

  if (tokenA.isToken && tokenAStandard === Standard.ERC20) {
    if (isPendingApprove) {
      return (
        <Rows>
          <ApproveRow isPending logoURI={tokenA.logoURI} />
          <SwapRow isDisabled />
        </Rows>
      );
    }

    if (isLoadingApprove) {
      return (
        <Rows>
          <ApproveRow hash={approveHash} isLoading logoURI={tokenA.logoURI} />
          <SwapRow isDisabled />
        </Rows>
      );
    }

    if (isRevertedApprove) {
      return (
        <>
          <Rows>
            <ApproveRow hash={approveHash} isReverted logoURI={tokenA.logoURI} />
            <SwapRow isDisabled />
          </Rows>
          <div className="flex flex-col gap-5 mt-4">
            <Alert
              withIcon={false}
              type="error"
              text={
                <span>
                  Transaction failed due to lack of gas or an internal contract error. Try using
                  higher slippage or gas to ensure your transaction is completed. If you still have
                  issues, click{" "}
                  <a href="#" className="text-green hocus:underline">
                    common errors
                  </a>
                  .
                </span>
              }
            />
            <Button
              fullWidth
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Try again
            </Button>
          </div>
        </>
      );
    }
  }

  if (isPendingSwap) {
    return (
      <Rows>
        {tokenA.isToken && tokenAStandard === Standard.ERC20 && (
          <ApproveRow hash={approveHash} isSuccess logoURI={tokenA.logoURI} />
        )}
        <SwapRow isPending />
      </Rows>
    );
  }

  if (isLoadingSwap) {
    return (
      <Rows>
        {tokenA.isToken && tokenAStandard === Standard.ERC20 && (
          <ApproveRow hash={approveHash} isSuccess logoURI={tokenA.logoURI} />
        )}
        <SwapRow hash={swapHash} isLoading />
      </Rows>
    );
  }

  if (isSuccessSwap) {
    return (
      <Rows>
        {tokenA.isToken && tokenAStandard === Standard.ERC20 && (
          <ApproveRow hash={approveHash} isSuccess logoURI={tokenA.logoURI} />
        )}
        <SwapRow hash={swapHash} isSettled isSuccess />
      </Rows>
    );
  }

  if (isRevertedSwap) {
    return (
      <>
        <Rows>
          {tokenA.isToken && tokenAStandard === Standard.ERC20 && (
            <ApproveRow hash={approveHash} isSuccess logoURI={tokenA.logoURI} />
          )}
          <SwapRow hash={swapHash} isSettled isReverted />
        </Rows>
        <div className="flex flex-col gap-5 mt-4">
          <Alert
            withIcon={false}
            type="error"
            text={
              errorType === SwapError.UNKNOWN ? (
                <span>
                  Transaction failed due to lack of gas or an internal contract error. Try using
                  higher slippage or gas to ensure your transaction is completed. If you still have
                  issues, click{" "}
                  <a href="#" className="text-green hocus:underline">
                    common errors
                  </a>
                  .
                </span>
              ) : (
                <span>
                  Transaction failed due to lack of gas. Try increasing gas limit to ensure your
                  transaction is completed. If you still have issues, contact support.
                </span>
              )
            }
          />
          <Button
            fullWidth
            onClick={() => {
              setIsOpen(false);
            }}
          >
            Try again
          </Button>
        </div>
      </>
    );
  }

  return (
    <Button disabled={isEditApproveActive} onClick={() => handleSwap(amountToApprove)} fullWidth>
      {t("confirm_swap")}
    </Button>
  );
}
function ReadonlyTokenAmountCard({
  token,
  amount,
  amountUSD,
  standard,
  title,
}: {
  token: Currency | undefined;
  amount: string;
  amountUSD: string | undefined;
  standard: Standard;
  title: string;
}) {
  return (
    <div className="rounded-3 bg-tertiary-bg py-4 px-5 flex flex-col gap-1">
      <p className="text-secondary-text text-14">{title}</p>
      <div className="flex justify-between items-center text-20">
        <span>{amount}</span>
        <div className="flex items-center gap-2">
          <Image
            src={token?.logoURI || "/images/tokens/placeholder.svg"}
            alt=""
            width={32}
            height={32}
          />
          {token?.symbol}
          <Badge color="green" text={token?.isNative ? "Native" : standard} />
        </div>
      </div>
      <p className="text-secondary-text text-14">${amountUSD}</p>
    </div>
  );
}

export default function ConfirmSwapDialog() {
  const t = useTranslations("Swap");
  const {
    tokenA,
    tokenB,
    tokenAStandard,
    tokenBStandard,
    reset: resetTokens,
  } = useSwapTokensStore();
  const { typedValue, reset: resetAmounts } = useSwapAmountsStore();
  const chainId = useCurrentChainId();

  const { isOpen, setIsOpen } = useConfirmSwapDialogStore();

  const { trade } = useTrade();

  console.log(trade);

  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    return trade?.outputAmount;
  }, [trade?.outputAmount]);

  const output = useMemo(() => {
    if (!trade) {
      return "";
    }

    return trade.outputAmount.toSignificant();
  }, [trade]);

  const { slippage, deadline: _deadline } = useSwapSettingsStore();
  const {
    isPendingSwap,
    isLoadingSwap,
    isSuccessSwap,
    isLoadingApprove,
    isPendingApprove,
    isRevertedSwap,
    isSettledSwap,
    isRevertedApprove,
  } = useSwapStatus();

  const { status: swapStatus, setStatus: setSwapStatus } = useSwapStatusStore();

  const { estimatedGas, customGasLimit } = useSwapGasLimitStore();

  const isProcessing = useMemo(() => {
    return (
      isPendingSwap ||
      isLoadingSwap ||
      isSettledSwap ||
      isLoadingApprove ||
      isPendingApprove ||
      isRevertedApprove
    );
  }, [
    isLoadingApprove,
    isLoadingSwap,
    isPendingApprove,
    isPendingSwap,
    isRevertedApprove,
    isSettledSwap,
  ]);

  const [amountToApprove, setAmountToApprove] = useState(typedValue);
  // const { gasOption, gasPrice, gasLimit } = useSwapGasSettingsStore();

  useEffect(() => {
    if (typedValue) {
      setAmountToApprove(typedValue);
    }
  }, [typedValue]);

  const { gasPriceSettings } = useSwapGasPriceStore();
  const { data: baseFee } = useGasPrice();

  const computedGasSpending = useMemo(() => {
    if (gasPriceSettings.model === GasFeeModel.LEGACY && gasPriceSettings.gasPrice) {
      return formatFloat(formatGwei(gasPriceSettings.gasPrice));
    }

    if (
      gasPriceSettings.model === GasFeeModel.EIP1559 &&
      gasPriceSettings.maxFeePerGas &&
      gasPriceSettings.maxPriorityFeePerGas &&
      baseFee
    ) {
      const lowerFeePerGas =
        gasPriceSettings.maxFeePerGas > baseFee ? baseFee : gasPriceSettings.maxFeePerGas;

      return formatFloat(formatGwei(lowerFeePerGas + gasPriceSettings.maxPriorityFeePerGas));
    }

    return "0.00";
  }, [baseFee, gasPriceSettings]);

  useEffect(() => {
    if (isSuccessSwap && !isOpen) {
      resetAmounts();
    }
  }, [isSuccessSwap, resetAmounts, isOpen]);

  useEffect(() => {
    if ((isSuccessSwap || isRevertedSwap || isRevertedApprove) && !isOpen) {
      setTimeout(() => {
        setSwapStatus(SwapStatus.INITIAL);
      }, 400);
    }
  }, [isOpen, isRevertedApprove, isRevertedSwap, isSuccessSwap, setSwapStatus, swapStatus]);

  const [isEditApproveActive, setEditApproveActive] = useState(false);

  const { isAllowed: isAllowedA } = useStoreAllowance({
    token: tokenA,
    contractAddress: ROUTER_ADDRESS[chainId],
    amountToCheck: parseUnits(typedValue, tokenA?.decimals ?? 18),
  });

  return (
    <DrawerDialog
      isOpen={isOpen}
      setIsOpen={(isOpen) => {
        setIsOpen(isOpen);
      }}
    >
      <div className="bg-primary-bg rounded-5 w-full sm:w-[600px]">
        <DialogHeader
          onClose={() => {
            setIsOpen(false);
          }}
          title={t("review_swap")}
        />
        <div className="card-spacing">
          {!isSettledSwap && !isRevertedApprove && (
            <div className="flex flex-col gap-3">
              <ReadonlyTokenAmountCard
                token={tokenA}
                amount={typedValue}
                amountUSD={"0.00"}
                standard={tokenAStandard}
                title={t("you_pay")}
              />
              <ReadonlyTokenAmountCard
                token={tokenB}
                amount={output}
                amountUSD={"0.00"}
                standard={tokenBStandard}
                title={t("you_receive")}
              />
            </div>
          )}
          {(isSettledSwap || isRevertedApprove) && (
            <div>
              <div className="mx-auto w-[80px] h-[80px] flex items-center justify-center relative mb-5">
                {(isRevertedSwap || isRevertedApprove) && <EmptyStateIcon iconName="warning" />}

                {isSuccessSwap && (
                  <>
                    <div className="w-[54px] h-[54px] rounded-full border-[7px] blur-[8px] opacity-80 border-green" />
                    <Svg
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green"
                      iconName={"success"}
                      size={65}
                    />
                  </>
                )}
              </div>

              <div className="flex justify-center">
                <span className="text-20 font-bold text-primary-text mb-1">
                  {isRevertedSwap && t("swap_failed")}
                  {isSuccessSwap && t("successful_swap")}
                  {isRevertedApprove && "Approve failed"}
                </span>
              </div>

              <div className="flex justify-center gap-2 items-center">
                <Image
                  src={tokenA?.logoURI || "/images/tokens/placeholder.svg"}
                  alt=""
                  width={24}
                  height={24}
                />
                <span>
                  {tokenA?.symbol} {typedValue}
                </span>
                <Svg iconName="next" />
                <Image
                  src={tokenB?.logoURI || "/images/tokens/placeholder.svg"}
                  alt=""
                  width={24}
                  height={24}
                />
                <span>
                  {tokenB?.symbol} {output}
                </span>
              </div>
            </div>
          )}
          {!isProcessing && (
            <div className="pb-4 flex flex-col gap-2 rounded-b-3 text-14 mt-4">
              <SwapDetailsRow
                title={t("network_fee")}
                value={
                  <div>
                    <span className="text-secondary-text mr-1 text-14">
                      {computedGasSpending} GWEI
                    </span>{" "}
                    <span className="mr-1 text-14">~$0.00</span>
                  </div>
                }
                tooltipText={t("network_fee_tooltip", {
                  networkName: networks.find((n) => n.chainId === chainId)?.name,
                })}
              />
              <SwapDetailsRow
                title={t("minimum_received")}
                value={
                  trade
                    ?.minimumAmountOut(new Percent(slippage * 100, 10000), dependentAmount)
                    .toSignificant() || "Loading..."
                }
                tooltipText={t("minimum_received_tooltip")}
              />
              <SwapDetailsRow
                title={t("price_impact")}
                value={trade ? `${formatFloat(trade.priceImpact.toSignificant())}%` : "Loading..."}
                tooltipText={t("price_impact_tooltip")}
              />
              <SwapDetailsRow
                title={t("trading_fee")}
                value={
                  typedValue && Boolean(+typedValue) && tokenA
                    ? `${(+typedValue * 0.3) / 100} ${tokenA.symbol}`
                    : "Loading..."
                }
                tooltipText={t("trading_fee_tooltip")}
              />
              <SwapDetailsRow
                title={t("order_routing")}
                value={t("direct_swap")}
                tooltipText={t("route_tooltip")}
              />
              <SwapDetailsRow
                title={t("maximum_slippage")}
                value={`${slippage}%`}
                tooltipText={t("maximum_slippage_tooltip")}
              />
              <SwapDetailsRow
                title={t("gas_limit")}
                value={
                  customGasLimit
                    ? customGasLimit.toString()
                    : (estimatedGas + BigInt(30000)).toString() || "Loading..."
                }
                tooltipText={t("gas_limit_tooltip")}
              />

              {tokenA?.isToken && tokenAStandard === Standard.ERC20 && !isAllowedA && (
                <div
                  className={clsx(
                    "bg-tertiary-bg rounded-3 flex items-center px-5 py-2 min-h-12 mt-2 gap-2",
                    +amountToApprove < +typedValue && "sm:pb-[26px]",
                  )}
                >
                  <div className="sm:items-center sm:justify-between sm:gap-5 flex-grow flex flex-col gap-1 sm:flex-row">
                    <div className="flex items-center gap-1 text-secondary-text whitespace-nowrap sm:flex-row-reverse">
                      <span>Approve amount</span>
                      <Tooltip text={"Tooltip_text"} />
                    </div>

                    {!isEditApproveActive ? (
                      <span>
                        {amountToApprove} {tokenA.symbol}
                      </span>
                    ) : (
                      <div className="flex-grow">
                        <div className="relative w-full flex-grow">
                          <NumericFormat
                            inputMode="decimal"
                            allowedDecimalSeparators={[","]}
                            isError={+amountToApprove < +typedValue}
                            className="h-8 pl-3"
                            value={amountToApprove}
                            onValueChange={(values) => {
                              setAmountToApprove(values.value);
                            }}
                            customInput={Input}
                            allowNegative={false}
                            type="text"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-tertiary-text">
                            {tokenA.symbol}
                          </span>
                        </div>
                        {+amountToApprove < +typedValue && (
                          <span className="text-red-light sm:absolute text-12 sm:translate-y-0.5">
                            Must be higher or equal {typedValue}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    {!isEditApproveActive ? (
                      <Button
                        size={ButtonSize.EXTRA_SMALL}
                        mobileSize={ButtonSize.SMALL}
                        colorScheme={ButtonColor.LIGHT_GREEN}
                        onClick={() => setEditApproveActive(true)}
                        className="!rounded-20"
                      >
                        Edit
                      </Button>
                    ) : (
                      <Button
                        disabled={+amountToApprove < +typedValue}
                        size={ButtonSize.EXTRA_SMALL}
                        mobileSize={ButtonSize.SMALL}
                        colorScheme={ButtonColor.LIGHT_GREEN}
                        onClick={() => setEditApproveActive(false)}
                        className="!rounded-20"
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {isProcessing && <div className="h-px w-full bg-secondary-border mb-4 mt-5" />}
          <SwapActionButton
            isEditApproveActive={isEditApproveActive}
            amountToApprove={amountToApprove}
          />
        </div>
      </div>
    </DrawerDialog>
  );
}
