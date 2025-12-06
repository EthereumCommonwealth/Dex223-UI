"use client";

import Alert from "@repo/ui/alert";
import Preloader from "@repo/ui/preloader";
import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import Image from "next/image";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { NumericFormat } from "react-number-format";
import { Address, formatUnits, parseUnits } from "viem";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Svg from "@/components/atoms/Svg";
import { HelperText } from "@/components/atoms/TextField";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import IconButton, { IconButtonSize } from "@/components/buttons/IconButton";
import { StandardButton } from "@/components/common/TokenStandardSelector";
import { ThemeColors } from "@/config/theme/colors";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import addToast from "@/other/toast";
import { Standard } from "@/sdk_bi/standard";

import useRevenueContract from "../hooks/useRevenueContract";
import {
  StakeError,
  StakeStatus,
  useStakeDialogStore,
} from "../stores/useStakeDialogStore";
import GasSettingsBlock from "@/components/common/GasSettingsBlock";
import NetworkFeeConfigDialog from "@/components/dialogs/NetworkFeeConfigDialog";

import {
  useClaimGasLimitStore,
  useClaimGasModeStore,
  useClaimGasPrice,
  useClaimGasPriceStore,
} from "../stores/useClaimGasSettingsStore";

export function useStakeStatus() {
  const { status: stakeStatus } = useStakeDialogStore();

  return {
    isPendingApprove: stakeStatus === StakeStatus.PENDING_APPROVE,
    isLoadingApprove: stakeStatus === StakeStatus.LOADING_APPROVE,
    isPendingStake: stakeStatus === StakeStatus.PENDING,
    isLoadingStake: stakeStatus === StakeStatus.LOADING,
    isSuccessStake: stakeStatus === StakeStatus.SUCCESS,
    isRevertedStake: stakeStatus === StakeStatus.ERROR,
    isSettledStake: stakeStatus === StakeStatus.SUCCESS || stakeStatus === StakeStatus.ERROR,
    isRevertedApprove: stakeStatus === StakeStatus.APPROVE_ERROR,
  };
}

