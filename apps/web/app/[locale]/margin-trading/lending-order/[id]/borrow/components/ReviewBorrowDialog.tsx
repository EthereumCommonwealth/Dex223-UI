import ExternalTextLink from "@repo/ui/external-text-link";
import Tooltip from "@repo/ui/tooltip";
import Image from "next/image";
import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";
import SimpleBar from "simplebar-react";
import { parseUnits } from "viem";

import timestampToDateString from "@/app/[locale]/margin-trading/helpers/timestampToDateString";
import useCreateMarginPosition, {
  useCreatePositionApproveSteps,
} from "@/app/[locale]/margin-trading/lending-order/[id]/borrow/hooks/useCreateMarginPosition";
import { useCreateMarginPositionConfigStore } from "@/app/[locale]/margin-trading/lending-order/[id]/borrow/stores/useCreateMarginPositionConfigStore";
import {
  CreateMarginPositionStatus,
  useCreateMarginPositionStatusStore,
} from "@/app/[locale]/margin-trading/lending-order/[id]/borrow/stores/useCreateMarginPositionStatusStore";
import { calculatePeriodInterestRate } from "@/app/[locale]/margin-trading/lending-order/[id]/helpers/calculatePeriodInterestRate";
import LendingOrderDetailsRow from "@/app/[locale]/margin-trading/lending-order/create/components/LendingOrderDetailsRow";
import { useConfirmBorrowPositionDialogStore } from "@/app/[locale]/margin-trading/stores/dialogStates";
import { LendingOrder } from "@/app/[locale]/margin-trading/types";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import { InputSize, SearchInput } from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import { InputLabel } from "@/components/atoms/TextField";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button from "@/components/buttons/Button";
import ApproveAmountConfig from "@/components/common/ApproveAmountConfig";
import OperationStepRow, {
  operationStatusToStepStatus,
} from "@/components/common/OperationStepRow";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import { filterTokens } from "@/functions/searchTokens";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { ORACLE_ADDRESS } from "@/sdk_bi/addresses";
import { Standard } from "@/sdk_bi/standard";

function Rows({ children }: PropsWithChildren<{}>) {
  return <div className="flex flex-col gap-5">{children}</div>;
}

function CreateMarginPositionActionButton({
  orderId,
  order,
  amountToApprove,
  feeAmountToApprove,
}: {
  orderId: string;
  order: LendingOrder;
  amountToApprove: string;
  feeAmountToApprove: string;
}) {
  const { handleCreateMarginPosition } = useCreateMarginPosition(order);
  const {
    status,
    setStatus,
    approveBorrowHash,
    approveLiquidationFeeHash,
    borrowHash,
    transferHash,
  } = useCreateMarginPositionStatusStore();
  const { values } = useCreateMarginPositionConfigStore();

  const orderedHashes =
    values.collateralToken &&
    order.liquidationRewardAsset.equals(values.collateralToken) &&
    values.collateralTokenStandard === Standard.ERC20
      ? [approveBorrowHash, borrowHash]
      : [
          values.collateralTokenStandard === Standard.ERC20 ? approveBorrowHash : transferHash,
          approveLiquidationFeeHash,
          borrowHash,
        ];

  const { allSteps: marginSteps } = useCreatePositionApproveSteps(order);

  if (status !== CreateMarginPositionStatus.INITIAL) {
    return (
      <Rows>
        {marginSteps.map((step, index) => (
          <OperationStepRow
            key={index}
            iconName={step.iconName}
            hash={orderedHashes[index]}
            statusTextMap={step.textMap}
            status={operationStatusToStepStatus({
              currentStatus: status,
              orderedSteps: marginSteps.flatMap((s) => [s.pending, s.loading, s.error]),
              stepIndex: index,
              pendingStep: step.pending,
              loadingStep: step.loading,
              errorStep: step.error,
              successStep: CreateMarginPositionStatus.SUCCESS,
            })}
            isFirstStep={index === 0}
          />
        ))}
      </Rows>
    );
  }
  return (
    <Button
      fullWidth
      onClick={() => handleCreateMarginPosition(orderId, amountToApprove, feeAmountToApprove)}
    >
      Confirm borrow
    </Button>
  );
}

