"use client";

import Preloader from "@repo/ui/preloader";
import clsx from "clsx";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonColor, ButtonSize, ButtonVariant } from "@/components/buttons/Button";
import IconButton from "@/components/buttons/IconButton";
import GasSettingsBlock from "@/components/common/GasSettingsBlock";
import NetworkFeeConfigDialog from "@/components/dialogs/NetworkFeeConfigDialog";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { Standard } from "@/sdk_bi/standard";
import { useConfirmInWalletAlertStore } from "@/stores/useConfirmInWalletAlertStore";

import {
  useClaimGasLimitStore,
  useClaimGasModeStore,
  useClaimGasPrice,
  useClaimGasPriceStore,
} from "../stores/useClaimGasSettingsStore";
import { useClaimDialogStore } from "../stores/useClaimDialogStore";
import { addNotification } from "@/other/notification";
import {
  RecentTransactionStatus,
  RecentTransactionTitleTemplate,
} from "@/stores/useRecentTransactionsStore";

const SingleClaimDialog = () => {
  const { isOpen, state, data, closeDialog, setState, setError, setData } = useClaimDialogStore();
  const chainId = useCurrentChainId();
  const { openConfirmInWalletAlert, closeConfirmInWalletAlert } = useConfirmInWalletAlertStore();

  const [selectedStandard, setSelectedStandard] = useState<Standard>(Standard.ERC223);
  const [isGasSettingsOpen, setIsGasSettingsOpen] = useState(false);

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
  const gasToUse = customGasLimit || estimatedGas || BigInt(115000); // Default gas limit for ERC223
  const notificationShownRef = useRef<string | null>(null);

  useEffect(() => {
    if (data?.selectedStandard) {
      setSelectedStandard(data.selectedStandard === "ERC-20" ? Standard.ERC20 : Standard.ERC223);
    }
  }, [data?.selectedStandard]);

  useEffect(() => {
    if (isOpen) {
      updateDefaultState(chainId);
    }
  }, [chainId, isOpen, updateDefaultState]);

  // Show/hide bottom alert for confirming state
  useEffect(() => {
    if (state === "confirming" && isOpen) {
      openConfirmInWalletAlert("Please confirm action in your wallet");
    } else {
      closeConfirmInWalletAlert();
    }

    return () => {
      closeConfirmInWalletAlert();
    };
  }, [state, isOpen, openConfirmInWalletAlert, closeConfirmInWalletAlert]);

  // Show notifications for success/error states
  useEffect(() => {
    if (!data || data.isMultiple || (state !== "success" && state !== "error")) {
      notificationShownRef.current = null;
      return;
    }

    const token = data.selectedTokens?.[0];
    if (!token) return;

    // Prevent duplicate notifications
    const notificationKey = `${state}-${token.symbol}-${token.amount}`;
    if (notificationShownRef.current === notificationKey) return;
    notificationShownRef.current = notificationKey;

    const notificationTitle: {
      template: RecentTransactionTitleTemplate.CLAIM;
      symbol: string;
      amount: string;
      logoURI: string;
    } = {
      template: RecentTransactionTitleTemplate.CLAIM,
      symbol: token.symbol,
      amount: token.amount,
      logoURI: token.logoURI || "/images/tokens/placeholder.svg",
    };

    if (state === "success") {
      addNotification(notificationTitle, RecentTransactionStatus.SUCCESS);
    } else if (state === "error") {
      addNotification(notificationTitle, RecentTransactionStatus.ERROR);
    }
  }, [state, data]);

  // Only show this dialog for single token claims
  if (!isOpen || !data || data.isMultiple) return null;

  const token = data.selectedTokens[0];
  if (!token) return null;

  const handleClaim = async () => {
    try {
      // Update the selected standard in the store
      setData({ selectedStandard: selectedStandard === Standard.ERC20 ? "ERC-20" : "ERC-223" });

      // Set confirming state
      setState("confirming");

      // Simulate wallet confirmation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Set executing state
      setState("executing");

      // Simulate transaction execution
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Simulate success (90% success rate for demo)
      if (Math.random() > 0.1) {
        setState("success");
      } else {
        setError(
          "Transaction failed because the gas limit is too low. Adjust your wallet settings. If you still have issues, click common errors",
        );
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleTryAgain = () => {
    setState("initial");
  };

  const renderInitialState = () => {
    const gasLimitERC20 = 329000;
    const gasLimitERC223 = 115000;
    const gasPriceGwei = 33.53;
    const networkFeeERC20 = 0.0031;
    const networkFeeERC223 = 0.0011;
    const currentGasLimit = selectedStandard === Standard.ERC20 ? gasLimitERC20 : gasLimitERC223;
    const currentNetworkFee = selectedStandard === Standard.ERC20 ? networkFeeERC20 : networkFeeERC223;

    return (
      <div className="space-y-4">
        <div className="bg-tertiary-bg rounded-3 px-4 h-12 flex items-center">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-tertiary-text text-14">Rewards to receive:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Image
                src={token.logoURI || "/images/tokens/placeholder.svg"}
                width={24}
                height={24}
                alt={token.symbol}
                className="w-6 h-6"
              />
              <span className="text-primary-text text-16 font-medium">
                {token.amount} {token.symbol}
              </span>
              <span className="text-secondary-text text-14">
                (${parseFloat(token.amountUSD.replace(/[$,]/g, "")).toFixed(3)})
              </span>
            </div>
          </div>
        </div>

        <div className="bg-tertiary-bg rounded-3 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-secondary-text text-14">Standard for {token.symbol}</span>
            <Svg iconName="info" size={24} className="text-tertiary-text" />
          </div>
          <div className="flex gap-2">
            {[Standard.ERC20, Standard.ERC223].map((standard) => {
              const isSelected = selectedStandard === standard;
              return (
                <button
                  key={standard}
                  onClick={() => setSelectedStandard(standard)}
                  className={clsx(
                    "flex-1 h-10 px-4 rounded-2 text-14 font-medium transition-all duration-200 flex items-center justify-center gap-2 group",
                    isSelected
                      ? "bg-green-bg border border-green text-green"
                      : "bg-quaternary-bg border border-secondary-border text-secondary-text hover:bg-tertiary-bg hover:text-primary-text",
                  )}
                >
                  <div
                    className={clsx(
                      "w-4 h-4 duration-200 before:duration-200 border bg-secondary-bg rounded-full before:content-[''] before:w-2.5 before:h-2.5 before:absolute before:top-1/2 before:rounded-full before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 relative",
                      isSelected
                        ? "border-green before:bg-green"
                        : "border-secondary-border group-hocus:border-green",
                    )}
                  />
                  {standard}
                </button>
              );
            })}
          </div>
        </div>

        <GasSettingsBlock
          gasPrice={gasPrice}
          gasLimit={gasToUse}
          gasPriceOption={gasPriceOption}
          onEditClick={() => setIsGasSettingsOpen(true)}
        />

        <Button
          fullWidth
          size={ButtonSize.LARGE}
          colorScheme={ButtonColor.GREEN}
          onClick={handleClaim}
        >
          Claim
        </Button>
      </div>
    );
  };

  const renderConfirmingState = () => (
    <div className="space-y-5">
      {/* Claim amount display */}
      <div className="rounded-3 bg-tertiary-bg py-4 px-5 flex flex-col gap-1 h-[88px] justify-center">
        <p className="text-secondary-text text-14">Claim amount</p>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-20 font-normal text-primary-text">{token.amount}</span>
            <p className="text-secondary-text text-14">
              ${parseFloat(token.amountUSD.replace(/[$,]/g, "")).toFixed(3)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Image
              src={token.logoURI || "/images/tokens/placeholder.svg"}
              width={32}
              height={32}
              alt={token.symbol}
            />
            <span className="text-primary-text text-16 font-medium">{token.symbol}</span>
            <Badge
              variant={BadgeVariant.STANDARD}
              standard={selectedStandard}
              size="small"
            />
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-secondary-border" style={{ marginTop: '20px' }} />

      {/* Confirmation section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-quaternary-bg rounded-full flex items-center justify-center">
            <Svg iconName="arrow-left-down" size={20} className="text-green" />
          </div>
          <span className="text-primary-text text-16">Confirm claim</span>
        </div>
        <div className="flex items-center gap-2">
          <Preloader type="linear" />
          <span className="text-secondary-text text-14">Proceed in your wallet</span>
        </div>
      </div>
    </div>
  );

  const renderExecutingState = () => (
    <div className="space-y-5">
      {/* Claim amount display */}
      <div className="rounded-3 bg-tertiary-bg py-4 px-5 flex flex-col gap-1 h-[88px] justify-center">
        <p className="text-secondary-text text-14">Claim amount</p>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-20 font-normal text-primary-text">{token.amount}</span>
            <p className="text-secondary-text text-14">
              ${parseFloat(token.amountUSD.replace(/[$,]/g, "")).toFixed(3)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Image
              src={token.logoURI || "/images/tokens/placeholder.svg"}
              width={32}
              height={32}
              alt={token.symbol}
              className="w-8 h-8"
            />
            <div className="flex flex-row items-center gap-2">
              <span className="text-primary-text text-16 font-medium">{token.symbol}</span>
              <Badge
                variant={BadgeVariant.STANDARD}
                standard={selectedStandard}
                size="small"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-secondary-border" style={{ marginTop: '20px' }} />

      {/* Executing claim section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-quaternary-bg rounded-full flex items-center justify-center">
            <Svg iconName="arrow-left-down" size={20} className="text-green" />
          </div>
          <span className="text-primary-text text-16">Executing claim</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
             size={ButtonSize.EXTRA_SMALL}
             colorScheme={ButtonColor.LIGHT_GREEN}
          >
            Speed up
          </Button>
          <IconButton iconName="forward" />
          <Preloader size={20} />
        </div>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="space-y-5">
      {/* Success confirmation */}
      <div className="flex flex-col items-center py-3">
        <div className="mx-auto w-[80px] h-[80px] flex items-center justify-center relative mb-5">
          <div className="w-[54px] h-[54px] rounded-full border-[7px] blur-[8px] opacity-80 border-green" />
          <Svg
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green"
            iconName="success"
            size={65}
          />
        </div>
        <h3 className="text-20 font-bold text-primary-text mb-2">Successfully claimed</h3>
        <p className="text-16 text-primary-text mb-6">
          {token.amount} {token.symbol}
        </p>
      </div>

      <div className="h-px w-full bg-secondary-border mb-2" style={{ marginTop: '20px' }} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-bg rounded-full flex items-center justify-center">
              <Svg iconName="arrow-left-down" size={20} className="text-green" />
            </div>
            <span className="text-primary-text text-16">Successfully claimed</span>
          </div>
          <div className="flex items-center gap-2">
            <IconButton iconName="forward" />
            <div className="w-5 h-5 rounded-full bg-green flex items-center justify-center flex-shrink-0">
              <Svg className="text-primary-bg" iconName="check" size={14} />
            </div>
          </div>
        </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="space-y-4">
      {/* Error display */}
      <div className="flex flex-col items-center py-3">
        <div className="flex items-center justify-center mx-auto mb-5">
          <Svg className="text-red-light" iconName="warning" size={64} />
        </div>
        <h3 className="text-20 font-bold text-red-light mb-2">Claim failed</h3>
        <p className="text-16 text-primary-text mb-6">
          {token.amount} {token.symbol}
        </p>
      </div>

      <div className="h-px w-full bg-secondary-border mb-5" style={{ marginTop: '20px' }} />

      {/* Error details */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-light/20 rounded-full flex items-center justify-center">
            <Svg iconName="arrow-left-down" size={20} className="text-red-light" />
          </div>
          <span className="text-primary-text text-16">Claim failed</span>
        </div>
        <div className="flex items-center gap-2">
          <IconButton iconName="forward" />
          <Svg className="text-red-light" iconName="warning" size={20} />
        </div>
      </div>

      {/* Error message */}
      <div className="bg-red-light/10 border border-red-light/30 rounded-3 p-4 mb-4">
        <p className="text-14 text-secondary-text">
          {data?.errorMessage || "Transaction failed because the gas limit is too low. Adjust your wallet settings. If you still have issues, click "}
          {!data?.errorMessage && (
            <a href="#" className="text-secondary-text underline">
              common errors
            </a>
          )}
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

  return (
    <>
      <DrawerDialog isOpen={isOpen} setIsOpen={closeDialog}>
        <div className="bg-primary-bg rounded-5 w-full sm:w-[600px]">
          <DialogHeader onClose={closeDialog} title="Claim" />
          <div className="card-spacing">{renderContent()}</div>
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

export default SingleClaimDialog;