function ApproveRow({
  isPending = false,
  isLoading = false,
  isSuccess = false,
  isSuccessStake = false,
  isReverted = false,
  hash,
}: {
  isLoading?: boolean;
  isPending?: boolean;
  isSuccess?: boolean;
  isSuccessStake?: boolean;
  isReverted?: boolean;
  hash?: Address | undefined;
}) {
  const chainId = useCurrentChainId();

  return (
    <div
      className={clsx(
        "relative grid grid-cols-[32px_1fr_auto] gap-2 md:gap-3 min-h-10 pb-5 before:absolute before:left-[15px] before:top-10 before:w-0.5 before:h-4 before:rounded-1",
        isSuccess || isSuccessStake ? "before:bg-green" : "before:bg-tertiary-bg",
      )}
    >
      <div className="flex items-center">
        <div
          className={clsx(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            isSuccess || isSuccessStake ? "bg-tertiary-bg" : "bg-tertiary-bg",
            isReverted && "bg-red-bg",
          )}
        >
          {(isSuccess || isSuccessStake) ? (
            <Image
              className="rounded-full"
              src="/images/logo-short.svg"
              alt="D223"
              width={20}
              height={20}
            />
          ) : isReverted ? (
            <Image
              className="rounded-full"
              src="/images/logo-short.svg"
              alt="D223"
              width={20}
              height={20}
            />
          ) : (
            <Image
              className="rounded-full"
              src="/images/logo-short.svg"
              alt="D223"
              width={20}
              height={20}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col justify-center min-w-0 pr-2">
        <span
          className={clsx(
            "text-14",
            isSuccess || isSuccessStake ? "text-secondary-text" : "text-primary-text",
          )}
        >
          {(isSuccess || isSuccessStake) && "Approved"}
          {isPending && "Approve"}
          {isLoading && "Approve"}
          {!isSuccess && !isPending && !isReverted && !isLoading && !isSuccessStake && "Approve"}
          {isReverted && "Approve failed"}
        </span>
        {!isSuccess && !isSuccessStake && !isReverted && (
          <span className="text-green text-12 max-md:hidden">Why do I have to approve a token?</span>
        )}
        {isPending && (
          <span className="text-secondary-text text-12 md:hidden mt-0.5">Proceed in your wallet</span>
        )}
      </div>
      <div className="relative flex items-center gap-1 md:gap-2 justify-end flex-shrink-0">
        {isPending && (
          <>
            <Preloader type="linear" className="max-md:hidden" />
            <span className="text-secondary-text text-12 md:text-14 whitespace-nowrap max-md:hidden">Proceed in your wallet</span>
          </>
        )}
        {isLoading && (
          <>
            <button className="px-2 md:px-3 py-1 md:py-1.5 bg-tertiary-bg text-secondary-text text-10 md:text-12 rounded-2 hover:bg-quaternary-bg transition-colors font-normal whitespace-nowrap">
              Speed up
            </button>
            <IconButton iconName="forward" buttonSize={IconButtonSize.EXTRA_SMALL} />
            <Preloader size={16} />
          </>
        )}
        {(isSuccess || isSuccessStake) && (
          <>
            <IconButton iconName="forward" buttonSize={IconButtonSize.EXTRA_SMALL} />
            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-green flex items-center justify-center flex-shrink-0">
              <Svg className="text-primary-bg" iconName="check" size={12} />
            </div>
          </>
        )}
        {isReverted && (
          <>
            <IconButton iconName="forward" buttonSize={IconButtonSize.EXTRA_SMALL} />
            <Svg className="text-red-light" iconName="warning" size={18} />
          </>
        )}
        {hash && (
          <a
            target="_blank"
            href={getExplorerLink(ExplorerLinkType.TRANSACTION, hash, chainId)}
            className="absolute inset-0 z-10"
            aria-label="View transaction"
          />
        )}
      </div>
    </div>
  );
}

function StakeRow({
  isPending = false,
  isLoading = false,
  isSuccess = false,
  isSettled = false,
  isReverted = false,
  isDisabled = false,
  isStaking = true,
  hash,
}: {
  isLoading?: boolean;
  isPending?: boolean;
  isSettled?: boolean;
  isSuccess?: boolean;
  isReverted?: boolean;
  isDisabled?: boolean;
  isStaking?: boolean;
  hash?: Address | undefined;
}) {
  const chainId = useCurrentChainId();

  return (
    <div className="relative grid grid-cols-[32px_1fr_auto] gap-2 md:gap-3 min-h-10">
      <div className="flex items-center h-full">
        <div
          className={clsx(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            isDisabled && "bg-tertiary-bg",
            !isDisabled && !isSuccess && !isReverted && "bg-tertiary-bg",
            isSuccess && "bg-tertiary-bg",
            isReverted && "bg-red-bg",
          )}
        >
          {isSuccess ? (
            <Svg iconName="stake-arrow" size={16} />
          ) : isReverted ? (
            <Svg className="text-red-light" iconName="arrow-down" size={16} />
          ) : (
            <Svg
              className={clsx(isDisabled ? "text-tertiary-text" : "text-secondary-text")}
              iconName={isStaking ? "stake-arrow" : "arrow-down"}
              size={16}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col justify-center min-w-0 pr-2">
        <span className={clsx("text-14", isDisabled ? "text-tertiary-text" : "text-primary-text")}>
          {isDisabled && (isStaking ? "Stake" : "Unstake")}
          {isPending && `Confirm ${isStaking ? "stake" : "unstaking"}`}
          {isLoading && `Executing ${isStaking ? "staking" : "unstaking"}`}
          {isReverted && `Failed to ${isStaking ? "stake" : "unstake"}`}
          {isSuccess && `Successfully ${isStaking ? "staked" : "unstaked"}`}
        </span>
        {isPending && (
          <span className="text-secondary-text text-12 md:hidden mt-0.5">Proceed in your wallet</span>
        )}
      </div>
      <div className="relative flex items-center gap-1 md:gap-2 justify-end flex-shrink-0">
        {isPending && (
          <>
            <Preloader type="linear" className="max-md:hidden" />
            <span className="text-secondary-text text-12 md:text-14 whitespace-nowrap max-md:hidden">Proceed in your wallet</span>
          </>
        )}
        {isLoading && (
          <>
            <button className="px-2 md:px-3 py-1 md:py-1.5 bg-tertiary-bg text-secondary-text text-10 md:text-12 rounded-2 hover:bg-quaternary-bg transition-colors font-normal whitespace-nowrap">
              Speed up
            </button>
            <IconButton iconName="forward" buttonSize={IconButtonSize.EXTRA_SMALL} />
            <Preloader size={16} />
          </>
        )}
        {isSuccess && (
          <>
            <IconButton iconName="forward" buttonSize={IconButtonSize.EXTRA_SMALL} />
            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-green flex items-center justify-center flex-shrink-0">
              <Svg className="text-primary-bg" iconName="check" size={12} />
            </div>
          </>
        )}
        {isReverted && (
          <>
            <IconButton iconName="forward" buttonSize={IconButtonSize.EXTRA_SMALL} />
            <Svg className="text-red-light" iconName="warning" size={18} />
          </>
        )}
        {hash && (
          <a
            target="_blank"
            href={getExplorerLink(ExplorerLinkType.TRANSACTION, hash, chainId)}
            className="absolute inset-0 z-10"
            aria-label="View transaction"
          />
        )}
      </div>
    </div>
  );
}

function Rows({ children }: PropsWithChildren<{}>) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

const StakeDialog = () => {
  const {
    isOpen,
    status,
    amount: storeAmount,
    selectedStandard: storeStandard,
    dialogType,
    closeDialog,
    setStatus,
    setErrorType,
    setErrorMessage,
    setApproveHash,
    setStakeHash,
    approveHash,
    stakeHash,
    errorMessage,
    errorType,
  } = useStakeDialogStore();

  const [amount, setAmount] = useState("");
  const [selectedStandard, setSelectedStandard] = useState<Standard>(Standard.ERC20);
  const [isGasSettingsOpen, setIsGasSettingsOpen] = useState(false);
  const chainId = useCurrentChainId();

  const {
    redErc20Balance,
    redErc223Balance,
    approveERC20,
    stakeERC20,
    depositAndStakeERC223,
    unstake,
    refetchUserData,
    getTokenInfo,
    canUnstake,
    userStaked,
    isCorrectNetwork,
  } = useRevenueContract();

  const {
    isPendingApprove,
    isLoadingApprove,
    isPendingStake,
    isLoadingStake,
    isSuccessStake,
    isRevertedStake,
    isSettledStake,
    isRevertedApprove,
  } = useStakeStatus();

  const {
    gasPriceOption,
    gasPriceSettings,
    setGasPriceOption,
    setGasPriceSettings,
    updateDefaultState,
  } = useClaimGasPriceStore();

  const { estimatedGas, customGasLimit, setEstimatedGas, setCustomGasLimit } =
    useClaimGasLimitStore();

  const { isAdvanced, setIsAdvanced } = useClaimGasModeStore();

  const gasPrice = useClaimGasPrice();
  const gasLimitERC20 = BigInt(329000);
  const gasLimitERC223 = BigInt(115000);
  const gasToUse = customGasLimit || estimatedGas || (selectedStandard === Standard.ERC20 ? gasLimitERC20 : gasLimitERC223);

  useEffect(() => {
    if (isOpen && storeAmount) {
      setAmount(storeAmount);
      setSelectedStandard(storeStandard === "ERC-223" ? Standard.ERC223 : Standard.ERC20);
    }
  }, [isOpen, storeAmount, storeStandard]);

  useEffect(() => {
    if (isOpen) {
      updateDefaultState(chainId);
    }
  }, [chainId, isOpen, updateDefaultState]);

  const isStaking = dialogType === "stake";
  const title = isStaking ? "Stake" : "Unstake";

  const balance0 = redErc20Balance ? formatUnits(redErc20Balance, 18) : "0";
  const balance1 = redErc223Balance ? formatUnits(redErc223Balance, 18) : "0";

  const computedBalance = selectedStandard === Standard.ERC20 ? balance0 : balance1;

  // Check if balance is insufficient for staking
  const isInsufficientBalance = useMemo(() => {
    if (!isStaking || !amount || parseFloat(amount) <= 0) {
      return false;
    }

    try {
      const amountBigInt = parseUnits(amount, 18);
      const currentBalance =
        selectedStandard === Standard.ERC20 ? redErc20Balance : redErc223Balance;

      if (!currentBalance) {
        return true;
      }

      return amountBigInt > currentBalance;
    } catch {
      return false;
    }
  }, [amount, isStaking, selectedStandard, redErc20Balance, redErc223Balance]);

  const isProcessing = useMemo(() => {
    return (
      isPendingStake ||
      isLoadingStake ||
      isSettledStake ||
      isLoadingApprove ||
      isPendingApprove ||
      isRevertedApprove
    );
  }, [
    isLoadingApprove,
    isLoadingStake,
    isPendingApprove,
    isPendingStake,
    isRevertedApprove,
    isSettledStake,
  ]);

  const handleStakeUnstake = useCallback(async () => {
    try {
      if (!isCorrectNetwork) {
        setStatus(StakeStatus.ERROR);
        setErrorType(StakeError.UNKNOWN);
        setErrorMessage("Please switch to Sepolia testnet to stake or unstake");
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        setStatus(StakeStatus.ERROR);
        setErrorType(StakeError.UNKNOWN);
        setErrorMessage("Please enter a valid amount");
        return;
      }

      const amountBigInt = parseUnits(amount, 18);
      const tokenInfo = getTokenInfo(selectedStandard as any);

      if (isStaking) {
        const currentBalance =
          selectedStandard === Standard.ERC20 ? redErc20Balance : redErc223Balance;
        if (!currentBalance || amountBigInt > currentBalance) {
          setStatus(StakeStatus.ERROR);
          setErrorType(StakeError.INSUFFICIENT_BALANCE);
          setErrorMessage("Insufficient balance");
          return;
        }

        // Handle ERC20 approval
        if (selectedStandard === Standard.ERC20) {
          setStatus(StakeStatus.PENDING_APPROVE);
          try {
            const approveResult = await approveERC20(amountBigInt);
            if (approveResult?.hash) {
              setApproveHash(approveResult.hash);
              setStatus(StakeStatus.LOADING_APPROVE);

              // Wait for receipt
              if (approveResult.receipt) {
                // Approval successful, proceed to stake
                setStatus(StakeStatus.PENDING);
              }
            }
          } catch (error: any) {
            console.error("Approval error:", error);
            setStatus(StakeStatus.APPROVE_ERROR);
            setErrorType(StakeError.UNKNOWN);
            setErrorMessage(error.message || "Approval failed");
            return;
          }
        }

        // Execute stake
        setStatus(selectedStandard === Standard.ERC223 ? StakeStatus.PENDING : StakeStatus.PENDING);
        try {
          let stakeResult;
          if (selectedStandard === Standard.ERC20) {
            stakeResult = await stakeERC20(amountBigInt);
          } else {
            stakeResult = await depositAndStakeERC223(amountBigInt);
          }

          if (stakeResult?.hash) {
            setStakeHash(stakeResult.hash);
            setStatus(StakeStatus.LOADING);

            // Wait for receipt
            if (stakeResult.receipt) {
              setStatus(StakeStatus.SUCCESS);
              await refetchUserData();
              addToast(`Successfully staked ${amount} D223`, "success");
            }
          }
        } catch (error: any) {
          console.error("Stake error:", error);
          setStatus(StakeStatus.ERROR);
          setErrorType(StakeError.UNKNOWN);
          setErrorMessage(error.message || "Stake failed");
        }
      } else {
        // Unstaking logic
        if (!canUnstake) {
          setStatus(StakeStatus.ERROR);
          setErrorType(StakeError.LOCKED_TOKENS);
          setErrorMessage("Tokens are still locked. Please wait for the lock period to end.");
          return;
        }

        if (!userStaked || typeof userStaked !== "bigint" || amountBigInt > userStaked) {
          setStatus(StakeStatus.ERROR);
          setErrorType(StakeError.INSUFFICIENT_BALANCE);
          setErrorMessage("Insufficient staked amount");
          return;
        }

        setStatus(StakeStatus.PENDING);
        try {
          const unstakeResult = await unstake(tokenInfo.address, amountBigInt);
          if (unstakeResult?.hash) {
            setStakeHash(unstakeResult.hash);
            setStatus(StakeStatus.LOADING);

            // Wait for receipt
            if (unstakeResult.receipt) {
              setStatus(StakeStatus.SUCCESS);
              await refetchUserData();
              addToast(`Successfully unstaked ${amount} D223`, "success");
            }
          }
        } catch (error: any) {
          console.error("Unstake error:", error);
          setStatus(StakeStatus.ERROR);
          setErrorType(StakeError.UNKNOWN);
          setErrorMessage(error.message || "Unstake failed");
        }
      }
    } catch (error: any) {
      console.error("Transaction error:", error);
      setStatus(StakeStatus.ERROR);
      setErrorType(StakeError.UNKNOWN);
      setErrorMessage(error.message || "Transaction failed. Please try again.");
    }
  }, [
    isCorrectNetwork,
    amount,
    isStaking,
    selectedStandard,
    redErc20Balance,
    redErc223Balance,
    canUnstake,
    userStaked,
    approveERC20,
    stakeERC20,
    depositAndStakeERC223,
    unstake,
    getTokenInfo,
    refetchUserData,
    setStatus,
    setErrorType,
    setErrorMessage,
    setApproveHash,
    setStakeHash,
  ]);

  useEffect(() => {
    if ((isSuccessStake || isRevertedStake || isRevertedApprove) && !isOpen) {
      setTimeout(() => {
        setStatus(StakeStatus.INITIAL);
      }, 400);
    }
  }, [isSuccessStake, isRevertedStake, isRevertedApprove, isOpen, setStatus]);

  function StakeActionButton() {
    if (!amount || parseFloat(amount) === 0) {
      return (
        <Button fullWidth disabled size={ButtonSize.LARGE} colorScheme={ButtonColor.GREEN}>
          Enter amount
        </Button>
      );
    }

    if (isPendingApprove) {
      return (
        <Rows>
          <ApproveRow isPending />
          <StakeRow isDisabled isStaking={isStaking} />
        </Rows>
      );
    }

    if (isLoadingApprove) {
      return (
        <Rows>
          <ApproveRow hash={approveHash} isLoading />
          <StakeRow isDisabled isStaking={isStaking} />
        </Rows>
      );
    }

    if (isRevertedApprove) {
      return (
        <>
          <Rows>
            <ApproveRow hash={approveHash} isReverted />
            <StakeRow isDisabled isStaking={isStaking} />
          </Rows>
          <div className="flex flex-col gap-4 mt-4 md:mt-5">
            <div className="bg-red-light/10 border border-red-light/30 rounded-3 p-3 md:p-4">
              <p className="text-12 md:text-14 text-secondary-text">
                Transaction failed because the gas limit is too low. Adjust your wallet settings. If
                you still have issues, click{" "}
                <a href="#" className="text-secondary-text underline">
                  common errors
                </a>
              </p>
            </div>
            <Button
              fullWidth
              size={ButtonSize.LARGE}
              colorScheme={ButtonColor.GREEN}
              onClick={() => {
                setStatus(StakeStatus.INITIAL);
              }}
            >
              Try again
            </Button>
          </div>
        </>
      );
    }

    if (isPendingStake) {
      return (
        <Rows>
          {isStaking && selectedStandard === Standard.ERC20 && (
            <ApproveRow hash={approveHash} isSuccess />
          )}
          <StakeRow isPending isStaking={isStaking} />
        </Rows>
      );
    }

    if (isLoadingStake) {
      return (
        <Rows>
          {isStaking && selectedStandard === Standard.ERC20 && (
            <ApproveRow hash={approveHash} isSuccess />
          )}
          <StakeRow hash={stakeHash} isLoading isStaking={isStaking} />
        </Rows>
      );
    }

    if (isSuccessStake) {
      return (
        <Rows>
          {isStaking && selectedStandard === Standard.ERC20 && (
            <ApproveRow hash={approveHash} isSuccessStake />
          )}
          <StakeRow hash={stakeHash} isSettled isSuccess isStaking={isStaking} />
        </Rows>
      );
    }

    if (isRevertedStake) {
      return (
        <>
          <Rows>
            {isStaking && selectedStandard === Standard.ERC20 && (
              <ApproveRow hash={approveHash} isSuccess />
            )}
            <StakeRow hash={stakeHash} isSettled isReverted isStaking={isStaking} />
          </Rows>
          <div className="flex flex-col gap-4 mt-4 md:mt-5">
            <div className="bg-red-light/10 border border-red-light/30 rounded-3 p-3 md:p-4">
              <p className="text-12 md:text-14 text-secondary-text">
                {errorMessage ||
                  "Transaction failed because the gas limit is too low. Adjust your wallet settings. If you still have issues, click "}
                {!errorMessage && (
                  <a href="#" className="text-secondary-text underline">
                    common errors
                  </a>
                )}
              </p>
            </div>
            <Button
              fullWidth
              size={ButtonSize.LARGE}
              colorScheme={ButtonColor.GREEN}
              onClick={() => {
                setStatus(StakeStatus.INITIAL);
              }}
            >
              Try again
            </Button>
          </div>
        </>
      );
    }

    return (
      <Button
        fullWidth
        size={ButtonSize.LARGE}
        colorScheme={ButtonColor.GREEN}
        onClick={handleStakeUnstake}
        disabled={!amount || parseFloat(amount) === 0 || (!isStaking && !canUnstake)}
      >
        {title}
      </Button>
    );
  }

  const renderInitialState = () => {
    const gasLimitERC20 = 329000;
    const gasLimitERC223 = 115000;
    const gasPriceGwei = 33.53;
    const networkFeeERC20 = 0.0031;
    const networkFeeERC223 = 0.0011;

    return (
      <div className="space-y-4">
        {isStaking && (
          <Alert
            type="warning"
            text={
              <div className="flex items-start gap-2">
                <span className="text-14">
                  You will be able to unstake your D223 tokens at any moment after{" "}
                  <span className="font-medium">21 days</span> since your staking date.
                </span>
              </div>
            }
          />
        )}

        {/* Stake amount section */}
        <div className="bg-tertiary-bg rounded-3 p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <span className="text-14 text-secondary-text">
                {isStaking ? "Stake" : "Unstake"} amount
              </span>
              <Tooltip
                iconSize={16}
                text={`Enter the amount of D223 tokens you want to ${isStaking ? "stake" : "unstake"}`}
              />
            </div>
          </div>
          <div className={`${isInsufficientBalance ? "relative border-red-light border rounded-3 p-2 shadow-red/60" : "relative"}`}>
            <div className="flex items-center justify-between mb-5 gap-2">
              <div className="flex-1 relative min-w-0">
                <div
                  className={clsx(
                    "duration-200 rounded-3 pointer-events-none absolute w-full h-full top-0 left-0"
                  )}
                />
                <NumericFormat
                  allowedDecimalSeparators={[","]}
                  decimalScale={18}
                  inputMode="decimal"
                  placeholder="0"
                  className="h-12 bg-transparent outline-0 border-0 text-24 md:text-32 w-full placeholder:text-tertiary-text relative z-10"
                  type="text"
                  value={amount}
                  onValueChange={(values) => {
                    setAmount(values.value);
                  }}
                  allowNegative={false}
                />
                <span className="text-12 block -mt-1 text-tertiary-text">$50.00</span>
              </div>
              <div className="group flex items-center gap-1.5 md:gap-2 duration-200 text-base text-primary-text bg-primary-bg hocus:text-primary-text rounded-[80px] border border-transparent hocus:bg-green-bg hocus:shadow shadow-green/60 hocus:border-green p-2 xl:px-5 xl:py-2.5 xl:text-24 min-h-12 flex-shrink-0">
                <Image
                  src="/images/logo-short.svg"
                  width={32}
                  height={32}
                  alt="D223"
                  className="w-8 h-8 flex-shrink-0"
                />
                <span className="text-14 md:text-16 font-medium whitespace-nowrap">D223</span>
              </div>
            </div>

            {/* Standard selector */}
            <div className="gap-1 md:gap-3 relative md:pb-2 grid grid-cols-2">
              <button
                type="button"
                onClick={() => setSelectedStandard(Standard.ERC20)}
                className={clsx(
                  "*:z-10 flex flex-col gap-1 px-2 md:px-3 py-2 md:py-2.5 rounded-2 before:absolute before:rounded-3 before:w-full before:h-full before:left-0 before:top-0 before:duration-200 relative before:bg-gradient-to-r before:from-green-bg before:to-green-bg/0 text-12 group bg-gradient-to-r from-primary-bg md:rounded-b-0 md:before:rounded-b-0",
                  selectedStandard === Standard.ERC20
                    ? "before:opacity-100"
                    : "before:opacity-0 hocus:before:opacity-100",
                )}
              >
                <div className="max-md:hidden flex items-center gap-1 cursor-default">
                  <span
                    className={clsx(
                      "text-12",
                      selectedStandard === Standard.ERC20
                        ? "text-secondary-text"
                        : "text-tertiary-text",
                    )}
                  >
                    Standard
                  </span>
                  <span
                    className={clsx(
                      "px-2 py-0.5 rounded-2 text-10 font-medium",
                      selectedStandard === Standard.ERC20
                        ? "bg-green text-black"
                        : "bg-tertiary-bg text-secondary-text",
                    )}
                  >
                    {Standard.ERC20}
                  </span>
                  <Tooltip iconSize={16} text="ERC-20 is the classic Ethereum token standard" />
                </div>
                <span
                  className={clsx(
                    "block text-left mt-10 md:mt-0 text-11 md:text-12",
                    selectedStandard === Standard.ERC20 ? "text-primary-text" : "text-tertiary-text",
                  )}
                >
                  <span
                    className={
                      selectedStandard === Standard.ERC20 ? "text-secondary-text" : "text-tertiary-text"
                    }
                  >
                    Balance
                  </span>{" "}
                  {parseFloat(balance0).toFixed(2)} D223
                </span>
              </button>

              {/* Center selector buttons */}
              <div className="mx-auto z-10 text-10 w-[calc(100%-24px)] h-[32px] top-1 left-1/2 -translate-x-1/2 rounded-20 border border-green p-1 flex gap-1 items-center absolute md:w-auto md:top-[14px] md:left-1/2 md:-translate-x-1/2">
                {[Standard.ERC20, Standard.ERC223].map((standard) => {
                  return (
                    <StandardButton
                      colorScheme={ThemeColors.GREEN}
                      key={standard}
                      handleStandardSelect={() => setSelectedStandard(standard)}
                      standard={standard}
                      selectedStandard={selectedStandard}
                      disabled={false}
                    />
                  );
                })}
              </div>

              {/* ERC-223 Option */}
              <button
                type="button"
                onClick={() => setSelectedStandard(Standard.ERC223)}
                className={clsx(
                  "*:z-10 flex flex-col gap-1 px-2 md:px-3 py-2 md:py-2.5 rounded-2 before:absolute before:rounded-3 before:w-full before:h-full before:left-0 before:top-0 before:duration-200 relative before:bg-gradient-to-r before:from-green-bg before:to-green-bg/0 text-12 group before:rotate-180 items-end bg-gradient-to-l from-primary-bg md:rounded-b-0 md:before:rounded-t-0",
                  selectedStandard === Standard.ERC223
                    ? "before:opacity-100"
                    : "before:opacity-0 hocus:before:opacity-100",
                )}
              >
                <div className="max-md:hidden flex items-center gap-1 cursor-default">
                  <Tooltip iconSize={16} text="ERC-223 is an improved token standard with lower fees" />
                  <span
                    className={clsx(
                      "px-2 py-0.5 rounded-2 text-10 font-medium",
                      selectedStandard === Standard.ERC223
                        ? "bg-green text-black"
                        : "bg-tertiary-bg text-secondary-text",
                    )}
                  >
                    {Standard.ERC223}
                  </span>
                  <span
                    className={clsx(
                      "text-12",
                      selectedStandard === Standard.ERC223
                        ? "text-secondary-text"
                        : "text-tertiary-text",
                    )}
                  >
                    Standard
                  </span>
                </div>
                <span
                  className={clsx(
                    "block text-right mt-10 md:mt-0 text-11 md:text-12",
                    selectedStandard === Standard.ERC223 ? "text-primary-text" : "text-tertiary-text",
                  )}
                >
                  <span
                    className={
                      selectedStandard === Standard.ERC223
                        ? "text-secondary-text"
                        : "text-tertiary-text"
                    }
                  >
                    Balance
                  </span>{" "}
                  {parseFloat(balance1).toFixed(2)} D223
                </span>
              </button>

              {/* Gas info */}
              <div className="py-1 px-3 text-12 bg-gradient-to-r from-primary-bg rounded-bl-2 text-tertiary-text max-md:hidden">
                ~{gasLimitERC20.toLocaleString()} gas
              </div>
              <div className="py-1 px-3 text-12 bg-gradient-to-l from-primary-bg rounded-br-2 text-right text-tertiary-text max-md:hidden ml-auto">
                ~{gasLimitERC223.toLocaleString()} gas
              </div>
            </div>
          </div>
          {isInsufficientBalance && (
            <div className="mt-3">
              <HelperText error="Insufficient balance" />
            </div>
          )}

        </div>

        {/* Approve amount section - only show for ERC-20 staking */}
        {isStaking && (selectedStandard === Standard.ERC20 || selectedStandard === Standard.ERC223) && (
          <div className="bg-tertiary-bg rounded-3 flex justify-between items-center px-4 md:px-5 py-2.5 min-h-12 gap-2 md:gap-3">
            <div className="flex items-center gap-1 md:gap-1.5 text-secondary-text">
              <Tooltip
                iconSize={16}
                text="In order to stake ERC-20 tokens, you need to give the contract permission to withdraw your tokens. This amount never expires."
              />
              <span className="text-12 md:text-14 whitespace-nowrap">Approve amount</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 flex-grow justify-end min-w-0">
              <span className="text-12 md:text-14 truncate">{amount || "0"} D223</span>
              <Button
                size={ButtonSize.EXTRA_SMALL}
                colorScheme={ButtonColor.LIGHT_GREEN}
                onClick={() => { }}
              >
                Edit
              </Button>
            </div>
          </div>
        )}

        {/* Gas price and network fee section */}
        <GasSettingsBlock
          gasPrice={gasPrice}
          gasLimit={gasToUse}
          gasPriceOption={gasPriceOption}
          onEditClick={() => setIsGasSettingsOpen(true)}
        />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <DrawerDialog isOpen={isOpen} setIsOpen={closeDialog} maxMobileWidth="767px">
        <div className="bg-primary-bg rounded-5 w-full md:w-[600px] max-md:rounded-t-5 max-md:rounded-b-none">
          <DialogHeader onClose={closeDialog} title={title} />
          <div className="card-spacing max-md:px-4 max-md:pb-6">
            {!isSettledStake && !isRevertedApprove && !isProcessing && renderInitialState()}

            {isProcessing && !isSettledStake && !isRevertedApprove && (
              <>
                <div className="flex flex-col gap-3">
                  <div className="rounded-3 bg-tertiary-bg py-4 px-4 md:px-5 flex flex-col gap-1">
                    <p className="text-secondary-text text-14">
                      {isStaking ? "Stake" : "Unstake"} amount
                    </p>
                    <div className="flex justify-between items-start md:items-center gap-2">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-24 md:text-32 text-primary-text break-words">{amount || "0"}</span>
                        <p className="text-secondary-text text-12 md:text-14">$50.00</p>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-primary-bg rounded-full flex items-center justify-center flex-shrink-0">
                          <Image
                            src="/images/logo-short.svg"
                            alt="D223"
                            width={14}
                            height={14}
                            className="md:w-4 md:h-4"
                          />
                        </div>
                        <span className="text-14 md:text-16 font-medium text-primary-text whitespace-nowrap">D223</span>
                        <Image
                          src={selectedStandard === Standard.ERC20 ? "/images/badges/erc-20-green-small.svg" : "/images/badges/erc-223-green-small.svg"}
                          alt="Standard"
                          width={40}
                          height={40}
                          className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-px w-full bg-secondary-border mb-4 mt-5" />
              </>
            )}

            {(isSettledStake || isRevertedApprove) && (
              <div>
                <div className="flex flex-col items-center py-3 md:py-4">
                  {/* Success Icon */}
                  {isSuccessStake && (
                    <div className="mx-auto w-[64px] h-[64px] md:w-[80px] md:h-[80px] flex items-center justify-center relative mb-4 md:mb-5">
                      <div className="w-[40px] h-[40px] md:w-[54px] md:h-[54px] rounded-full border-[5px] md:border-[7px] blur-[6px] md:blur-[8px] opacity-80 border-green" />
                      <Svg
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green"
                        iconName="success"
                        size={52}
                      />
                    </div>
                  )}

                  {/* Error Icon */}
                  {(isRevertedStake || isRevertedApprove) && (
                    <div className="flex items-center justify-center mb-4 md:mb-5">
                      <Svg className="text-red-light" iconName="warning" size={52} />
                    </div>
                  )}

                  {/* Status Text */}
                  <h3
                    className={clsx(
                      "text-16 md:text-18 xl:text-20 font-bold mb-2 text-center px-2",
                      isSuccessStake && "text-primary-text",
                      (isRevertedStake || isRevertedApprove) && "text-red-light",
                    )}
                  >
                    {isSuccessStake && `Successfully ${isStaking ? "staked" : "unstaked"}`}
                    {isRevertedStake && `Failed to ${isStaking ? "stake" : "unstake"}`}
                    {isRevertedApprove && "Approve failed"}
                  </h3>

                  {/* Amount */}
                  <p className="text-14 md:text-16 text-primary-text mb-4 md:mb-6">
                    {amount} D223
                  </p>
                </div>

                <div className="h-px w-full bg-secondary-border" />
              </div>
            )}
            <div className="mt-4 md:mt-5">
              <StakeActionButton />
            </div>
          </div>
        </div>
      </DrawerDialog>
      <NetworkFeeConfigDialog
        isAdvanced={isAdvanced}
        setIsAdvanced={setIsAdvanced}
        estimatedGas={estimatedGas > BigInt(0) ? estimatedGas : gasToUse}
        setEstimatedGas={setEstimatedGas}
        gasPriceSettings={gasPriceSettings}
        gasPriceOption={gasPriceOption}
        customGasLimit={customGasLimit}
        setCustomGasLimit={setCustomGasLimit}
        setGasPriceOption={setGasPriceOption}
        setGasPriceSettings={setGasPriceSettings}
        isOpen={isGasSettingsOpen}
        setIsOpen={setIsGasSettingsOpen}
      />
    </>
  );
};

export default StakeDialog;
