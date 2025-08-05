import ExternalTextLink from "@repo/ui/external-text-link";
import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";

import {
  InfoBlockWithBorder,
  SimpleInfoBlock,
} from "@/app/[locale]/margin-trading/components/widgets/OrderInfoBlock";
import { useEditOrderStatusStore } from "@/app/[locale]/margin-trading/lending-order/[id]/edit/stores/useEditOrderStatusStore";
import LendingOrderDetailsRow from "@/app/[locale]/margin-trading/lending-order/create/components/LendingOrderDetailsRow";
import useCreateOrder, {
  useCreateOrderParams,
} from "@/app/[locale]/margin-trading/lending-order/create/hooks/useCreateOrder";
import { TradingTokensInputMode } from "@/app/[locale]/margin-trading/lending-order/create/steps/types";
import {
  CreateOrderStatus,
  useCreateOrderStatusStore,
} from "@/app/[locale]/margin-trading/lending-order/create/stores/useCreateOrderStatusStore";
import usePositionStatus from "@/app/[locale]/margin-trading/position/[id]/hooks/usePositionStatus";
import useLiquidatePosition from "@/app/[locale]/margin-trading/position/[id]/liquidate/hooks/useLiquidatePosition";
import {
  PositionLiquidateStatus,
  usePositionLiquidateStatusStore,
} from "@/app/[locale]/margin-trading/position/[id]/liquidate/stores/usePositionLiquidateStatusStore";
import { PositionDepositStatus } from "@/app/[locale]/margin-trading/position/[id]/stores/usePositionDepositStatusStore";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
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

type StepTextMap = {
  [key in OperationStepStatus]: string;
};

type OperationStepConfig = {
  iconName: IconName;
  textMap: StepTextMap;
  pending: PositionLiquidateStatus;
  loading: PositionLiquidateStatus;
  error: PositionLiquidateStatus;
};

function createOrderSteps(): OperationStepConfig[] {
  return [
    {
      iconName: "freeze",
      pending: PositionLiquidateStatus.PENDING_FREEZE,
      loading: PositionLiquidateStatus.LOADING_FREEZE,
      error: PositionLiquidateStatus.ERROR_FREEZE,
      textMap: {
        [OperationStepStatus.IDLE]: "Freeze",
        [OperationStepStatus.AWAITING_SIGNATURE]: "Freeze",
        [OperationStepStatus.LOADING]: "Freezing",
        [OperationStepStatus.STEP_COMPLETED]: "Frozen",
        [OperationStepStatus.STEP_FAILED]: "Failed to freeze transaction",
        [OperationStepStatus.OPERATION_COMPLETED]: "Frozen",
      },
    },
    {
      iconName: "block",
      pending: PositionLiquidateStatus.PENDING_BLOCK_CONFIRMATION,
      loading: PositionLiquidateStatus.LOADING_BLOCK_CONFIRMATION,
      error: PositionLiquidateStatus.ERROR_BLOCK_CONFIRMATION,
      textMap: {
        [OperationStepStatus.IDLE]: "Block confirmation",
        [OperationStepStatus.AWAITING_SIGNATURE]: "Block confirmation",
        [OperationStepStatus.LOADING]: "Block confirmation",
        [OperationStepStatus.STEP_COMPLETED]: "Block confirmation",
        [OperationStepStatus.STEP_FAILED]: "Block confirmation",
        [OperationStepStatus.OPERATION_COMPLETED]: "Block confirmation",
      },
    },
    {
      iconName: "liquidated",
      pending: PositionLiquidateStatus.PENDING_LIQUIDATE,
      loading: PositionLiquidateStatus.LOADING_LIQUIDATE,
      error: PositionLiquidateStatus.ERROR_LIQUIDATE,
      textMap: {
        [OperationStepStatus.IDLE]: "Liquidation",
        [OperationStepStatus.AWAITING_SIGNATURE]: "Confirm liquidation",
        [OperationStepStatus.LOADING]: "Executing liquidation",
        [OperationStepStatus.STEP_COMPLETED]: "Deposited funds",
        [OperationStepStatus.STEP_FAILED]: "Failed to liquidate position",
        [OperationStepStatus.OPERATION_COMPLETED]: "Successfully liquidated",
      },
    },
  ];
}

