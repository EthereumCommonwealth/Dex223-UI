import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import { formatEther, formatGwei, parseUnits } from "viem";

import {
  getApproveTextMap,
  getTransferTextMap,
} from "@/app/[locale]/margin-trading/lending-order/[id]/helpers/getStepTexts";
import useOrderDeposit from "@/app/[locale]/margin-trading/lending-order/[id]/hooks/useOrderDeposit";
import {
  OrderDepositStatus,
  useDepositOrderStatusStore,
} from "@/app/[locale]/margin-trading/lending-order/[id]/stores/useDepositOrderStatusStore";
import { LendingOrder } from "@/app/[locale]/margin-trading/types";
import { ReadonlyTokenAmountCard } from "@/app/[locale]/swap/components/ConfirmConvertDialog";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import Input from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import TextField from "@/components/atoms/TextField";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import OperationStepRow, {
  OperationRows,
  operationStatusToStepStatus,
  OperationStepStatus,
} from "@/components/common/OperationStepRow";
import { IconName } from "@/config/types/IconName";
import { formatFloat } from "@/functions/formatFloat";
import useTokenBalances from "@/hooks/useTokenBalances";
import { Standard } from "@/sdk_bi/standard";

type StepTextMap = {
  [key in OperationStepStatus]: string;
};

type OperationStepConfig = {
  iconName: IconName;
  textMap: StepTextMap;
  pending: OrderDepositStatus;
  loading: OrderDepositStatus;
  error: OrderDepositStatus;
};

