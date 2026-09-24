import { isZeroAddress } from "@ethereumjs/util";
import ExternalTextLink from "@repo/ui/external-text-link";
import clsx from "clsx";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Address, formatUnits } from "viem";

import { getApproveTextMap } from "@/app/[locale]/margin-trading/lending-order/[id]/helpers/getStepTexts";
import useAutoListing from "@/app/[locale]/token-listing/add/hooks/useAutoListing";
import useListToken from "@/app/[locale]/token-listing/add/hooks/useListToken";
import useTokensToList from "@/app/[locale]/token-listing/add/hooks/useTokensToList";
import { useAutoListingContractStore } from "@/app/[locale]/token-listing/add/stores/useAutoListingContractStore";
import { useConfirmListTokenDialogStore } from "@/app/[locale]/token-listing/add/stores/useConfirmListTokenDialogOpened";
import {
  ListTokenStatus,
  useListTokenStatusStore,
} from "@/app/[locale]/token-listing/add/stores/useListTokenStatusStore";
import { usePaymentTokenStore } from "@/app/[locale]/token-listing/add/stores/usePaymentTokenStore";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button from "@/components/buttons/Button";
import ApproveAmountConfig from "@/components/common/ApproveAmountConfig";
import OperationStepRow, {
  OperationRows,
  operationStatusToStepStatus,
  OperationStepStatus,
} from "@/components/common/OperationStepRow";
import { IconName } from "@/config/types/IconName";
import { formatFloat } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import { useStoreAllowance } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useNativeCurrency } from "@/hooks/useNativeCurrency";
import { DexChainId } from "@/sdk_bi/chains";
import { ADDRESS_ZERO } from "@/sdk_bi/constants";
import { Token } from "@/sdk_bi/entities/token";
import { Standard } from "@/sdk_bi/standard";

type StepTextMap = {
  [key in OperationStepStatus]: string;
};

type OperationStepConfig = {
  iconName: IconName;
  textMap: StepTextMap;
  pending: ListTokenStatus;
  loading: ListTokenStatus;
  error: ListTokenStatus;
};

function composeListTokensSteps(
  isPaymentTokenNative: boolean,
  isFree: boolean,
  paymentTokenSymbol?: string,
): OperationStepConfig[] {
  const approveStep: OperationStepConfig = {
    iconName: "done",
    pending: ListTokenStatus.PENDING_APPROVE,
    loading: ListTokenStatus.LOADING_APPROVE,
    error: ListTokenStatus.ERROR_APPROVE,
    textMap: getApproveTextMap(paymentTokenSymbol || "Unknown"),
  };

  const listTokensStep: OperationStepConfig = {
    iconName: "listing",
    pending: ListTokenStatus.PENDING_LIST_TOKEN,
    loading: ListTokenStatus.LOADING_LIST_TOKEN,
    error: ListTokenStatus.ERROR_LIST_TOKEN,
    textMap: {
      [OperationStepStatus.IDLE]: "Listing token",
      [OperationStepStatus.AWAITING_SIGNATURE]: "Confirm listing token",
      [OperationStepStatus.LOADING]: "Executing listing token",
      [OperationStepStatus.STEP_COMPLETED]: "Token successfully listed",
      [OperationStepStatus.STEP_FAILED]: "Failed to list token",
      [OperationStepStatus.OPERATION_COMPLETED]: "Token successfully listed",
    },
  };

  return isPaymentTokenNative || isFree ? [listTokensStep] : [approveStep, listTokensStep];
}

function ListTokensActionButton({
  handleList,
  isPaymentTokenNative,
  paymentTokenSymbol,
  isFree,
  disabled,
}: {
  handleList: () => Promise<void>;
  isPaymentTokenNative: boolean;
  isFree: boolean;
  paymentTokenSymbol?: string;
  disabled: boolean;
}) {
  const { status, approveHash, listTokenHash } = useListTokenStatusStore();

  const hashes = useMemo(() => {
    return isPaymentTokenNative || isFree ? [listTokenHash] : [approveHash, listTokenHash];
  }, [approveHash, isFree, isPaymentTokenNative, listTokenHash]);

  if (status !== ListTokenStatus.INITIAL) {
    return (
      <OperationRows>
        {composeListTokensSteps(isPaymentTokenNative, isFree, paymentTokenSymbol).map(
          (step, index) => (
            <OperationStepRow
              key={index}
              iconName={step.iconName}
              hash={hashes[index]}
              statusTextMap={step.textMap}
              status={operationStatusToStepStatus({
                currentStatus: status,
                orderedSteps: composeListTokensSteps(
                  isPaymentTokenNative,
                  isFree,
                  paymentTokenSymbol,
                ).flatMap((s) => [s.pending, s.loading, s.error]),
                stepIndex: index,
                pendingStep: step.pending,
                loadingStep: step.loading,
                errorStep: step.error,
                successStep: ListTokenStatus.SUCCESS,
              })}
              isFirstStep={index === 0}
            />
          ),
        )}
      </OperationRows>
    );
  }

  return (
    <Button disabled={disabled} onClick={() => handleList()} fullWidth>
      Confirm listing token
    </Button>
  );
}

