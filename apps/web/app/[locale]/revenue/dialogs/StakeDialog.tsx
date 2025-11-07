"use client";

import Alert from "@repo/ui/alert";
import Preloader from "@repo/ui/preloader";
import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { NumericFormat } from "react-number-format";
import { formatUnits, parseUnits } from "viem";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import GasSettingsBlock from "@/components/common/GasSettingsBlock";
import { StandardButton } from "@/components/common/TokenStandardSelector";
import { ThemeColors } from "@/config/theme/colors";
import addToast from "@/other/toast";
import { Standard } from "@/sdk_bi/standard";

import useRevenueContract from "../hooks/useRevenueContract";
import { useStakeDialogStore } from "../stores/useStakeDialogStore";

const StakeDialog = () => {
  const { isOpen, state, data, dialogType, closeDialog, setState, setError, setData } =
    useStakeDialogStore();

  const [amount, setAmount] = useState("");
  const [selectedStandard, setSelectedStandard] = useState<Standard>(Standard.ERC20);

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

  useEffect(() => {
    if (data) {
      setAmount(data.amount || "");
      setSelectedStandard(data.selectedStandard === "ERC-223" ? Standard.ERC223 : Standard.ERC20);
    }
  }, [data]);

  const isStaking = dialogType === "stake";
  const title = isStaking ? "Stake" : "Unstake";

  const balance0 = redErc20Balance ? formatUnits(redErc20Balance, 18) : "0";
  const balance1 = redErc223Balance ? formatUnits(redErc223Balance, 18) : "0";

  // Debug logging
  useEffect(() => {
    console.log("StakeDialog Debug:", {
      redErc20Balance,
      redErc223Balance,
      balance0,
      balance1,
      isCorrectNetwork,
    });
  }, [redErc20Balance, redErc223Balance, balance0, balance1, isCorrectNetwork]);

  const handleStakeUnstake = async () => {
    try {
      if (!isCorrectNetwork) {
        setState("error");
        setError("Please switch to Sepolia testnet to stake or unstake");
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        setState("error");
        setError("Please enter a valid amount");
        return;
      }

      const amountBigInt = parseUnits(amount, 18);
      const tokenInfo = getTokenInfo(selectedStandard as any);
      setData({
        amount,
        selectedStandard: selectedStandard === Standard.ERC20 ? "ERC-20" : "ERC-223",
      });

      if (isStaking) {
        const currentBalance =
          selectedStandard === Standard.ERC20 ? redErc20Balance : redErc223Balance;
        if (!currentBalance || amountBigInt > currentBalance) {
          setState("error");
          setError("Insufficient balance");
          return;
        }

        if (selectedStandard === Standard.ERC20) {
          setState("approving");
          await approveERC20(amountBigInt);
        }

        if (selectedStandard === Standard.ERC20) {
          setState("executing");
          await stakeERC20(amountBigInt);
        } else {
          setState("executing");
          await depositAndStakeERC223(amountBigInt);
        }
      } else {
        // Unstaking logic
        if (!canUnstake) {
          setState("error");
          setError("Tokens are still locked. Please wait for the lock period to end.");
          return;
        }

        if (!userStaked || typeof userStaked !== "bigint" || amountBigInt > userStaked) {
          setState("error");
          setError("Insufficient staked amount");
          return;
        }

        setState("executing");

        await unstake(tokenInfo.address, amountBigInt);
      }

      setState("success");

      try {
        await refetchUserData();
      } catch (refetchError) {
        console.error("Failed to refetch user data:", refetchError);
      }

      addToast(`Successfully ${isStaking ? "staked" : "unstaked"} ${amount} D223`, "success");
    } catch (error: any) {
      console.error("Transaction error:", error);
      setState("error");
      const errorMessage = error.message || "Transaction failed. Please try again.";
      setError(errorMessage);
      addToast(errorMessage, "error");
    }
  };

  const handleTryAgain = () => {
    setState("initial");
  };

  const computedBalance = selectedStandard === Standard.ERC20 ? balance0 : balance1;

  const renderInitialState = () => (
    <div className="space-y-4">
      {!isCorrectNetwork && (
        <Alert
          type="warning"
          text={
            <div className="flex items-start gap-2">
              <span className="text-14">
                You are not connected to Sepolia testnet. Please switch networks to see your
                balances and {isStaking ? "stake" : "unstake"}.
              </span>
            </div>
          }
        />
      )}
      {isStaking && (
        <Alert
          type="warning"
          text={
            <div className="flex items-start gap-2">
              <span className="text-14">
                You will be able to unstake your D223 tokens at any moment after{" "}
                <span className="font-medium">3 days</span> since your last staking date.
              </span>
            </div>
          }
        />
      )}

      {/* Amount input */}
      <div className="bg-secondary-bg rounded-3 p-5">
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

        <div className="flex items-center justify-between mb-5">
          <div className="flex-1">
            <NumericFormat
              allowedDecimalSeparators={[","]}
              decimalScale={18}
              inputMode="decimal"
              placeholder="0"
              className="h-12 bg-transparent outline-0 border-0 text-32 w-full placeholder:text-tertiary-text"
              type="text"
              value={amount}
              onValueChange={(values) => {
                setAmount(values.value);
              }}
              allowNegative={false}
            />
            <span className="text-12 block -mt-1 text-tertiary-text">$50.00</span>
          </div>
          <div className="group flex items-center gap-2 duration-200 text-base text-primary-text bg-primary-bg hocus:text-primary-text rounded-[80px] border border-transparent hocus:bg-green-bg hocus:shadow shadow-green/60 hocus:border-green p-2 lg:px-5 lg:py-2.5 lg:text-24 min-h-12 flex-shrink-0">
            <Image
              src="/images/logo-short.svg"
              width={32}
              height={32}
              alt="D223"
              className="w-8 h-8"
            />
            <span className="text-16 font-medium">D223</span>
          </div>
        </div>

        {/* Standard selector */}
        <div className="gap-1 md:gap-3 relative md:pb-2 grid grid-cols-2">
          <button
            type="button"
            onClick={() => setSelectedStandard(Standard.ERC20)}
            className={clsx(
              "*:z-10 flex flex-col gap-1 px-3 py-2.5 rounded-2 before:absolute before:rounded-3 before:w-full before:h-full before:left-0 before:top-0 before:duration-200 relative before:bg-gradient-to-r before:from-green-bg before:to-green-bg/0 text-12 group bg-gradient-to-r from-primary-bg to-secondary-bg md:rounded-b-0 md:before:rounded-b-0",
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
                "block text-left",
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
              "*:z-10 flex flex-col gap-1 px-3 py-2.5 rounded-2 before:absolute before:rounded-3 before:w-full before:h-full before:left-0 before:top-0 before:duration-200 relative before:bg-gradient-to-r before:from-green-bg before:to-green-bg/0 text-12 group before:rotate-180 items-end bg-gradient-to-l from-primary-bg to-secondary-bg md:rounded-b-0 md:before:rounded-t-0",
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
                "block text-right",
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
          <div className="py-1 px-3 text-12 bg-gradient-to-r from-primary-bg to-secondary-bg rounded-bl-2 text-tertiary-text max-md:hidden">
            ~385K gas
          </div>
          <div className="py-1 px-3 text-12 bg-gradient-to-l from-primary-bg to-secondary-bg rounded-br-2 text-right text-tertiary-text max-md:hidden ml-auto">
            ~115K gas
          </div>
        </div>
      </div>

      <GasSettingsBlock />

      {/* Action button */}
      <Button
        fullWidth
        size={ButtonSize.LARGE}
        colorScheme={ButtonColor.GREEN}
        onClick={handleStakeUnstake}
        disabled={!amount || parseFloat(amount) === 0}
      >
        {title}
      </Button>
    </div>
  );

  const renderApprovingState = () => (
    <div className="space-y-5">
      {/* Amount display */}
      <div className="bg-tertiary-bg rounded-3 p-5">
        <div className="text-secondary-text text-14 mb-1">
          {isStaking ? "Stake" : "Unstake"} amount
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-24 font-bold text-primary-text">{amount || "0.00"}</div>
            <div className="text-14 text-secondary-text">$50.00</div>
          </div>
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo-short.svg"
              width={32}
              height={32}
              alt="D223"
              className="w-8 h-8 group flex items-center gap-2 duration-200 text-base text-primary-text bg-primary-bg hocus:text-primary-text rounded-[80px] border border-transparent hocus:bg-green-bg hocus:shadow shadow-green/60 hocus:border-green px-2 min-h-8 flex-shrink-0"
            />
            <div className="flex flex-col gap-1">
              <span className="text-primary-text text-16 font-medium group-hover:text-green transition-colors duration-200">
                D223
              </span>
              <div className="px-2 py-0.5 bg-quaternary-bg rounded-2 text-10 text-secondary-text">
                {selectedStandard}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-t border-secondary-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-quaternary-bg">
              <Preloader size={16} color="green" />
            </div>
            <span className="text-primary-text text-14">Approved</span>
          </div>
          <div className="text-secondary-text text-12">Proceed in your wallet</div>
        </div>
      </div>
    </div>
  );

  const renderConfirmingState = () => (
    <div className="space-y-5">
      {/* Amount display */}
      <div className="bg-tertiary-bg rounded-3 p-5">
        <div className="text-secondary-text text-14 mb-1">
          {isStaking ? "Stake" : "Unstake"} amount
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-24 font-bold text-primary-text">{amount || "0.00"}</div>
            <div className="text-14 text-secondary-text">$50.00</div>
          </div>
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo-short.svg"
              width={32}
              height={32}
              alt="D223"
              className="w-8 h-8"
            />
            <div className="flex flex-col gap-1">
              <span className="text-primary-text text-16 font-medium">D223</span>
              <div className="px-2 py-0.5 bg-quaternary-bg rounded-2 text-10 text-secondary-text">
                {selectedStandard}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {isStaking && selectedStandard === Standard.ERC20 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green">
                <Svg iconName="check" size={16} className="text-white" />
              </div>
              <span className="text-primary-text text-14">Approved</span>
            </div>
            <Svg iconName="forward" size={20} className="text-secondary-text" />
          </div>
        )}

        <div className="flex items-center justify-between py-2 border-t border-secondary-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-quaternary-bg">
              <Preloader size={16} color="green" />
            </div>
            <span className="text-primary-text text-14">
              Confirm {isStaking ? "stake" : "unstaking"}
            </span>
          </div>
          <div className="text-secondary-text text-12">Proceed in your wallet</div>
        </div>
      </div>

      {/* Bottom notification */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md md:max-w-lg bg-tertiary-bg border border-secondary-border rounded-3 px-4 py-3 shadow-lg z-50">
        <div className="flex items-center gap-2 text-14 text-primary-text">
          <Svg iconName="info" size={20} className="text-blue flex-shrink-0" />
          <span>Please confirm action in your wallet</span>
        </div>
      </div>
    </div>
  );

  const renderExecutingState = () => (
    <div className="space-y-5">
      {/* Amount display */}
      <div className="bg-tertiary-bg rounded-3 p-5">
        <div className="text-secondary-text text-14 mb-1">
          {isStaking ? "Stake" : "Unstake"} amount
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-24 font-bold text-primary-text">{amount || "0.00"}</div>
            <div className="text-14 text-secondary-text">$50.00</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="group flex items-center gap-2 duration-200 text-base text-primary-text bg-primary-bg hocus:text-primary-text rounded-full border border-transparent hocus:bg-green-bg hocus:shadow shadow-green/60 hocus:border-green">
              <Image
                src="/images/logo-short.svg"
                width={32}
                height={32}
                alt="D223"
                className="w-8 h-8"
              />
            </div>
            <span className="text-primary-text text-16 font-medium group-hover:text-green transition-colors duration-200">
              D223
            </span>
            <div className="flex flex-col gap-1">
              <div className="px-2 py-0.5 bg-quaternary-bg rounded-2 text-10 text-secondary-text">
                {selectedStandard}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {isStaking && selectedStandard === Standard.ERC20 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green">
                <Svg iconName="check" size={16} className="text-white" />
              </div>
              <span className="text-primary-text text-14">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <Svg iconName="forward" size={20} className="text-secondary-text" />
              <div className="w-6 h-6 bg-green rounded-full flex items-center justify-center">
                <Svg iconName="check" size={14} className="text-white" />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between py-2 border-t border-secondary-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-quaternary-bg">
              <Svg iconName="wallet" size={16} className="text-secondary-text" />
            </div>
            <span className="text-primary-text text-14">
              Executing {isStaking ? "staking" : "unstaking"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-green-bg text-green text-12 rounded-2 hover:bg-green/20 transition-colors font-medium border border-green">
              Speed up
            </button>
            <Svg iconName="forward" size={20} className="text-secondary-text" />
            <Preloader size={24} color="green" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="space-y-5">
      {/* Success display */}
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-green rounded-full flex items-center justify-center mx-auto mb-4">
          <Svg iconName="check" size={32} className="text-white" />
        </div>
        <h3 className="text-20 font-bold text-primary-text mb-2">
          Successfully {isStaking ? "staked" : "unstaked"}
        </h3>
        <p className="text-16 text-secondary-text">{amount} D223</p>
      </div>

      {/* Steps */}
      <div className="space-y-3 border-t border-secondary-border pt-4">
        {isStaking && selectedStandard === Standard.ERC20 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green">
                <Svg iconName="check" size={16} className="text-white" />
              </div>
              <span className="text-primary-text text-14">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <Svg iconName="forward" size={20} className="text-secondary-text" />
              <div className="w-6 h-6 bg-green rounded-full flex items-center justify-center">
                <Svg iconName="check" size={14} className="text-white" />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green">
              <Svg iconName="check" size={16} className="text-white" />
            </div>
            <span className="text-primary-text text-14">
              Successfully {isStaking ? "staked" : "unstaked"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Svg iconName="forward" size={20} className="text-secondary-text" />
            <div className="w-6 h-6 bg-green rounded-full flex items-center justify-center">
              <Svg iconName="check" size={14} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="space-y-5">
      {/* Error display */}
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-red rounded-full flex items-center justify-center mx-auto mb-4">
          <Svg iconName="warning" size={32} className="text-white" />
        </div>
        <h3 className="text-20 font-bold text-red-light mb-2">
          Failed to {isStaking ? "stake" : "unstake"}
        </h3>
        <p className="text-16 text-secondary-text">{amount} D223</p>
      </div>

      {/* Steps */}
      <div className="space-y-3 border-t border-secondary-border pt-4">
        {isStaking && selectedStandard === Standard.ERC20 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green">
                <Svg iconName="check" size={16} className="text-white" />
              </div>
              <span className="text-primary-text text-14">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <Svg iconName="forward" size={20} className="text-secondary-text" />
              <div className="w-6 h-6 bg-green rounded-full flex items-center justify-center">
                <Svg iconName="check" size={14} className="text-white" />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-light">
              <Svg iconName="warning" size={16} className="text-white" />
            </div>
            <span className="text-primary-text text-14">
              Failed to {isStaking ? "stake" : "unstake"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Svg iconName="forward" size={20} className="text-secondary-text" />
            <div className="w-6 h-6 bg-red-light rounded-full flex items-center justify-center">
              <Svg iconName="warning" size={14} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      <div className="bg-red-light/10 border border-red-light/30 rounded-3 p-4">
        <p className="text-14 text-red-light group-hover:text-red transition-colors duration-200 break-words">
          {data?.errorMessage || "Transaction failed. Please try again."}
        </p>
      </div>

      {/* Try again button */}
      <Button
        fullWidth
        size={ButtonSize.LARGE}
        colorScheme={ButtonColor.GREEN}
        onClick={handleTryAgain}
      >
        Try again
      </Button>
    </div>
  );

  const renderContent = () => {
    switch (state) {
      case "initial":
        return renderInitialState();
      case "approving":
        return renderApprovingState();
      case "confirming":
        return renderConfirmingState();
      case "executing":
        return renderExecutingState();
      case "success":
        return renderSuccessState();
      case "error":
        return renderErrorState();
      default:
        return renderInitialState();
    }
  };

  if (!isOpen) return null;

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={closeDialog}>
      <DialogHeader onClose={closeDialog} title={title} />

      <div className="w-full md:w-[600px] p-5 md:p-6">{renderContent()}</div>
    </DrawerDialog>
  );
};

export default StakeDialog;