function composeDepositOrderSteps(
  symbol: string = "Unknown",
  isNative: boolean,
  standard = Standard.ERC20,
): OperationStepConfig[] {
  if (isNative) {
    return [
      {
        iconName: "deposit",
        pending: OrderDepositStatus.PENDING_DEPOSIT,
        loading: OrderDepositStatus.LOADING_DEPOSIT,
        error: OrderDepositStatus.ERROR_DEPOSIT,
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

  const firstStep =
    standard === Standard.ERC20
      ? ({
          iconName: "done",
          pending: OrderDepositStatus.PENDING_APPROVE,
          loading: OrderDepositStatus.LOADING_APPROVE,
          error: OrderDepositStatus.ERROR_APPROVE,
          textMap: getApproveTextMap(symbol),
        } as const)
      : ({
          iconName: "transfer-to-contract",
          pending: OrderDepositStatus.PENDING_TRANSFER,
          loading: OrderDepositStatus.LOADING_TRANSFER,
          error: OrderDepositStatus.ERROR_TRANSFER,
          textMap: getTransferTextMap(symbol),
        } as const);

  return [
    firstStep,
    {
      iconName: "deposit",
      pending: OrderDepositStatus.PENDING_DEPOSIT,
      loading: OrderDepositStatus.LOADING_DEPOSIT,
      error: OrderDepositStatus.ERROR_DEPOSIT,
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

function OrderDepositActionButton({
  order,
  amountToApprove,
  amountToDeposit,
  disabled,
}: {
  order: LendingOrder;
  amountToApprove: string;
  amountToDeposit: string;
  disabled: boolean;
}) {
  const { handleOrderDeposit } = useOrderDeposit({
    orderId: order.id,
    currency: order.baseAsset,
    amount: amountToDeposit,
    standard: order.baseAssetStandard,
  });

  const { status, approveHash, depositHash, transferHash } = useDepositOrderStatusStore();

  const hashes = useMemo(() => {
    if (order.baseAsset.isNative) {
      return [depositHash];
    }

    if (order.baseAssetStandard === Standard.ERC20) {
      return [approveHash, depositHash];
    }

    if (order.baseAssetStandard === Standard.ERC223) {
      return [transferHash, depositHash];
    }

    return [approveHash, depositHash];
  }, [approveHash, depositHash, order.baseAsset.isNative, order.baseAssetStandard, transferHash]);

  if (status !== OrderDepositStatus.INITIAL) {
    return (
      <OperationRows>
        {composeDepositOrderSteps(
          order.baseAsset.symbol,
          order.baseAsset.isNative,
          order.baseAssetStandard,
        ).map((step, index) => (
          <OperationStepRow
            key={index}
            iconName={step.iconName}
            hash={hashes[index]}
            statusTextMap={step.textMap}
            status={operationStatusToStepStatus({
              currentStatus: status,
              orderedSteps: composeDepositOrderSteps(
                order.baseAsset.symbol,
                order.baseAsset.isNative,
                order.baseAssetStandard,
              ).flatMap((s) => [s.pending, s.loading, s.error]),
              stepIndex: index,
              pendingStep: step.pending,
              loadingStep: step.loading,
              errorStep: step.error,
              successStep: OrderDepositStatus.SUCCESS,
            })}
            isFirstStep={index === 0}
          />
        ))}
      </OperationRows>
    );
  }

  return (
    <Button disabled={disabled} onClick={() => handleOrderDeposit(amountToApprove)} fullWidth>
      Deposit {order.baseAsset.symbol}
    </Button>
  );
}

export default function OrderDepositDialog({
  isOpen,
  setIsOpen,
  order,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  order: LendingOrder;
}) {
  const [isEditApproveActive, setEditApproveActive] = useState(false);
  const t = useTranslations("Margin");
  const {
    balance: { erc20Balance: tokenA0Balance, erc223Balance: tokenA1Balance },
    refetch: refetchABalance,
  } = useTokenBalances(order.baseAsset);

  const { status, setStatus } = useDepositOrderStatusStore();
  const [amountToDeposit, setAmountToDeposit] = useState("");

  const [amountToApprove, setAmountToApprove] = useState("");

  const [isAmountToApproveModified, setAmountToApproveModified] = useState(false);

  useEffect(() => {
    if (
      (status === OrderDepositStatus.ERROR_APPROVE ||
        status === OrderDepositStatus.ERROR_DEPOSIT ||
        status === OrderDepositStatus.ERROR_TRANSFER ||
        status === OrderDepositStatus.SUCCESS) &&
      !isOpen
    ) {
      setTimeout(() => {
        setStatus(OrderDepositStatus.INITIAL);
      }, 400);
    }
  }, [isOpen, setStatus, status]);

  const error = useMemo(() => {
    if (
      tokenA0Balance &&
      parseUnits(amountToDeposit, order.baseAsset.decimals) > tokenA0Balance.value
    ) {
      return `Available balance: ${
        tokenA0Balance && Boolean(tokenA0Balance.value) ? formatFloat(tokenA0Balance.formatted) : 0
      } ${order.baseAsset.symbol}`;
    }

    return undefined;
  }, [amountToDeposit, order.baseAsset.decimals, order.baseAsset.symbol, tokenA0Balance]);

  const currentBalance = useMemo(() => {
    if (
      tokenA0Balance &&
      Boolean(tokenA0Balance.value) &&
      order.baseAssetStandard === Standard.ERC20
    ) {
      return formatFloat(tokenA0Balance.formatted);
    }
    if (
      tokenA1Balance &&
      Boolean(tokenA1Balance.value) &&
      order.baseAssetStandard === Standard.ERC223
    ) {
      return formatFloat(tokenA1Balance.formatted);
    }

    return "0";
  }, [order.baseAssetStandard, tokenA0Balance, tokenA1Balance]);

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <DialogHeader onClose={() => setIsOpen(false)} title={t("deposit")} />
      <div className="w-[600px] card-spacing-x card-spacing-b">
        {status === OrderDepositStatus.INITIAL ? (
          <>
            <p className="text-secondary-text mb-4">{t("deposit_hint")}</p>
            <TextField
              label={t("deposit_amount")}
              internalText={order.baseAsset.symbol}
              value={amountToDeposit}
              isNumeric
              placeholder={t("deposit_amount")}
              onChange={(e) => {
                const value = e.target.value;
                setAmountToDeposit(value);
                if (
                  parseUnits(value, order.baseAsset.decimals) >
                    parseUnits(amountToApprove, order.baseAsset.decimals) ||
                  !isAmountToApproveModified
                ) {
                  setAmountToApprove(value);
                  setAmountToApproveModified(false);
                }
              }}
              helperText={t("available_balance_value", {
                amount: currentBalance,
                symbol: order.baseAsset.symbol,
              })}
              error={error}
            />

            {order.baseAsset.isToken && order.baseAssetStandard === Standard.ERC20 ? (
              <div
                className={clsx(
                  "bg-tertiary-bg rounded-3 flex justify-between items-center px-5 py-2 min-h-12 mt-4 gap-5",
                  parseUnits(amountToApprove, order.baseAsset.decimals) <
                    parseUnits(amountToDeposit, order.baseAsset.decimals) && "pb-[26px]",
                )}
              >
                <div className="flex items-center gap-1 text-secondary-text whitespace-nowrap">
                  <Tooltip
                    iconSize={20}
                    text={
                      "In order to make a swap with ERC-20 token you need to give the DEX contract permission to withdraw your tokens. All DEX'es require this operation. Here you are specifying the amount of tokens that you allow the contract to transfer on your behalf. Note that this amount never expires."
                    }
                  />
                  <span className="text-14">{t("approve_amount")}</span>
                </div>
                <div className="flex items-center gap-2 flex-grow justify-end">
                  {!isEditApproveActive ? (
                    <span className="text-14">
                      {amountToApprove ? `${amountToApprove} ${order.baseAsset.symbol}` : "—"}
                    </span>
                  ) : (
                    <div className="flex-grow">
                      <div className="relative w-full flex-grow">
                        <Input
                          isError={
                            parseUnits(amountToApprove, order.baseAsset.decimals) <
                            parseUnits(amountToDeposit, order.baseAsset.decimals)
                          }
                          className="h-8 pl-3"
                          value={amountToApprove}
                          onChange={(e) => setAmountToApprove(e.target.value)}
                          type="text"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-tertiary-text">
                          {order.baseAsset.symbol}
                        </span>
                      </div>
                      {parseUnits(amountToApprove, order.baseAsset.decimals) <
                        parseUnits(amountToDeposit, order.baseAsset.decimals) && (
                        <span className="text-red-light absolute text-12 translate-y-0.5">
                          Must be higher or equal {amountToDeposit}
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
                        parseUnits(amountToApprove, order.baseAsset.decimals) <
                        parseUnits(amountToDeposit, order.baseAsset.decimals)
                      }
                      size={ButtonSize.EXTRA_SMALL}
                      colorScheme={ButtonColor.LIGHT_GREEN}
                      onClick={() => {
                        setEditApproveActive(false);
                        setAmountToApproveModified(true);
                      }}
                    >
                      Save
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
            <div className="mt-5 bg-tertiary-bg px-5 py-2 mb-5 flex justify-between items-center rounded-3 flex-col xs:flex-row">
              <div className="text-12 xs:text-14 flex items-center gap-8 justify-between xs:justify-start max-xs:w-full">
                <p className="flex flex-col text-tertiary-text">
                  <span>{t("gas_price")}</span>
                  <span> {formatFloat(formatGwei(BigInt(0)))} GWEI</span>
                </p>

                <p className="flex flex-col text-tertiary-text">
                  <span>{t("gas_limit")}</span>
                  <span>{329000}</span>
                </p>
                <p className="flex flex-col">
                  <span className="text-tertiary-text">{t("network_fee")}</span>
                  <span>{formatFloat(formatEther(BigInt(0) * BigInt(0), "wei"))} ETH</span>
                </p>
              </div>
              <div className="grid grid-cols-[auto_1fr] xs:flex xs:items-center gap-2 w-full xs:w-auto mt-2 xs:mt-0">
                <span className="flex items-center justify-center px-2 text-14 rounded-20 font-500 text-secondary-text border border-secondary-border max-xs:h-8">
                  Cheaper
                </span>
                <Button
                  colorScheme={ButtonColor.LIGHT_GREEN}
                  size={ButtonSize.EXTRA_SMALL}
                  onClick={() => null}
                  fullWidth={false}
                  className="rounded-5"
                >
                  Edit
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {status === OrderDepositStatus.SUCCESS ||
            status === OrderDepositStatus.ERROR_DEPOSIT ||
            status === OrderDepositStatus.ERROR_TRANSFER ||
            status === OrderDepositStatus.ERROR_APPROVE ? (
              <div className="pb-1">
                <div className="mx-auto w-[80px] h-[80px] flex items-center justify-center relative mb-5">
                  {(status === OrderDepositStatus.ERROR_DEPOSIT ||
                    status === OrderDepositStatus.ERROR_APPROVE ||
                    status === OrderDepositStatus.ERROR_TRANSFER) && (
                    <EmptyStateIcon iconName="warning" />
                  )}

                  {status === OrderDepositStatus.SUCCESS && (
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

                {status === OrderDepositStatus.SUCCESS && (
                  <div>
                    <h2 className="text-center mb-1 font-bold text-20 ">{t("deposit_success")}</h2>
                    <p className="text-center mb-1">
                      {amountToDeposit} {order.baseAsset.symbol}
                    </p>
                  </div>
                )}

                {(status === OrderDepositStatus.ERROR_DEPOSIT ||
                  status === OrderDepositStatus.ERROR_APPROVE ||
                  status === OrderDepositStatus.ERROR_TRANSFER) && (
                  <div>
                    <h2 className="text-center mb-1 font-bold text-20 text-red-light">
                      {status === OrderDepositStatus.ERROR_DEPOSIT
                        ? t("deposit_failed")
                        : t("approve_failed")}
                    </h2>
                    <p className="text-center mb-1">
                      {amountToDeposit} {order.baseAsset.symbol}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <ReadonlyTokenAmountCard
                token={order.baseAsset}
                amount={amountToDeposit}
                amountUSD={"0"}
                standard={order.baseAssetStandard}
                title={t("deposit_amount")}
              />
            )}

            <div className="h-px bg-secondary-border my-4" />
          </>
        )}

        <OrderDepositActionButton
          disabled={isEditApproveActive || !amountToDeposit || !!error}
          order={order}
          amountToApprove={amountToApprove}
          amountToDeposit={amountToDeposit}
        />
      </div>
    </DrawerDialog>
  );
}