function SingleCard({
  underlineText,
  title,
  address,
  color = "tertiary",
}: {
  color?: "tertiary" | "quaternary";
  underlineText?: string;
  title: string;
  address: Address;
}) {
  const chainId = useCurrentChainId();

  return (
    <div
      className={clsx(
        "rounded-3 flex flex-col overflow-hidden justify-between",
        color === "quaternary" ? "bg-quaternary-bg" : "bg-tertiary-bg",
      )}
    >
      <div
        className={clsx(
          "flex items-center justify-center flex-col py-3",
          color === "quaternary"
            ? "bg-quaternary-bg border-b border-b-tertiary-bg"
            : "bg-tertiary-bg",
        )}
      >
        {underlineText && (
          <div className="text-secondary-text text-14 px-2 text-center">{underlineText}</div>
        )}
        <div className="text-18 text-center px-4">{title}</div>
      </div>

      <div className="bg-quaternary-bg flex items-center text-16 py-4 justify-center">
        <ExternalTextLink
          className="max-sm:text-14"
          text={truncateMiddle(address)}
          href={getExplorerLink(ExplorerLinkType.ADDRESS, address, chainId)}
        />
      </div>
    </div>
  );
}
export default function ConfirmListingDialog() {
  const { autoListing } = useAutoListing();
  const { isOpen, setIsOpen } = useConfirmListTokenDialogStore();
  const { status, setStatus } = useListTokenStatusStore();

  const { handleList } = useListToken();
  const isInitialStatus = useMemo(() => status === ListTokenStatus.INITIAL, [status]);
  const isFinalStatus = useMemo(
    () =>
      status === ListTokenStatus.SUCCESS ||
      status === ListTokenStatus.ERROR_APPROVE ||
      status === ListTokenStatus.ERROR_LIST_TOKEN,
    [status],
  );

  const isLoadingStatus = useMemo(
    () => !isInitialStatus && !isFinalStatus,
    [isFinalStatus, isInitialStatus],
  );

  useEffect(() => {
    if (isFinalStatus && !isOpen) {
      setTimeout(() => {
        setStatus(ListTokenStatus.INITIAL);
      }, 400);
    }
  }, [isFinalStatus, isOpen, setStatus, status]);

  const tokensToList = useTokensToList();

  const { paymentToken, setPaymentToken } = usePaymentTokenStore();
  const [isEditApproveActive, setEditApproveActive] = useState(false);

  const [amountToApprove, setAmountToApprove] = useState(
    paymentToken && tokensToList.length
      ? formatUnits(paymentToken.price * BigInt(tokensToList.length), paymentToken.token.decimals)
      : "0",
  );

  useEffect(() => {
    if (tokensToList.length && paymentToken) {
      setAmountToApprove(
        formatUnits(paymentToken.price * BigInt(tokensToList.length), paymentToken.token.decimals),
      );
    }
  }, [paymentToken, tokensToList]);

  const { autoListingContract } = useAutoListingContractStore();

  const isFree = useMemo(() => {
    return !autoListing?.tokensToPay.length;
  }, [autoListing]);

  const { isAllowed } = useStoreAllowance({
    token:
      paymentToken && !isFree
        ? new Token(
            DexChainId.SEPOLIA,
            paymentToken.token.address,
            ADDRESS_ZERO,
            +paymentToken.token.decimals,
            paymentToken.token.symbol,
          )
        : undefined,
    contractAddress: autoListingContract,
    amountToCheck:
      paymentToken && tokensToList.length ? paymentToken.price * BigInt(tokensToList.length) : null,
  });

  const isMobile = useMediaQuery({ query: "(max-width: 550px)" });

  const nativeCurrency = useNativeCurrency();

  return (
    <DrawerDialog
      isOpen={isOpen}
      setIsOpen={(isOpen) => {
        setIsOpen(isOpen);
      }}
    >
      <div className="bg-primary-bg rounded-5 w-full md:w-[600px]">
        <DialogHeader
          onClose={() => {
            setIsOpen(false);
          }}
          title={"Review listing tokens"}
        />
        <div className="card-spacing">
          {(isInitialStatus || isLoadingStatus) && (
            <>
              <div className="mb-5">
                {tokensToList.length === 1 && tokensToList[0] && (
                  <div className="grid grid-cols-[1fr_12px_1fr]">
                    <SingleCard
                      address={tokensToList[0].wrapped.address0}
                      title={tokensToList[0].symbol!}
                      underlineText="You list token"
                    />
                    <div className="relative">
                      <div className="text-tertiary-text absolute top-1/2 -translate-x-1/2 -translate-y-1/2 left-1/2 flex justify-center items-center w-12 h-12 rounded-full bg-primary-bg">
                        <Svg iconName="arrow-in" />
                      </div>
                    </div>
                    <SingleCard
                      address={autoListing?.id!}
                      title={autoListing?.name || "Unknown"}
                      underlineText={
                        isMobile ? "In the auto-listing" : "In the auto-listing сontract"
                      }
                    />
                  </div>
                )}
                {tokensToList.length === 2 && tokensToList[0] && tokensToList[1] && (
                  <>
                    <div className="p-5 bg-tertiary-bg rounded-3">
                      <div className="text-center text-secondary-text mb-3">You list tokens</div>
                      <div className="grid grid-cols-[1fr_12px_1fr]">
                        <SingleCard
                          color="quaternary"
                          address={tokensToList[0].wrapped.address0}
                          title={tokensToList[0].symbol!}
                        />
                        <div />
                        <SingleCard
                          color="quaternary"
                          address={tokensToList[1].wrapped.address0}
                          title={tokensToList[1].symbol!}
                        />
                      </div>
                    </div>

                    <div className="relative h-3">
                      <div className="text-tertiary-text absolute  -translate-x-1/2 -bottom-2 left-1/2 flex justify-center items-center w-12 h-12 rounded-full bg-primary-bg">
                        <Svg className="rotate-90" iconName="arrow-in" />
                      </div>
                    </div>

                    <SingleCard
                      address={autoListing?.id!}
                      title={autoListing?.name || "Unknown"}
                      underlineText="In the auto-listing сontract"
                    />
                  </>
                )}
              </div>
              {autoListing && !autoListing.isFree && paymentToken && (
                <div className="mb-5">
                  <div className="flex justify-between px-5 py-3.5 rounded-3 bg-tertiary-bg items-center">
                    <span className="text-14 text-secondary-text">Payment for listing</span>

                    <div className="flex items-center gap-1">
                      <Image
                        className="mr-1"
                        src="/images/tokens/placeholder.svg"
                        width={24}
                        height={24}
                        alt=""
                      />
                      <span className="font-medium text-14">
                        {formatUnits(
                          paymentToken.price * BigInt(tokensToList.length),
                          paymentToken.token.decimals ?? 18,
                        ).slice(0, 7) === "0.00000"
                          ? truncateMiddle(
                              formatUnits(
                                paymentToken.price * BigInt(tokensToList.length),
                                paymentToken.token.decimals ?? 18,
                              ),
                              {
                                charsFromStart: 3,
                                charsFromEnd: 2,
                              },
                            )
                          : formatFloat(
                              formatUnits(
                                paymentToken.price * BigInt(tokensToList.length),
                                paymentToken.token.decimals != null
                                  ? paymentToken.token.decimals
                                  : 18,
                              ),
                            )}
                      </span>
                      <span className="flex items-center gap-2 text-14 text-secondary-text">
                        {isZeroAddress(paymentToken.token.address)
                          ? nativeCurrency.symbol
                          : paymentToken.token.symbol}
                        {!isZeroAddress(paymentToken.token.address) ? (
                          <Badge variant={BadgeVariant.STANDARD} standard={Standard.ERC20} />
                        ) : (
                          <Badge variant={BadgeVariant.COLORED} color="green" text="Native" />
                        )}
                      </span>
                    </div>
                  </div>

                  {paymentToken?.token &&
                    !isAllowed &&
                    !isZeroAddress(paymentToken.token.address) &&
                    !isLoadingStatus && (
                      <ApproveAmountConfig
                        amountToApprove={amountToApprove}
                        setAmountToApprove={setAmountToApprove}
                        minAmount={paymentToken.price * BigInt(tokensToList.length)}
                        isEditApproveActive={isEditApproveActive}
                        setEditApproveActive={setEditApproveActive}
                        asset={paymentToken.token}
                      />
                    )}
                </div>
              )}
            </>
          )}

          {isFinalStatus && (
            <div>
              <div className="mx-auto w-[80px] h-[80px] flex items-center justify-center relative mb-5">
                {(status === ListTokenStatus.ERROR_LIST_TOKEN ||
                  status === ListTokenStatus.ERROR_APPROVE) && (
                  <EmptyStateIcon iconName="warning" />
                )}

                {status === ListTokenStatus.SUCCESS && (
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
                  {status === ListTokenStatus.ERROR_LIST_TOKEN && "Failed to list token"}
                  {status === ListTokenStatus.SUCCESS && "Token successfully listed"}
                  {status === ListTokenStatus.ERROR_APPROVE && "Approve failed"}
                </span>
              </div>

              <div className="h-px w-full bg-secondary-border mb-4 mt-5" />
            </div>
          )}

          {autoListing && (
            <ListTokensActionButton
              isPaymentTokenNative={Boolean(
                paymentToken && isZeroAddress(paymentToken.token.address),
              )}
              paymentTokenSymbol={paymentToken?.token.symbol}
              handleList={() => handleList(amountToApprove)}
              isFree={isFree}
              disabled={isEditApproveActive}
            />
          )}
        </div>
      </div>
    </DrawerDialog>
  );
}
