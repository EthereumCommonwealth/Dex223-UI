"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import GasSettingsBlock from "@/components/common/GasSettingsBlock";
import { StandardButton } from "@/components/common/TokenStandardSelector";
import { ThemeColors } from "@/config/theme/colors";
import { clsxMerge } from "@/functions/clsxMerge";
import { Standard } from "@/sdk_bi/standard";

import { useClaimDialogStore } from "../stores/useClaimDialogStore";

const MultipleClaimDialog = () => {
  const { isOpen, state, data, closeDialog, setState, setError, setData, setTokenStandard } =
    useClaimDialogStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [globalStandard, setGlobalStandard] = useState<Standard>(Standard.ERC223);

  // Only show this dialog for multiple token claims
  if (!isOpen || !data || !data.isMultiple) return null;

  const tokens = data.selectedTokens;
  const tokenCount = tokens.length;

  // Filter tokens based on search query
  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.erc20Address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.erc223Address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleClaim = async () => {
    try {
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

  const handleStandardChange = (standard: Standard) => {
    setGlobalStandard(standard);
    tokens.forEach((token) => {
      setTokenStandard(token.id, standard);
    });
  };

  const handleTokenStandardChange = (tokenId: number, standard: Standard) => {
    setTokenStandard(tokenId, standard);
  };

  const renderInitialState = () => (
    <div className="space-y-4">
      <div className="bg-tertiary-bg rounded-3 p-4">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-primary-text text-14">
            Rewards to receive: <span className="font-bold">{tokenCount} tokens</span>
          </span>
          <span className="text-primary-text">(${data.totalReward.toFixed(2)})</span>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search name or paste address"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 bg-tertiary-bg border border-secondary-border rounded-3 px-4 pr-10 text-14 text-primary-text placeholder:text-tertiary-text focus:outline-none focus:border-green transition-colors"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Svg iconName="search" size={20} className="text-tertiary-text" />
        </div>
      </div>

      <div className="bg-tertiary-bg rounded-3 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-primary-text text-14">Tokens to claim</span>
          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-12">Standard for all tokens</span>
            <div className="flex items-center gap-1">
              <div
                className={clsxMerge(
                  "mx-auto z-10 text-10 w-[calc(100%-24px)] h-[32px] rounded-20 border p-1 flex gap-1 items-center md:w-auto",
                  ThemeColors.GREEN ? "border-green" : "border-purple",
                  false && "border-secondary-border",
                )}
              >
                {[Standard.ERC20, Standard.ERC223].map((standard) => {
                  return (
                    <StandardButton
                      colorScheme={ThemeColors.GREEN}
                      key={standard}
                      handleStandardSelect={() => handleStandardChange(standard)}
                      standard={standard}
                      selectedStandard={standard}
                      disabled={false}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
          {filteredTokens.map((token) => {
            const tokenStandard = data.tokenStandards?.[token.id] || globalStandard;

            return (
              <div
                key={token.id}
                className="flex items-center justify-between p-3 bg-quaternary-bg rounded-2 hover:bg-primary-bg/5 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Image
                    src={token.logoURI || "/images/tokens/placeholder.svg"}
                    width={24}
                    height={24}
                    alt={token.symbol}
                    className="w-6 h-6 flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-primary-text text-14 font-medium truncate">
                      {token.symbol}
                    </span>
                    <span className="text-tertiary-text text-12 truncate">
                      {token.amount} {token.symbol}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-primary-text text-14 font-medium">{token.amountUSD}</span>
                  <div
                    className={clsxMerge(
                      "mx-auto z-10 text-10 w-[calc(100%-24px)] h-[32px] rounded-20 border p-1 flex gap-1 items-center md:w-auto",
                      ThemeColors.GREEN ? "border-green" : "border-purple",
                      false && "border-secondary-border",
                    )}
                  >
                    {[Standard.ERC20, Standard.ERC223].map((standard) => {
                      return (
                        <StandardButton
                          colorScheme={ThemeColors.GREEN}
                          key={standard}
                          handleStandardSelect={() => handleTokenStandardChange(token.id, standard)}
                          standard={standard}
                          selectedStandard={tokenStandard as Standard}
                          disabled={false}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <GasSettingsBlock />

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
      <div className="bg-tertiary-bg rounded-3 p-5">
        <div className="text-secondary-text text-14 mb-1">Claim amount</div>
        <div className="flex items-center gap-2">
          <div>
            <div className="text-24 font-bold text-primary-text mb-1">{tokenCount} tokens</div>
            <div className="text-14 text-secondary-text">(${data.totalReward.toFixed(2)})</div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={BadgeVariant.STANDARD} standard={Standard.ERC20} size="small" />
            <Badge variant={BadgeVariant.STANDARD} standard={Standard.ERC223} size="small" />
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
        <div className="flex items-center gap-2">
          <div>
            <div className="text-24 font-bold text-primary-text mb-1">{tokenCount} tokens</div>
            <div className="text-14 text-secondary-text">(${data.totalReward.toFixed(2)})</div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={BadgeVariant.STANDARD} standard={Standard.ERC20} size="small" />
            <Badge variant={BadgeVariant.STANDARD} standard={Standard.ERC223} size="small" />
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
          {tokenCount} tokens (${data.totalReward.toFixed(2)})
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
          {tokenCount} tokens (${data.totalReward.toFixed(2)})
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

      <div className="w-full md:w-[600px] p-5 md:p-6">{renderContent()}</div>
    </DrawerDialog>
  );
};

export default MultipleClaimDialog;
