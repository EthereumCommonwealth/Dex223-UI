import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo } from "react";
import { formatGwei } from "viem";

import useMarginSwap from "@/app/[locale]/margin-swap/hooks/useMarginSwap";
import { useMarginSwapAmountsStore } from "@/app/[locale]/margin-swap/stores/useMarginSwapAmountsStore";
import { useMarginSwapSettingsStore } from "@/app/[locale]/margin-swap/stores/useMarginSwapSettingsStore";
import {
  MarginSwapStatus,
  useMarginSwapStatusStore,
} from "@/app/[locale]/margin-swap/stores/useMarginSwapStatusStore";
import { useMarginSwapTokensStore } from "@/app/[locale]/margin-swap/stores/useMarginSwapTokensStore";
import { useConfirmMarginSwapDialogStore } from "@/app/[locale]/margin-trading/stores/dialogStates";
import SwapDetailsRow from "@/app/[locale]/swap/components/SwapDetailsRow";
import { useSwapStatus } from "@/app/[locale]/swap/hooks/useSwap";
import {
  useSwapGasLimitStore,
  useSwapGasPriceStore,
} from "@/app/[locale]/swap/stores/useSwapGasSettingsStore";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonColor } from "@/components/buttons/Button";
import OperationStepRow, {
  OperationRows,
  operationStatusToStepStatus,
  OperationStepStatus,
} from "@/components/common/OperationStepRow";
import { networks } from "@/config/networks";
import { IconName } from "@/config/types/IconName";
import { formatFloat } from "@/functions/formatFloat";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useUSDPrice } from "@/hooks/useUSDPrice";
import { Currency } from "@/sdk_bi/entities/currency";
import { CurrencyAmount } from "@/sdk_bi/entities/fractions/currencyAmount";
import { Percent } from "@/sdk_bi/entities/fractions/percent";
import { Trade } from "@/sdk_bi/entities/trade";
import { wrappedTokens } from "@/sdk_bi/entities/weth9";
import { Standard } from "@/sdk_bi/standard";
import { useGlobalFees } from "@/shared/hooks/useGlobalFees";
import { GasFeeModel } from "@/stores/useRecentTransactionsStore";
import { slippageToPercent } from "@/functions/slippageToPercent";

type StepTextMap = {
  [key in OperationStepStatus]: string;
};

type OperationStepConfig = {
  iconName: IconName;
  textMap: StepTextMap;
  pending: MarginSwapStatus;
  loading: MarginSwapStatus;
  error: MarginSwapStatus;
};

const closePositionSteps: OperationStepConfig[] = [
  {
    iconName: "swap",
    pending: MarginSwapStatus.PENDING_SWAP,
    loading: MarginSwapStatus.LOADING_SWAP,
    error: MarginSwapStatus.ERROR_SWAP,
    textMap: {
      [OperationStepStatus.IDLE]: "Margin swap",
      [OperationStepStatus.AWAITING_SIGNATURE]: "Margin swap",
      [OperationStepStatus.LOADING]: "Processing margin swap",
      [OperationStepStatus.STEP_COMPLETED]: "Margin swap completed",
      [OperationStepStatus.STEP_FAILED]: "Failed to process margin swap",
      [OperationStepStatus.OPERATION_COMPLETED]: "Margin swap completed",
    },
  },
];

function MarginSwapActionButton() {
  const { handleMarginSwap } = useMarginSwap();

  const { status, marginSwapHash } = useMarginSwapStatusStore();

  if (status !== MarginSwapStatus.INITIAL) {
    return (
      <OperationRows>
        {closePositionSteps.map((step, index) => (
          <OperationStepRow
            key={index}
            iconName={step.iconName}
            hash={[marginSwapHash][index]}
            statusTextMap={step.textMap}
            status={operationStatusToStepStatus({
              currentStatus: status,
              orderedSteps: closePositionSteps.flatMap((s) => [s.pending, s.loading, s.error]),
              stepIndex: index,
              pendingStep: step.pending,
              loadingStep: step.loading,
              errorStep: step.error,
              successStep: MarginSwapStatus.SUCCESS,
            })}
            isFirstStep={index === 0}
          />
        ))}
      </OperationRows>
    );
  }

  return (
    <Button colorScheme={ButtonColor.PURPLE} onClick={() => handleMarginSwap()} fullWidth>
      Confirm margin swap
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
          {token?.isNative ? (
            <Badge color="purple" text={"Native"} />
          ) : (
            <Badge color="purple" variant={BadgeVariant.STANDARD} standard={standard} />
          )}
        </div>
      </div>
      <p className="text-secondary-text text-14">${amountUSD}</p>
    </div>
  );
}

