import React, { useEffect, useMemo, useState } from "react";
import { formatEther, formatGwei, formatUnits, parseUnits } from "viem";

import usePositionWithdraw from "@/app/[locale]/margin-trading/position/[id]/hooks/usePositionWithdraw";
import {
  PositionWithdrawStatus,
  useWithdrawPositionStatusStore,
} from "@/app/[locale]/margin-trading/position/[id]/stores/usePositionWithdrawStatusStore";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import { ReadonlyTokenAmountCard } from "@/app/[locale]/swap/components/ConfirmConvertDialog";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import Svg from "@/components/atoms/Svg";
import { InputLabel } from "@/components/atoms/TextField";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import OperationStepRow, {
  OperationRows,
  operationStatusToStepStatus,
  OperationStepStatus,
} from "@/components/common/OperationStepRow";
import TokenInput from "@/components/common/TokenInput";
import { IconName } from "@/config/types/IconName";
import { formatFloat } from "@/functions/formatFloat";
import { Standard } from "@/sdk_bi/standard";

type StepTextMap = {
  [key in OperationStepStatus]: string;
};

type OperationStepConfig = {
  iconName: IconName;
  textMap: StepTextMap;
  pending: PositionWithdrawStatus;
  loading: PositionWithdrawStatus;
  error: PositionWithdrawStatus;
};

const withdrawPositionSteps: OperationStepConfig[] = [
  {
    iconName: "withdraw",
    pending: PositionWithdrawStatus.PENDING_WITHDRAW,
    loading: PositionWithdrawStatus.LOADING_WITHDRAW,
    error: PositionWithdrawStatus.ERROR_WITHDRAW,
    textMap: {
      [OperationStepStatus.IDLE]: "Withdraw funds",
      [OperationStepStatus.AWAITING_SIGNATURE]: "Withdraw funds",
      [OperationStepStatus.LOADING]: "Executing withdraw",
      [OperationStepStatus.STEP_COMPLETED]: "Withdrawn funds",
      [OperationStepStatus.STEP_FAILED]: "Failed to withdraw funds",
      [OperationStepStatus.OPERATION_COMPLETED]: "Withdrawn funds",
    },
  },
];

function PositionDepositActionButton({
  position,
  amountToWithdraw,
}: {
  position: MarginPosition;
  amountToWithdraw: string;
}) {
  const { handlePositionWithdraw } = usePositionWithdraw({
    position: position,
    currency: position.loanAsset,
    amount: amountToWithdraw,
  });

  const { status, withdrawHash } = useWithdrawPositionStatusStore();

  if (status !== PositionWithdrawStatus.INITIAL) {
    return (
      <OperationRows>
        {withdrawPositionSteps.map((step, index) => (
          <OperationStepRow
            key={index}
            iconName={step.iconName}
            hash={[withdrawHash][index]}
            statusTextMap={step.textMap}
            status={operationStatusToStepStatus({
              currentStatus: status,
              orderedSteps: withdrawPositionSteps.flatMap((s) => [s.pending, s.loading, s.error]),
              stepIndex: index,
              pendingStep: step.pending,
              loadingStep: step.loading,
              errorStep: step.error,
              successStep: PositionWithdrawStatus.SUCCESS,
            })}
            isFirstStep={index === 0}
          />
        ))}
      </OperationRows>
    );
  }

  return (
    <Button onClick={() => handlePositionWithdraw()} fullWidth>
      Deposit {position.loanAsset.symbol}
    </Button>
  );
}

export default function PositionWithdrawDialog({
  isOpen,
  setIsOpen,
  position,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  position: MarginPosition;
}) {
  const { status, setStatus } = useWithdrawPositionStatusStore();
  const [amountToWithdraw, setAmountToWithdraw] = useState("");

  const isInitialStatus = useMemo(() => status === PositionWithdrawStatus.INITIAL, [status]);
  const isFinalStatus = useMemo(
    () =>
      status === PositionWithdrawStatus.SUCCESS || status === PositionWithdrawStatus.ERROR_WITHDRAW,
    [status],
  );
  const isLoadingStatus = useMemo(
    () => !isInitialStatus && !isFinalStatus,
    [isFinalStatus, isInitialStatus],
  );

  useEffect(() => {
    if (isFinalStatus && !isOpen) {
      setTimeout(() => {
        setStatus(PositionWithdrawStatus.INITIAL);
      }, 400);
    }
  }, [isOpen, setStatus, status]);

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <DialogHeader onClose={() => setIsOpen(false)} title="Deposit" />
      <div className="w-[600px] card-spacing-x card-spacing-b">
        {isInitialStatus && (
          <>
            <p className="text-secondary-text mb-4">
              You will increase the available balance of your lending order by making a deposit
            </p>
            <InputLabel label="Deposit amount" tooltipText="Tooltip text" />
            <TokenInput
              handleClick={() => null}
              token={position.loanAsset}
              value={amountToWithdraw}
              onInputChange={(value) => {
                setAmountToWithdraw(value);
              }}
              balance0={"0"}
              balance1={"0"}
              standard={Standard.ERC20}
              setStandard={() => null}
            />

            <div className="mt-5 bg-tertiary-bg px-5 py-2 mb-5 flex justify-between items-center rounded-3 flex-col xs:flex-row">
              <div className="text-12 xs:text-14 flex items-center gap-8 justify-between xs:justify-start max-xs:w-full">
                <p className="flex flex-col text-tertiary-text">
                  <span>Gas price:</span>
                  <span> {formatFloat(formatGwei(BigInt(0)))} GWEI</span>
                </p>

                <p className="flex flex-col text-tertiary-text">
                  <span>Gas limit:</span>
                  <span>{329000}</span>
                </p>
                <p className="flex flex-col">
                  <span className="text-tertiary-text">Network fee:</span>
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
        )}

        {isLoadingStatus && (
          <>
            <ReadonlyTokenAmountCard
              token={position.loanAsset}
              amount={"Unknown"}
              amountUSD={"0"}
              standard={Standard.ERC20}
              title={"Withdraw amount"}
            />
            <div className="h-px bg-secondary-border my-4" />
          </>
        )}

        {isFinalStatus && (
          <div className="pb-1">
            <div className="mx-auto w-[80px] h-[80px] flex items-center justify-center relative mb-5">
              {status === PositionWithdrawStatus.ERROR_WITHDRAW && (
                <EmptyStateIcon iconName="warning" />
              )}

              {status === PositionWithdrawStatus.SUCCESS && (
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

            {status === PositionWithdrawStatus.SUCCESS && (
              <div>
                <h2 className="text-center mb-1 font-bold text-20 ">Successfully withdrawed</h2>
                <p className="text-center mb-1">
                  {amountToWithdraw} {position.loanAsset.symbol}
                </p>
              </div>
            )}
            <div className="my-4 border-b border-secondary-border w-full" />
          </div>
        )}

        <PositionDepositActionButton position={position} amountToWithdraw={amountToWithdraw} />
      </div>
    </DrawerDialog>
  );
}
