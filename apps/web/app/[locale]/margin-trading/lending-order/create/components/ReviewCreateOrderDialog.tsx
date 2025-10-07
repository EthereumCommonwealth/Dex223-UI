import ExternalTextLink from "@repo/ui/external-text-link";
import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import { parseUnits } from "viem";

import timestampToDateString from "@/app/[locale]/margin-trading/helpers/timestampToDateString";
import {
  calculatePeriodInterestRate,
  calculatePeriodInterestRateNum,
} from "@/app/[locale]/margin-trading/lending-order/[id]/helpers/calculatePeriodInterestRate";
import {
  getApproveTextMap,
  getTransferTextMap,
} from "@/app/[locale]/margin-trading/lending-order/[id]/helpers/getStepTexts";
import { AssetsPreview } from "@/app/[locale]/margin-trading/lending-order/create/components/AssetsPreview";
import LendingOrderDetailsRow from "@/app/[locale]/margin-trading/lending-order/create/components/LendingOrderDetailsRow";
import useCreateOrder, {
  useCreateOrderParams,
} from "@/app/[locale]/margin-trading/lending-order/create/hooks/useCreateOrder";
import { TradingTokensInputMode } from "@/app/[locale]/margin-trading/lending-order/create/steps/types";
import {
  CreateOrderStatus,
  useCreateOrderStatusStore,
} from "@/app/[locale]/margin-trading/lending-order/create/stores/useCreateOrderStatusStore";
import { useNewlyCreatedOrderId } from "@/app/[locale]/margin-trading/lending-order/create/stores/useNewlyCreatedOrderId";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import Input from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import OperationStepRow, {
  OperationRows,
  operationStatusToStepStatus,
  OperationStepStatus,
} from "@/components/common/OperationStepRow";
import { IconName } from "@/config/types/IconName";
import { formatFloat } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { ORACLE_ADDRESS, ZERO_ADDRESS } from "@/sdk_bi/addresses";
import { Standard } from "@/sdk_bi/standard";

type StepTextMap = {
  [key in OperationStepStatus]: string;
};

type OperationStepConfig = {
  iconName: IconName;
  textMap: StepTextMap;
  pending: CreateOrderStatus;
  loading: CreateOrderStatus;
  error: CreateOrderStatus;
};

function createOrderSteps(
  approveSymbol: string,
  isNative: boolean,
  baseAssetStandard: Standard,
): OperationStepConfig[] {
  if (!isNative) {
    const secondStep =
      baseAssetStandard === Standard.ERC20
        ? ({
            iconName: "done",
            pending: CreateOrderStatus.PENDING_APPROVE,
            loading: CreateOrderStatus.LOADING_APPROVE,
            error: CreateOrderStatus.ERROR_APPROVE,
            textMap: getApproveTextMap(approveSymbol),
          } as const)
        : ({
            iconName: "transfer-to-contract",
            pending: CreateOrderStatus.PENDING_TRANSFER,
            loading: CreateOrderStatus.LOADING_TRANSFER,
            error: CreateOrderStatus.ERROR_TRANSFER,
            textMap: getTransferTextMap(approveSymbol),
          } as const);

    return [
      {
        iconName: "lending",
        pending: CreateOrderStatus.PENDING_CONFIRM_ORDER,
        loading: CreateOrderStatus.LOADING_CONFIRM_ORDER,
        error: CreateOrderStatus.ERROR_CONFIRM_ORDER,
        textMap: {
          [OperationStepStatus.IDLE]: "Confirm lending order",
          [OperationStepStatus.AWAITING_SIGNATURE]: "Confirm lending order",
          [OperationStepStatus.LOADING]: "Executing lending order",
          [OperationStepStatus.STEP_COMPLETED]: "Lending order confirmed",
          [OperationStepStatus.STEP_FAILED]: "Failed to confirm a lending order",
          [OperationStepStatus.OPERATION_COMPLETED]: "Lending order confirmed",
        },
      },
      secondStep,
      {
        iconName: "deposit",
        pending: CreateOrderStatus.PENDING_DEPOSIT,
        loading: CreateOrderStatus.LOADING_DEPOSIT,
        error: CreateOrderStatus.ERROR_DEPOSIT,
        textMap: {
          [OperationStepStatus.IDLE]: "Deposit funds",
          [OperationStepStatus.AWAITING_SIGNATURE]: "Deposit funds",
          [OperationStepStatus.LOADING]: "Executing deposit",
          [OperationStepStatus.STEP_COMPLETED]: "Deposited funds",
          [OperationStepStatus.STEP_FAILED]: "Failed to deposit funds",
          [OperationStepStatus.OPERATION_COMPLETED]: "Deposited funds",
        },
      },
    ];
  }

  return [
    {
      iconName: "lending",
      pending: CreateOrderStatus.PENDING_CONFIRM_ORDER,
      loading: CreateOrderStatus.LOADING_CONFIRM_ORDER,
      error: CreateOrderStatus.ERROR_CONFIRM_ORDER,
      textMap: {
        [OperationStepStatus.IDLE]: "Confirm lending order",
        [OperationStepStatus.AWAITING_SIGNATURE]: "Confirm lending order",
        [OperationStepStatus.LOADING]: "Executing lending order",
        [OperationStepStatus.STEP_COMPLETED]: "Lending order confirmed",
        [OperationStepStatus.STEP_FAILED]: "Failed to confirm a lending order",
        [OperationStepStatus.OPERATION_COMPLETED]: "Lending order confirmed",
      },
    },
    {
      iconName: "deposit",
      pending: CreateOrderStatus.PENDING_DEPOSIT,
      loading: CreateOrderStatus.LOADING_DEPOSIT,
      error: CreateOrderStatus.ERROR_DEPOSIT,
      textMap: {
        [OperationStepStatus.IDLE]: "Deposit funds",
        [OperationStepStatus.AWAITING_SIGNATURE]: "Deposit funds",
        [OperationStepStatus.LOADING]: "Executing deposit",
        [OperationStepStatus.STEP_COMPLETED]: "Deposited funds",
        [OperationStepStatus.STEP_FAILED]: "Failed to deposit funds",
        [OperationStepStatus.OPERATION_COMPLETED]: "Deposited funds",
      },
    },
  ];
}