export default function ConfirmMarginSwapDialog({ trade }: { trade: Trade<any, any, any> | null }) {
  const t = useTranslations("Swap");
  const {
    tokenA,
    tokenB,
    tokenAStandard,
    tokenBStandard,
    reset: resetTokens,
  } = useMarginSwapTokensStore();
  const { typedValue, reset: resetAmounts } = useMarginSwapAmountsStore();
  const chainId = useCurrentChainId();

  const { isOpen, setIsOpen } = useConfirmMarginSwapDialogStore();

  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    return trade?.outputAmount;
  }, [trade?.outputAmount]);

  const output = useMemo(() => {
    if (!trade) {
      return "";
    }

    return trade.outputAmount.toSignificant();
  }, [trade]);

  const { slippage, deadline: _deadline } = useMarginSwapSettingsStore();
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

  const { status, setStatus } = useMarginSwapStatusStore();

  const isInitialStatus = useMemo(() => status === MarginSwapStatus.INITIAL, [status]);
  const isFinalStatus = useMemo(
    () => status === MarginSwapStatus.SUCCESS || status === MarginSwapStatus.ERROR_SWAP,
    [status],
  );
  const isLoadingStatus = useMemo(
    () => !isInitialStatus && !isFinalStatus,
    [isFinalStatus, isInitialStatus],
  );

  const { estimatedGas, customGasLimit } = useSwapGasLimitStore();

  const { gasPriceSettings } = useSwapGasPriceStore();
  const { baseFee } = useGlobalFees();

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

    return "0";
  }, [baseFee, gasPriceSettings]);
  const isConversion = useMemo(() => tokenB && tokenA?.equals(tokenB), [tokenA, tokenB]);

  useEffect(() => {
    if (isSuccessSwap && !isOpen && !isConversion) {
      resetAmounts();
    }
  }, [isSuccessSwap, resetAmounts, isOpen, isConversion]);

  useEffect(() => {
    if (isFinalStatus && !isOpen) {
      setTimeout(() => {
        setStatus(MarginSwapStatus.INITIAL);
      }, 400);
    }
  }, [isFinalStatus, isOpen, setStatus, status]);

  const { price: priceA } = useUSDPrice(tokenA?.wrapped.address0);
  const { price: priceB } = useUSDPrice(tokenB?.wrapped.address0);

  const { price: priceNative } = useUSDPrice(wrappedTokens[chainId]?.address0);

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
          title={"Review margin swap"}
        />
        <div className="card-spacing">
          {isFinalStatus && (
            <div className="pb-1">
              <div className="mx-auto w-[80px] h-[80px] flex items-center justify-center relative mb-5">
                {status === MarginSwapStatus.ERROR_SWAP && <EmptyStateIcon iconName="warning" />}

                {status === MarginSwapStatus.SUCCESS && (
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

              {status === MarginSwapStatus.SUCCESS && (
                <div>
                  <h2 className="text-center mb-1 font-bold text-20 ">Successful margin swap</h2>
                </div>
              )}
              {status === MarginSwapStatus.ERROR_SWAP && (
                <div>
                  <h2 className="text-center mb-1 font-bold text-20 text-red-light">
                    Margin swap failed
                  </h2>
                  <div className="flex justify-center gap-2 items-center">
                    <Image
                      src={tokenA?.logoURI || "/images/tokens/placeholder.svg"}
                      alt=""
                      width={24}
                      height={24}
                    />
                    <span>
                      {typedValue} {tokenA?.symbol}
                    </span>
                    <Svg className="text-tertiary-text" iconName="next" />
                    <Image
                      src={tokenB?.logoURI || "/images/tokens/placeholder.svg"}
                      alt=""
                      width={24}
                      height={24}
                    />
                    <span>
                      {output} {tokenB?.symbol}
                    </span>
                  </div>
                </div>
              )}
              <div className="my-4 border-b border-secondary-border w-full" />
            </div>
          )}
          {!isFinalStatus && (
            <div className="flex flex-col gap-3">
              <ReadonlyTokenAmountCard
                token={tokenA}
                amount={typedValue}
                amountUSD={priceA ? formatFloat(priceA * +typedValue) : ""}
                standard={tokenAStandard}
                title={t("you_pay")}
              />
              <ReadonlyTokenAmountCard
                token={tokenB}
                amount={output}
                amountUSD={priceB ? formatFloat(priceB * +output) : ""}
                standard={tokenBStandard}
                title={t("you_receive")}
              />
            </div>
          )}

          {isInitialStatus && (
            <div className="pb-4 flex flex-col gap-2 rounded-b-3 text-14 mt-4">
              <SwapDetailsRow
                title={t("network_fee")}
                value={
                  <div>
                    <span className="text-secondary-text mr-1 text-14">
                      {computedGasSpending} GWEI
                    </span>{" "}
                    <span className="mr-1 text-14">
                      {priceNative && `~$${formatFloat(priceNative * +computedGasSpending)}`}
                    </span>
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
                    ?.minimumAmountOut(slippageToPercent(slippage), dependentAmount)
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
            </div>
          )}
          {isLoadingStatus && <div className="h-px w-full bg-secondary-border mb-4 mt-5" />}
          <MarginSwapActionButton />
        </div>
      </div>
    </DrawerDialog>
  );
}