export default function ReviewBorrowDialog({
  orderId,
  order,
}: {
  orderId: string;
  order: LendingOrder;
}) {
  const { isOpen, setIsOpen } = useConfirmBorrowPositionDialogStore();
  const { values, setValues } = useCreateMarginPositionConfigStore();
  const { status, setStatus, approveBorrowHash, approveLiquidationFeeHash, borrowHash } =
    useCreateMarginPositionStatusStore();
  const [isEditApproveActive, setEditApproveActive] = React.useState(false);
  const [isEditApproveFeeActive, setEditApproveFeeActive] = React.useState(false);

  const isFeeAndCollateralSame = useMemo(() => {
    return values.collateralToken?.equals(order.liquidationRewardAsset);
  }, [order.liquidationRewardAsset, values.collateralToken]);

  const [amountToApprove, setAmountToApprove] = useState(values.collateralAmount);
  const [feeAmountToApprove, setFeeAmountToApprove] = useState(
    order.liquidationRewardAmount.formatted,
  );

  useEffect(() => {
    if (values.collateralAmount && !isFeeAndCollateralSame) {
      setAmountToApprove(values.collateralAmount);
    }

    if (isFeeAndCollateralSame) {
      setAmountToApprove(
        (+values.collateralAmount + +order.liquidationRewardAmount.formatted).toString(),
      );
    }
  }, [isFeeAndCollateralSame, order.liquidationRewardAmount.formatted, values.collateralAmount]);

  const chainId = useCurrentChainId();

  const isInitialStatus = useMemo(() => status === CreateMarginPositionStatus.INITIAL, [status]);
  const isFinalStatus = useMemo(
    () =>
      status === CreateMarginPositionStatus.SUCCESS ||
      status === CreateMarginPositionStatus.ERROR_BORROW ||
      status === CreateMarginPositionStatus.ERROR_APPROVE_BORROW ||
      status === CreateMarginPositionStatus.ERROR_APPROVE_LIQUIDATION_FEE,
    [status],
  );
  const isLoadingStatus = useMemo(
    () => !isInitialStatus && !isFinalStatus,
    [isFinalStatus, isInitialStatus],
  );

  useEffect(() => {
    if (isFinalStatus && !isOpen) {
      setTimeout(() => {
        setStatus(CreateMarginPositionStatus.INITIAL);
      }, 400);
    }
  }, [isFinalStatus, isOpen, setStatus]);

  const [formattedEndTime, setFormattedEndTime] = useState<string>("");

  const [searchTradableTokenValue, setSearchTradableTokenValue] = useState("");

  const [filteredTokens, isTokenFilterActive] = useMemo(() => {
    return searchTradableTokenValue
      ? [filterTokens(searchTradableTokenValue, order?.allowedTradingAssets || []), true]
      : [order?.allowedTradingAssets || [], false];
  }, [searchTradableTokenValue, order?.allowedTradingAssets]);

  useEffect(() => {
    if (!order) {
      return;
    }
    // initial calculation
    const calc = () => {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const endTimestamp = nowInSeconds + Number(order?.positionDuration);
      const formatted = timestampToDateString(endTimestamp, true);
      setFormattedEndTime(formatted);
    };

    calc(); // call immediately after mount

    const interval = setInterval(() => {
      calc(); // recalculate every minute
    }, 60_000); // 60 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, [order, order?.positionDuration]);

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <DialogHeader onClose={() => setIsOpen(false)} title={"Review borrow"} />

      <div className="card-spacing-x card-spacing-b min-w-[600px]">
        {!isFinalStatus && (
          <>
            <InputLabel inputSize={InputSize.LARGE} label="You send" />
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-tertiary-bg rounded-3 py-4 px-5 mb-4 text-14">
                <p className="text-secondary-text ">Collateral</p>
                <div className="flex items-center gap-1 items-center my-1">
                  <Image
                    className="mr-1"
                    src={"/images/tokens/placeholder.svg"}
                    alt={values.collateralToken?.symbol || "Unknown"}
                    width={20}
                    height={20}
                  />
                  <span className="">{values.collateralAmount}</span>
                  <span className="text-secondary-text">
                    {values.collateralToken?.symbol || "Unknown"}
                  </span>
                  <Badge
                    size="small"
                    variant={BadgeVariant.STANDARD}
                    standard={values.collateralTokenStandard}
                  />
                </div>
              </div>
              <div className="bg-tertiary-bg rounded-3 py-4 px-5 mb-4 text-14">
                <p className="text-secondary-text ">Liquidation fee</p>
                <div className="flex items-center gap-1 items-center my-1">
                  <Image
                    className="mr-1"
                    src={"/images/tokens/placeholder.svg"}
                    alt={order.liquidationRewardAsset.symbol || "Unknown"}
                    width={20}
                    height={20}
                  />
                  <span className="">{order.liquidationRewardAmount.formatted}</span>
                  <span className="text-secondary-text">
                    {order.liquidationRewardAsset.symbol || "Unknown"}
                  </span>
                  <Badge
                    size="small"
                    variant={BadgeVariant.STANDARD}
                    standard={order.liquidationRewardAssetStandard}
                  />
                </div>
              </div>
            </div>
            <InputLabel inputSize={InputSize.LARGE} label="You receive" />
            <div className="bg-tertiary-bg rounded-3 py-[14px] px-5 mb-4 text-14 flex items-center justify-between">
              <p className="text-secondary-text ">Borrow</p>
              <div className="flex items-center gap-1">
                <Image
                  className="mr-1"
                  src={"/images/tokens/placeholder.svg"}
                  alt={order.baseAsset?.symbol || "Unknown"}
                  width={20}
                  height={20}
                />
                <span className="">{values.borrowAmount}</span>
                <span className="text-secondary-text">{order.baseAsset?.symbol || "Unknown"}</span>
                {/*<Badge*/}
                {/*  size="small"*/}
                {/*  variant={BadgeVariant.STANDARD}*/}
                {/*  standard={values.collateralTokenStandard}*/}
                {/*/>*/}
              </div>
            </div>
          </>
        )}

        {isInitialStatus && (
          <>
            <div className="flex flex-col gap-2 mb-5">
              <LendingOrderDetailsRow
                title="Interest rate per month"
                value={`${order.interestRate / 100}%`}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Interest rate for the entire period"
                value={calculatePeriodInterestRate(order.interestRate, order.positionDuration)}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Max leverage"
                value={`${order.leverage}x`}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Leverage"
                value={`${values.leverage}x`}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Deadline"
                value={formattedEndTime}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Order currency limit"
                value={order.currencyLimit}
                tooltipText="Tooltip text"
              />
              <LendingOrderDetailsRow
                title="Liquidation price source"
                value={
                  <ExternalTextLink
                    text="Dex223 Market"
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
            <div className="bg-tertiary-bg rounded-3 px-5 pb-5 pt-3">
              <div className="flex justify-between mb-3 items-center">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-tertiary-text flex items-center gap-1 text-14">
                    <Tooltip text="Tooltip text" iconSize={20} />
                    Tokens allowed for trading
                  </h3>
                </div>
                <div>
                  <SearchInput
                    value={searchTradableTokenValue}
                    onChange={(e) => setSearchTradableTokenValue(e.target.value)}
                    placeholder="Token name"
                    className="h-8 text-14 w-[180px] rounded-2"
                  />
                </div>
              </div>

              {!!filteredTokens.length && (
                <SimpleBar style={{ maxHeight: 216 }}>
                  <div className="flex gap-1 flex-wrap">
                    {filteredTokens.map((tradingToken) => {
                      return tradingToken.isToken ? (
                        <span
                          key={tradingToken.address0}
                          className="bg-quaternary-bg text-secondary-text px-2 py-1 rounded-2 hocus:bg-green-bg duration-200"
                        >
                          {tradingToken.symbol}
                        </span>
                      ) : (
                        <div className="rounded-2 text-secondary-text border border-secondary-border px-2 flex items-center py-1">
                          {tradingToken.symbol}
                        </div>
                      );
                    })}
                  </div>
                </SimpleBar>
              )}
              {!filteredTokens.length && isTokenFilterActive && (
                <div className="rounded-5 h-[76px] -mt-5 flex items-center justify-center text-secondary-text bg-empty-not-found-token bg-no-repeat bg-right-top bg-[length:64px_64px] -mr-5">
                  Token not found
                </div>
              )}
            </div>
            {isFeeAndCollateralSame ? (
              <>
                {values.collateralToken && (
                  <ApproveAmountConfig
                    amountToApprove={amountToApprove}
                    setAmountToApprove={setAmountToApprove}
                    minAmount={
                      parseUnits(values.collateralAmount, values.collateralToken?.decimals ?? 18) +
                      order.liquidationRewardAmount.value
                    }
                    isEditApproveActive={isEditApproveActive}
                    setEditApproveActive={setEditApproveActive}
                    asset={values.collateralToken}
                  />
                )}
              </>
            ) : (
              <>
                <>
                  {values.collateralToken && (
                    <ApproveAmountConfig
                      amountToApprove={amountToApprove}
                      setAmountToApprove={setAmountToApprove}
                      minAmount={parseUnits(
                        values.collateralAmount,
                        values.collateralToken?.decimals ?? 18,
                      )}
                      isEditApproveActive={isEditApproveActive}
                      setEditApproveActive={setEditApproveActive}
                      asset={values.collateralToken}
                    />
                  )}
                </>
                <>
                  {values.collateralToken && (
                    <ApproveAmountConfig
                      amountToApprove={feeAmountToApprove}
                      setAmountToApprove={setFeeAmountToApprove}
                      minAmount={order.liquidationRewardAmount.value}
                      isEditApproveActive={isEditApproveFeeActive}
                      setEditApproveActive={setEditApproveFeeActive}
                      asset={order.liquidationRewardAsset}
                    />
                  )}
                </>
              </>
            )}
          </>
        )}
        {isFinalStatus && (
          <div className="pb-3 border-b border-secondary-border mb-4">
            <div className="mx-auto w-[80px] h-[80px] flex items-center justify-center relative mb-5">
              {status === CreateMarginPositionStatus.ERROR_BORROW && (
                <EmptyStateIcon iconName="warning" />
              )}
              {status === CreateMarginPositionStatus.ERROR_APPROVE_BORROW && (
                <EmptyStateIcon iconName="warning" />
              )}
              {status === CreateMarginPositionStatus.ERROR_APPROVE_LIQUIDATION_FEE && (
                <EmptyStateIcon iconName="warning" />
              )}

              {status === CreateMarginPositionStatus.SUCCESS && (
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

            {status === CreateMarginPositionStatus.SUCCESS && (
              <div>
                <h2 className="text-center mb-1 font-bold text-20 ">Successfully borrowed</h2>
                <p className="text-center mb-1">
                  {order.baseAsset.symbol} {values.borrowAmount}
                </p>
                <div className="flex justify-center">
                  <ExternalTextLink text="View my position" href={"#"} />
                </div>
              </div>
            )}
          </div>
        )}
        <CreateMarginPositionActionButton
          orderId={orderId}
          order={order}
          amountToApprove={amountToApprove}
          feeAmountToApprove={feeAmountToApprove}
        />
      </div>
    </DrawerDialog>
  );
}