function CreateOrderActionButton({ amountToApprove }: { amountToApprove: string }) {
  const { handleCreateOrder } = useCreateOrder();

  const { status, approveHash, depositHash, createOrderHash, transferHash } =
    useCreateOrderStatusStore();
  const { loanToken, loanTokenStandard } = useCreateOrderParams();

  const hashes = useMemo(() => {
    if (loanToken?.isNative) {
      return [createOrderHash, depositHash];
    }

    if (loanTokenStandard === Standard.ERC20) {
      return [createOrderHash, approveHash, depositHash];
    }

    if (loanTokenStandard === Standard.ERC223) {
      return [createOrderHash, transferHash, depositHash];
    }

    return [createOrderHash, approveHash, depositHash];
  }, [
    approveHash,
    createOrderHash,
    depositHash,
    loanToken?.isNative,
    loanTokenStandard,
    transferHash,
  ]);

  if (status !== CreateOrderStatus.INITIAL) {
    return (
      <OperationRows>
        {createOrderSteps(loanToken?.symbol || "", !!loanToken?.isNative, loanTokenStandard).map(
          (step, index) => (
            <OperationStepRow
              key={index}
              iconName={step.iconName}
              hash={hashes[index]}
              statusTextMap={step.textMap}
              status={operationStatusToStepStatus({
                currentStatus: status,
                orderedSteps: createOrderSteps(
                  loanToken?.symbol || "",
                  !!loanToken?.isNative,
                  loanTokenStandard,
                ).flatMap((s) => [s.pending, s.loading, s.error]),
                stepIndex: index,
                pendingStep: step.pending,
                loadingStep: step.loading,
                errorStep: step.error,
                successStep: CreateOrderStatus.SUCCESS,
              })}
              isFirstStep={index === 0}
            />
          ),
        )}
      </OperationRows>
    );
  }

  return (
    <Button onClick={() => handleCreateOrder(amountToApprove)} fullWidth>
      Create lending order
    </Button>
  );
}

