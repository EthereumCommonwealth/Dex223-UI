"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

import Preloader from "@repo/ui/preloader";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import IconButton from "@/components/buttons/IconButton";
import GasSettingsBlock from "@/components/common/GasSettingsBlock";
import NetworkFeeConfigDialog from "@/components/dialogs/NetworkFeeConfigDialog";
import { StandardButton } from "@/components/common/TokenStandardSelector";
import { ThemeColors } from "@/config/theme/colors";
import { clsxMerge } from "@/functions/clsxMerge";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { Standard } from "@/sdk_bi/standard";

import {
  useClaimGasLimitStore,
  useClaimGasModeStore,
  useClaimGasPrice,
  useClaimGasPriceStore,
} from "../stores/useClaimGasSettingsStore";
import { useClaimDialogStore } from "../stores/useClaimDialogStore";
import { SearchInput } from "@/components/atoms/Input";
import { addNotification } from "@/other/notification";
import {
  RecentTransactionStatus,
  RecentTransactionTitleTemplate,
} from "@/stores/useRecentTransactionsStore";

const MultipleClaimDialog = () => {
  const { isOpen, state, data, closeDialog, setState, setError, setData, setTokenStandard } =
    useClaimDialogStore();
  const chainId = useCurrentChainId();

  const [searchQuery, setSearchQuery] = useState("");
  const [globalStandard, setGlobalStandard] = useState<Standard>(Standard.ERC223);
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
  const gasToUse = customGasLimit || estimatedGas || BigInt(115000); // Default gas limit
  const notificationShownRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      updateDefaultState(chainId);
    }
  }, [chainId, isOpen, updateDefaultState]);

  // Show notifications for success/error states
  useEffect(() => {
    if (!data || !data.isMultiple || (state !== "success" && state !== "error")) {
      notificationShownRef.current = null;
      return;
    }

    // Prevent duplicate notifications
    const notificationKey = `${state}-${data.totalReward}`;
    if (notificationShownRef.current === notificationKey) return;
    notificationShownRef.current = notificationKey;

    const tokens = data.selectedTokens;
    if (!tokens || tokens.length === 0) return;

    const firstToken = tokens[0];
    const tokenCount = tokens.length;

    const notificationTitle: {
      template: RecentTransactionTitleTemplate.CLAIM;
      symbol: string;
      amount: string;
      logoURI: string;
    } = {
      template: RecentTransactionTitleTemplate.CLAIM,
      symbol: tokenCount > 1 ? `${tokenCount} tokens` : firstToken.symbol,
      amount: tokenCount > 1 ? data.totalReward.toFixed(2) : firstToken.amount,
      logoURI: firstToken.logoURI || "/images/tokens/placeholder.svg",
    };

    if (state === "success") {
      addNotification(notificationTitle, RecentTransactionStatus.SUCCESS);
    } else if (state === "error") {
      addNotification(notificationTitle, RecentTransactionStatus.ERROR);
    }
  }, [state, data]);

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
      <div className="bg-tertiary-bg rounded-3 px-4 h-12 flex items-center">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-tertiary-text text-14">Rewards to receive:</span>
          <span className="text-primary-text text-14 font-bold">{tokenCount} tokens</span>
          <span className="text-secondary-text text-14">(${data.totalReward.toFixed(2)})</span>
        </div>
      </div>

      <div className="relative">
        <SearchInput 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          placeholder="Search name or paste address"
          className="h-12 text-14 border-secondary-border rounded-3"
        />
      </div>

      {filteredTokens.length > 0 ? (
        <div className="bg-tertiary-bg rounded-3 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-secondary-text text-14 font-bold">Tokens to claim</span>
            <div className="flex items-center gap-2 mr-3">
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
                  className="flex items-center gap-3 p-3 bg-quaternary-bg rounded-2 hover:bg-primary-bg/5 transition-colors"
                >
                  {/* Token icon and name */}
                  <div className="flex items-center gap-2 min-w-0 flex-shrink-0" style={{ width: '160px' }}>
                    <Image
                      src={token.logoURI || "/images/tokens/placeholder.svg"}
                      width={24}
                      height={24}
                      alt={token.symbol}
                      className="w-6 h-6 flex-shrink-0"
                    />
                    <span className="text-primary-text text-14 font-medium truncate">
                      {token.name}
                    </span>
                  </div>

                  {/* Token amount */}
                  <div className="flex-1 min-w-0">
                    <span className="text-primary-text text-14">
                      {token.amount} {token.symbol}
                    </span>
                  </div>

                  {/* USD value */}
                  <div className="flex-shrink-0" style={{ width: '120px' }}>
                    <span className="text-primary-text text-14 font-medium">{token.amountUSD}</span>
                  </div>

                  {/* Standard toggle */}
                  <div className="flex-shrink-0">
                    <div
                      className={clsxMerge(
                        "z-10 text-10 h-[32px] rounded-20 border p-1 flex gap-1 items-center",
                        ThemeColors.GREEN ? "border-green" : "border-purple",
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
      ) : (
        <div className="flex items-center justify-center py-12 px-5 relative overflow-hidden min-h-[284px] bg-tertiary-bg rounded-3 bg-empty-not-found-token bg-right-top bg-no-repeat max-md:bg-size-180">
          <p className="text-16 text-secondary-text text-center z-10">Token not found</p>
        </div>
      )}
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

  const renderConfirmingState = () => (
    <div className="space-y-5">
      <div className="bg-tertiary-bg rounded-3 p-5 h-[88px] flex flex-col justify-center">
        <div className="text-secondary-text text-14 mb-1">Claim amount</div>
        <div className="flex items-center gap-2">
            <div className="text-20 font-normal text-primary-text mb-1">{tokenCount} tokens</div>
          <div className="flex items-center gap-1">
            <Badge variant={BadgeVariant.STANDARD} standard={Standard.ERC20} size="small" />
            <Badge variant={BadgeVariant.STANDARD} standard={Standard.ERC223} size="small" />
          </div>
            <div className="text-16 text-secondary-text">(${data.totalReward.toFixed(2)})</div>
         
        </div>
      </div>

      {/* Executing claim section */}
      <div className="border-t border-secondary-border pt-4">
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
    </div>
  );

  const renderExecutingState = () => (
    <div className="space-y-5">
      {/* Claim amount display */}
      <div className="bg-tertiary-bg rounded-3 p-5 h-[88px] flex flex-col justify-center">
        <div className="text-secondary-text text-14 mb-1">Claim amount</div>
        <div className="flex items-center gap-2">
            <div className="text-20 font-normal text-primary-text mb-1">{tokenCount} tokens</div>
          <div className="flex items-center gap-1">
            <Badge variant={BadgeVariant.STANDARD} standard={Standard.ERC20} size="small" />
            <Badge variant={BadgeVariant.STANDARD} standard={Standard.ERC223} size="small" />
          </div>
            <div className="text-16 text-secondary-text">(${data.totalReward.toFixed(2)})</div>
        </div>
      </div>

      {/* Executing claim section */}
      <div className="border-t border-secondary-border pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-quaternary-bg rounded-full flex items-center justify-center">
              <Svg iconName="arrow-left-down" size={20} className="text-secondary-text" />
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
          {tokenCount} tokens (${data.totalReward.toFixed(2)})
        </p>
      </div>

      <div className="h-px w-full bg-secondary-border mb-2" style={{ marginTop: '20px' }} />
      {/* Transaction details */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-bg rounded-full flex items-center justify-center">
            <Svg iconName="arrow-left-down" size={24} className="text-green" />
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
    <>
      <DrawerDialog isOpen={isOpen} setIsOpen={closeDialog}>
        <DialogHeader onClose={closeDialog} title="Claim" />

        <div className={clsxMerge(
          "w-full p-5 md:p-6",
          state === "initial" ? "md:w-[800px]" : "md:w-[600px]"
        )}>{renderContent()}</div>
      </DrawerDialog>
      <NetworkFeeConfigDialog
        isAdvanced={isAdvanced}
        setIsAdvanced={setIsAdvanced}
        estimatedGas={estimatedGas || gasToUse}
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

export default MultipleClaimDialog;