function LiquidatePositionActionButton({ position }: { position: MarginPosition }) {
  const { status, positionLiquidateHash, positionFreezeHash } = usePositionLiquidateStatusStore();

  if (status !== PositionLiquidateStatus.INITIAL) {
    return (
      <OperationRows>
        {createOrderSteps().map((step, index) => (
          <OperationStepRow
            key={index}
            iconName={step.iconName}
            hash={[positionFreezeHash, undefined, positionLiquidateHash][index]}
            statusTextMap={step.textMap}
            status={operationStatusToStepStatus({
              currentStatus: status,
              orderedSteps: createOrderSteps().flatMap((s) => [s.pending, s.loading, s.error]),
              stepIndex: index,
              pendingStep: step.pending,
              loadingStep: step.loading,
              errorStep: step.error,
              successStep: PositionLiquidateStatus.SUCCESS,
            })}
            isFirstStep={index === 0}
          />
        ))}
      </OperationRows>
    );
  }

  return undefined;
}

export default function ConfirmLiquidatePositionDialog({
  isOpen,
  setIsOpen,
  position,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  position: MarginPosition;
}) {
  const [isEditApproveActive, setEditApproveActive] = React.useState(false);

  const { status, setStatus } = usePositionLiquidateStatusStore();

  useEffect(() => {
    if (
      (status === PositionLiquidateStatus.ERROR_LIQUIDATE ||
        status === PositionLiquidateStatus.ERROR_FREEZE ||
        status === PositionLiquidateStatus.SUCCESS) &&
      !isOpen
    ) {
      setTimeout(() => {
        setStatus(PositionLiquidateStatus.INITIAL);
      }, 400);
    }
  }, [isOpen, setStatus, status]);

  const isInitialStatus = useMemo(() => status === PositionLiquidateStatus.INITIAL, [status]);
  const isFinalStatus = useMemo(
    () =>
      status === PositionLiquidateStatus.SUCCESS ||
      status === PositionLiquidateStatus.ERROR_FREEZE ||
      status === PositionLiquidateStatus.ERROR_LIQUIDATE,
    [status],
  );
  const isLoadingStatus = useMemo(
    () => !isInitialStatus && !isFinalStatus,
    [isFinalStatus, isInitialStatus],
  );

  const { actualBalance, expectedBalance } = usePositionStatus(position);

  const formattedActualExpected = useMemo(() => {
    if (!actualBalance || !expectedBalance) {
      return "Loading...";
    }

    return (
      <span>
        <span className="text-red-light">
          {formatFloat(formatUnits(actualBalance, position.loanAsset.decimals))}
        </span>{" "}
        / {formatFloat(formatUnits(expectedBalance, position.loanAsset.decimals))}
        <span className="text-tertiary-text"> {position.loanAsset.symbol}</span>
      </span>
    );
  }, [actualBalance, expectedBalance, position.loanAsset.decimals, position.loanAsset.symbol]);

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <DialogHeader onClose={() => setIsOpen(false)} title={"Liquidation"} />

      <div className="card-spacing-x card-spacing-b min-w-[600px]">
        {isFinalStatus && (
          <div className="pb-3 border-b border-secondary-border mb-4">
            <div className="mx-auto w-[80px] h-[80px] flex items-center justify-center relative mb-5">
              {(status === PositionLiquidateStatus.ERROR_FREEZE ||
                status === PositionLiquidateStatus.ERROR_LIQUIDATE) && (
                <EmptyStateIcon iconName="warning" />
              )}

              {status === PositionLiquidateStatus.SUCCESS && (
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

            {status === PositionLiquidateStatus.SUCCESS && (
              <div>
                <h2 className="text-center mb-1 font-bold text-20 ">Successfully liquidated</h2>
                <p className="text-center mb-1">
                  {position.loanAsset.symbol}{" "}
                  <span className="text-secondary-text">(ID: {position.id})</span>
                </p>
              </div>
            )}
          </div>
        )}

        {!isFinalStatus && (
          <div className="flex flex-col gap-2 pb-5 border-b border-secondary-border mb-4">
            <SimpleInfoBlock
              value={formattedActualExpected}
              title="Total balance / Expected balance"
              tooltipText={"Tooltip text"}
            />
            <InfoBlockWithBorder
              title={"Liquidation fee"}
              tooltipText={"Tooltip text"}
              value={`${position.order.liquidationRewardAmount.formatted} ${position.order.liquidationRewardAsset.symbol}`}
            />
          </div>
        )}
        <LiquidatePositionActionButton position={position} />
      </div>
    </DrawerDialog>
  );
}