export default function ReviewCreateOrderDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const [isEditApproveActive, setEditApproveActive] = React.useState(false);
  const locale = useLocale();

  const { status, setStatus } = useCreateOrderStatusStore();

  const { orderId, setOrderId } = useNewlyCreatedOrderId();

  useEffect(() => {
    if (
      (status === CreateOrderStatus.ERROR_APPROVE ||
        status === CreateOrderStatus.ERROR_DEPOSIT ||
        status === CreateOrderStatus.ERROR_CONFIRM_ORDER ||
        status === CreateOrderStatus.SUCCESS) &&
      !isOpen
    ) {
      setTimeout(() => {
        setStatus(CreateOrderStatus.INITIAL);
        setOrderId(undefined);
      }, 400);
    }
  }, [isOpen, setOrderId, setStatus, status]);

  const {
    tradingTokens,
    loanToken,
    loanTokenStandard,
    collateralTokens,
    loanAmount,
    liquidationFeeToken,
    liquidationFeeForLiquidator,
    liquidationFeeForLender,
    liquidationMode,
    minimumBorrowingAmount,
    orderCurrencyLimit,
    period,
    interestRatePerMonth,
    leverage,
    priceSource,
  } = useCreateOrderParams();

  const chainId = useCurrentChainId();

  const [amountToApprove, setAmountToApprove] = useState(loanAmount);

  useEffect(() => {
    if (loanAmount) {
      setAmountToApprove(loanAmount);
    }
  }, [loanAmount]);

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <DialogHeader onClose={() => setIsOpen(false)} title={"Create lending order"} />

      <div className="card-spacing-x card-spacing-b min-w-[600px]">
        {status !== CreateOrderStatus.ERROR_CONFIRM_ORDER &&
          status !== CreateOrderStatus.ERROR_APPROVE &&
          status !== CreateOrderStatus.SUCCESS && (
            <div className="bg-tertiary-bg rounded-3 py-4 px-5 mb-4">
              <p className="text-secondary-text text-14">Loan amount</p>
              <div className="flex justify-between items-center my-1">
                <span className="font-medium text-20">{loanAmount}</span>
                <span className="flex items-center gap-2">
                  <Image
                    src={"/images/tokens/placeholder.svg"}
                    alt={"USDT"}
                    width={32}
                    height={32}
                  />
                  <span>{loanToken?.symbol}</span>
                  <Badge variant={BadgeVariant.STANDARD} standard={loanTokenStandard} />
                </span>
              </div>
              <p className="text-tertiary-text text-14">$0.00</p>
            </div>
          )}
        {(status === CreateOrderStatus.SUCCESS ||
          status === CreateOrderStatus.ERROR_DEPOSIT ||
          status === CreateOrderStatus.ERROR_CONFIRM_ORDER) && (
          <div className="pb-3 border-b border-secondary-border mb-4">
            <div className="mx-auto w-[80px] h-[80px] flex items-center justify-center relative mb-5">
              {(status === CreateOrderStatus.ERROR_DEPOSIT ||
                status === CreateOrderStatus.ERROR_CONFIRM_ORDER) && (
                <EmptyStateIcon iconName="warning" />
              )}

              {status === CreateOrderStatus.SUCCESS && (
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

            {status === CreateOrderStatus.SUCCESS && (
              <div>
                <h2 className="text-center mb-1 font-bold text-20 ">
                  Lending order successfully created
                </h2>
                <p className="text-center mb-1">
                  {loanAmount} {loanToken?.symbol}
                </p>
                <div className="flex justify-center">
                  {orderId && (
                    <ExternalTextLink
                      text="View my order"
                      href={`/${locale}/margin-trading/lending-order/${orderId}`}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {status === CreateOrderStatus.INITIAL && (
          <>
            <div className="flex flex-col gap-2 mb-5">
              <LendingOrderDetailsRow
                title="Margin positions duration"
                value={`${period.positionDuration} days`}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Lending order deadline"
                value={timestampToDateString(new Date(period.lendingOrderDeadline).getTime())}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Interest rate per month"
                value={`${interestRatePerMonth}%`}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Interest rate for the entire period"
                value={
                  interestRatePerMonth && period.lendingOrderDeadline
                    ? calculatePeriodInterestRate(
                        +interestRatePerMonth * 100,
                        Math.max(
                          0,
                          (new Date(period.lendingOrderDeadline).getTime() - Date.now()) / 1000,
                        ),
                      )
                    : "—"
                }
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="You will receive for the entire period"
                value={
                  interestRatePerMonth &&
                  period.lendingOrderDeadline &&
                  loanAmount &&
                  loanToken?.symbol
                    ? (() => {
                        const _loanAmount = parseFloat(loanAmount);
                        const interestRate = calculatePeriodInterestRateNum(
                          +interestRatePerMonth * 100,
                          Math.max(
                            0,
                            (new Date(period.lendingOrderDeadline).getTime() - Date.now()) / 1000,
                          ),
                        );

                        if (isNaN(_loanAmount) || isNaN(interestRate)) return "—";

                        const interest = (_loanAmount * interestRate) / 100;

                        return formatFloat(interest) + ` ${loanToken.symbol}`;
                      })() // or 2 decimals if needed
                    : "—"
                }
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Leverage"
                value={`${leverage}x`}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Accepted collateral tokens"
                value={<AssetsPreview assets={collateralTokens} />}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Tokens allowed for trading"
                value={
                  tradingTokens.inputMode === TradingTokensInputMode.MANUAL ? (
                    <AssetsPreview assets={tradingTokens.allowedTokens} />
                  ) : (
                    <span className="flex items-center gap-2">
                      <ExternalTextLink
                        text={tradingTokens.tradingTokensAutoListing?.name || "Unknown"}
                        href={getExplorerLink(
                          ExplorerLinkType.ADDRESS,
                          tradingTokens.tradingTokensAutoListing?.id || ZERO_ADDRESS,
                          chainId,
                        )}
                      />
                    </span>
                  )
                }
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Minimum borrowing amount"
                value={`${minimumBorrowingAmount} ${loanToken?.symbol}`}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Order currency limit"
                value={orderCurrencyLimit}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="May initiate liquidation"
                value={"Anyone"}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Pays the liquidation deposit"
                value={"Borrower"}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Liquidation fee (for liquidator)"
                value={`${liquidationFeeForLiquidator} ${liquidationFeeToken?.symbol}`}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Liquidation fee (for lender)"
                value={`${liquidationFeeForLender} ${liquidationFeeToken?.symbol}`}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Liquidation price source"
                value={
                  <ExternalTextLink
                    text="DEX223 Market"
                    href={getExplorerLink(
                      ExplorerLinkType.ADDRESS,
                      ORACLE_ADDRESS[chainId],
                      chainId,
                    )}
                  />
                }
                tooltipText="Tooltip text"
              />
            </div>
            <div
              className={clsx(
                "bg-tertiary-bg rounded-3 flex justify-between items-center px-5 py-2 min-h-12 mt-5 gap-5 mb-5",
                parseUnits(amountToApprove, loanToken?.decimals ?? 18) <
                  parseUnits(loanAmount, loanToken?.decimals ?? 18) && "pb-[26px]",
              )}
            >
              <div className="flex items-center gap-1 text-secondary-text whitespace-nowrap">
                <Tooltip
                  iconSize={20}
                  text={
                    " In order to make a swap with ERC-20 token you need to give the DEX contract permission to withdraw your tokens. All DEX'es require this operation. Here you are specifying the amount of tokens that you allow the contract to transfer on your behalf. Note that this amount never expires."
                  }
                />
                <span className="text-14">Approve amount</span>
              </div>
              <div className="flex items-center gap-2 flex-grow justify-end">
                {!isEditApproveActive ? (
                  <span className="text-14">
                    {loanAmount} {loanToken?.symbol}
                  </span>
                ) : (
                  <div className="flex-grow">
                    <div className="relative w-full flex-grow">
                      <Input
                        isError={
                          parseUnits(amountToApprove, loanToken?.decimals ?? 18) <
                          parseUnits(loanAmount, loanToken?.decimals ?? 18)
                        }
                        className="h-8 pl-3"
                        value={amountToApprove}
                        onChange={(e) => setAmountToApprove(e.target.value)}
                        type="text"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-tertiary-text">
                        {"USDT"}
                      </span>
                    </div>
                    {parseUnits(amountToApprove, loanToken?.decimals ?? 18) <
                      parseUnits(loanAmount, loanToken?.decimals ?? 18) && (
                      <span className="text-red-light absolute text-12 translate-y-0.5">
                        Must be higher or equal {loanAmount}
                      </span>
                    )}
                  </div>
                )}
                {!isEditApproveActive ? (
                  <Button
                    size={ButtonSize.EXTRA_SMALL}
                    colorScheme={ButtonColor.LIGHT_GREEN}
                    onClick={() => setEditApproveActive(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <Button
                    disabled={
                      parseUnits(amountToApprove, loanToken?.decimals ?? 18) <
                      parseUnits(loanAmount, loanToken?.decimals ?? 18)
                    }
                    size={ButtonSize.EXTRA_SMALL}
                    colorScheme={ButtonColor.LIGHT_GREEN}
                    onClick={() => setEditApproveActive(false)}
                  >
                    Save
                  </Button>
                )}
              </div>
            </div>{" "}
          </>
        )}

        <CreateOrderActionButton amountToApprove={amountToApprove} />
      </div>
    </DrawerDialog>
  );
}
