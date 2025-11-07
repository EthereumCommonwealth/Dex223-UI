"use client";

import clsx from "clsx";
import Image from "next/image";
import React, { useEffect, useState } from "react";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import GasSettingsBlock from "@/components/common/GasSettingsBlock";
import { Standard } from "@/sdk_bi/standard";

import { useClaimDialogStore } from "../stores/useClaimDialogStore";

const SingleClaimDialog = () => {
  const { isOpen, state, data, closeDialog, setState, setError, setData } = useClaimDialogStore();

  const [selectedStandard, setSelectedStandard] = useState<"ERC-20" | "ERC-223">("ERC-223");

  useEffect(() => {
    if (data?.selectedStandard) {
      setSelectedStandard(data.selectedStandard === "ERC-20" ? Standard.ERC20 : Standard.ERC223);
    }
  }, [data?.selectedStandard]);

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

  const renderInitialState = () => (
    <div className="space-y-4">
      {/* Rewards to receive */}
      <div className="bg-tertiary-bg rounded-3 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-primary-text text-14">Rewards to receive:</span>
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

      {/* Standard selection */}
      <div className="bg-tertiary-bg rounded-3 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-primary-text text-14">Standard for {token.symbol}</span>
          <div
            className="w-4 h-4 bg-secondary-border rounded-full flex items-center justify-center cursor-help"
            title="Select the token standard for claiming"
          >
            <Svg iconName="info" size={12} className="text-secondary-text" />
          </div>
        </div>
        <div className="flex gap-2">
          {(["ERC-20", "ERC-223"] as const).map((standard) => (
            <button
              key={standard}
              onClick={() => setSelectedStandard(standard)}
              className={clsx(
                "flex-1 h-10 px-4 rounded-2 text-14 font-medium transition-all duration-200 flex items-center justify-center gap-2",
                selectedStandard === standard
                  ? "bg-green-bg border border-green text-green"
                  : "bg-quaternary-bg border border-secondary-border text-secondary-text hover:bg-tertiary-bg hover:text-primary-text",
              )}
            >
              <div
                className={clsx(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  selectedStandard === standard
                    ? "border-green bg-green"
                    : "border-secondary-border",
                )}
              >
                {selectedStandard === standard && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              {standard}
            </button>
          ))}
        </div>
      </div>

      <GasSettingsBlock />

      {/* Claim button */}
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

  const renderConfirmingState = () => (
    <div className="space-y-5">
      {/* Claim amount display */}
      <div className="bg-tertiary-bg rounded-3 p-5">
        <div className="text-secondary-text text-14 mb-1">Claim amount</div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-24 font-bold text-primary-text mb-1">{token.amount}</div>
            <div className="text-14 text-secondary-text">
              ${parseFloat(token.amountUSD.replace(/[$,]/g, "")).toFixed(3)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Image
              src={token.logoURI || "/images/tokens/placeholder.svg"}
              width={32}
              height={32}
              alt={token.symbol}
              className="w-8 h-8"
            />
            <div className="flex flex-col gap-1">
              <span className="text-primary-text text-16 font-medium">{token.symbol}</span>
              <Badge
                variant={BadgeVariant.STANDARD}
                standard={selectedStandard === "ERC-20" ? Standard.ERC20 : Standard.ERC223}
                size="small"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation section */}
      <div className="border-t border-secondary-border pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-quaternary-bg rounded-full flex items-center justify-center">
              <Svg iconName="wallet" size={20} className="text-secondary-text" />
            </div>
            <span className="text-primary-text text-16">Confirm claim</span>
          </div>
          <div className="flex items-center gap-2 text-secondary-text text-14">
            <Svg iconName="more" size={16} />
            <span className="hidden xs:inline">Proceed in your wallet</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExecutingState = () => (
    <div className="space-y-5">
      {/* Claim amount display */}
      <div className="bg-tertiary-bg rounded-3 p-5">
        <div className="text-secondary-text text-14 mb-1">Claim amount</div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-24 font-bold text-primary-text mb-1">{token.amount}</div>
            <div className="text-14 text-secondary-text">
              ${parseFloat(token.amountUSD.replace(/[$,]/g, "")).toFixed(3)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Image
              src={token.logoURI || "/images/tokens/placeholder.svg"}
              width={32}
              height={32}
              alt={token.symbol}
              className="w-8 h-8"
            />
            <div className="flex flex-col gap-1">
              <span className="text-primary-text text-16 font-medium">{token.symbol}</span>
              <Badge
                variant={BadgeVariant.STANDARD}
                standard={selectedStandard === "ERC-20" ? Standard.ERC20 : Standard.ERC223}
                size="small"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Executing claim section */}
      <div className="border-t border-secondary-border pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-quaternary-bg rounded-full flex items-center justify-center">
              <Svg iconName="wallet" size={20} className="text-secondary-text" />
            </div>
            <span className="text-primary-text text-16">Executing claim</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-green text-white text-12 rounded-2 hover:bg-green/90 transition-colors font-medium">
              Speed up
            </button>
            <button className="text-secondary-text hover:text-primary-text transition-colors">
              <Svg iconName="forward" size={20} />
            </button>
            <div className="w-6 h-6 border-2 border-green border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="space-y-5">
      {/* Success confirmation */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center mx-auto mb-4">
          <div className="w-16 h-16 bg-green rounded-full flex items-center justify-center">
            <Svg iconName="check" size={32} className="text-white" />
          </div>
        </div>
        <h3 className="text-20 font-bold text-primary-text mb-2">Successfully claimed</h3>
        <p className="text-16 text-secondary-text">
          {token.amount} {token.symbol}
        </p>
      </div>

      {/* Transaction details */}
      <div className="border-t border-secondary-border pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green rounded-full flex items-center justify-center">
              <Svg iconName="check" size={24} className="text-white" />
            </div>
            <span className="text-primary-text text-16">Successfully claimed</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-secondary-text hover:text-primary-text transition-colors">
              <Svg iconName="forward" size={20} />
            </button>
            <div className="w-6 h-6 bg-green rounded-full flex items-center justify-center">
              <Svg iconName="check" size={16} className="text-white" />
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
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Svg iconName="warning" size={32} className="text-white" />
        </div>
        <h3 className="text-20 font-bold text-red-500 mb-2">Claim failed</h3>
        <p className="text-16 text-secondary-text">
          {token.amount} {token.symbol}
        </p>
      </div>

      {/* Error details */}
      <div className="border-t border-secondary-border pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <Svg iconName="warning" size={24} className="text-white" />
            </div>
            <span className="text-primary-text text-16">Claim failed</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-secondary-text hover:text-primary-text transition-colors">
              <Svg iconName="forward" size={20} />
            </button>
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <Svg iconName="warning" size={16} className="text-white" />
            </div>
          </div>
        </div>

        {/* Error message */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-3 p-4">
          <p className="text-14 text-red-500">{data?.errorMessage}</p>
        </div>
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
    <DrawerDialog isOpen={isOpen} setIsOpen={closeDialog}>
      <DialogHeader onClose={closeDialog} title="Claim" />

      <div className="w-full md:w-[500px] p-5 md:p-6">{renderContent()}</div>
    </DrawerDialog>
  );
};

export default SingleClaimDialog;
