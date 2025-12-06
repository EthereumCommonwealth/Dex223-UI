"use client";

import "react-loading-skeleton/dist/skeleton.css";

import Checkbox from "@repo/ui/checkbox";
import Preloader from "@repo/ui/preloader";
import clsx from "clsx";
import Image from "next/image";
import React, { useEffect } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button from "@/components/buttons/Button";
import {
  ButtonColor,
  ButtonSize,
  ButtonVariant as ButtonVariantType,
} from "@/components/buttons/Button";
import IconButton, { IconButtonSize, IconButtonVariant } from "@/components/buttons/IconButton";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import { Standard } from "@/sdk_bi/standard";

import MultipleClaimDialog from "../../dialogs/MultipleClaimDialog";
import SingleClaimDialog from "../../dialogs/SingleClaimDialog";
import { useClaimDialogStore } from "../../stores/useClaimDialogStore";
import Svg from "@/components/atoms/Svg";
import ForwardIcon from "../../../../../../../packages/ui/src/icons/ForwardIcon";

export const Claims = ({
  tableData,
  selectedTokens,
  setSelectedTokens,
  isLoading = false,
}: {
  tableData: any;
  selectedTokens: Set<number>;
  setSelectedTokens: (tokenId: number) => void;
  isLoading?: boolean;
}) => {
  const {
    openDialog,
    state: claimState,
    data: claimData,
    isOpen: isClaimDialogOpen,
    resetClaim,
  } = useClaimDialogStore();

  // Check if a specific token is being claimed
  const isTokenBeingClaimed = (tokenId: number) => {
    if (!claimData) return false;
    if (claimState !== "confirming" && claimState !== "executing") return false;
    if (isClaimDialogOpen) return false;
    return claimData.selectedTokens?.some((token) => token.id === tokenId) || false;
  };

  const hasClaimInProgress =
    (claimState === "confirming" || claimState === "executing") && !isClaimDialogOpen;

  useEffect(() => {
    if ((claimState === "success" || claimState === "error") && !isClaimDialogOpen) {
      const timer = setTimeout(() => {
        resetClaim();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [claimState, isClaimDialogOpen, resetClaim]);

  const handleTokenSelect = (tokenId: number) => {
    setSelectedTokens(tokenId);
  };

  const handleUnselectAll = () => {
    setSelectedTokens(0);
  };

  const handleClaimSingle = (token: any) => {
    const selectedTokensData = [
      {
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        logoURI: token.logoURI,
        amount: token.amount,
        amountUSD: token.amountUSD,
        erc20Address: token.erc20Address,
        erc223Address: token.erc223Address,
        chainId: token.chainId,
      },
    ];

    const totalReward = parseFloat(token.amountUSD.replace(/[$,]/g, ""));

    openDialog({
      selectedTokens: selectedTokensData,
      totalReward,
      gasPrice: "33.53",
      gasLimit: "329000",
      networkFee: "0.0031",
      selectedStandard: "ERC-223",
      isMultiple: false,
    });
  };

  const handleClaimSelected = () => {
    const selectedTokensData = tableData
      .filter((item: any) => selectedTokens.has(item.id))
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        symbol: item.symbol,
        logoURI: item.logoURI,
        amount: item.amount,
        amountUSD: item.amountUSD,
        erc20Address: item.erc20Address,
        erc223Address: item.erc223Address,
        chainId: item.chainId,
      }));

    const totalReward = tableData.reduce((sum: number, item: any) => {
      if (selectedTokens.has(item.id)) {
        const usdValue = parseFloat(item.amountUSD.replace(/[$,]/g, ""));
        return sum + usdValue;
      }
      return sum;
    }, 0);

    if (selectedTokens.size === 1) {
      const token = selectedTokensData[0];
      openDialog({
        selectedTokens: selectedTokensData,
        totalReward,
        gasPrice: "33.53",
        gasLimit: "329000",
        networkFee: "0.0031",
        selectedStandard: "ERC-223",
        isMultiple: false,
      });
    } else {
      const tokenStandards: Record<number, "ERC-20" | "ERC-223"> = {};
      selectedTokensData.forEach((token: any) => {
        tokenStandards[token.id] = "ERC-223";
      });

      openDialog({
        selectedTokens: selectedTokensData,
        totalReward,
        gasPrice: "33.53",
        gasLimit: "329000",
        networkFee: "0.0031",
        isMultiple: true,
        tokenStandards,
      });
    }
  };

  const selectedCount = selectedTokens.size;
  const totalReward = tableData.reduce((sum: number, item: any) => {
    if (selectedTokens.has(item.id)) {
      const usdValue = parseFloat(item.amountUSD.replace(/[$,]/g, ""));
      return sum + usdValue;
    }
    return sum;
  }, 0);

  return (
    <>
      <SingleClaimDialog />
      <MultipleClaimDialog />
      {/* Desktop version */}
      <div className="hidden xl:block rounded-3 overflow-x-auto bg-table-gradient">
        <div className="grid grid-cols-[minmax(200px,2.5fr),_minmax(200px,2fr),_minmax(150px,1.2fr),_minmax(150px,1.2fr),_minmax(120px,1fr)] relative pr-5 pl-5 min-w-[1000px]">
          <div className="text-tertiary-text text-13 pl-5 h-[60px] flex items-center">Token</div>
          <div className="text-tertiary-text text-13 h-[60px] flex items-center">
            <div className="flex flex-col gap-1">
              <span>Address ERC-20</span>
              <span>Address ERC-223</span>
            </div>
          </div>
          <div className="text-tertiary-text text-13 h-[60px] flex items-center justify-end pr-4">
            Amount in tokens
          </div>
          <div className="text-tertiary-text text-13 h-[60px] flex items-center justify-end pr-4">
            Amount in USD
          </div>
          <div className="text-tertiary-text text-13 h-[60px] flex items-center justify-center">
            Action
          </div>
        </div>

        {isLoading ? (
          <SkeletonTheme
            baseColor="#272727"
            highlightColor="#2E2F2F"
            borderRadius="0.5rem"
            enableAnimation={false}
          >
            {[...Array(8)].map((_, index) => (
              <React.Fragment key={index}>
                <div className="grid grid-cols-[minmax(200px,2.5fr),_minmax(200px,2fr),_minmax(150px,1.2fr),_minmax(150px,1.2fr),_minmax(120px,1fr)] relative">
                  <div className="min-h-[30px] flex items-center gap-3 pl-5 border-b border-quaternary-bg">
                    <Skeleton circle width={16} height={16} />
                    <Skeleton circle width={32} height={32} />
                    <div className="flex flex-col gap-1">
                      <Skeleton width={80} height={14} />
                      <Skeleton width={40} height={12} />
                    </div>
                  </div>
                  <div className="min-h-[30px] flex items-center border-b border-quaternary-bg">
                    <div className="flex flex-col gap-2 w-full">
                      <Skeleton width={100} height={14} />
                      <Skeleton width={100} height={14} />
                    </div>
                  </div>
                  <div className="min-h-[30px] flex items-center justify-end pr-4 border-b border-quaternary-bg">
                    <Skeleton width={60} height={14} />
                  </div>
                  <div className="min-h-[30px] flex items-center justify-end pr-4 border-b border-quaternary-bg">
                    <Skeleton width={80} height={14} />
                  </div>
                  <div className="min-h-[30px] flex items-center justify-center border-b border-quaternary-bg">
                    <Skeleton width={60} height={32} />
                  </div>
                </div>
              </React.Fragment>
            ))}
          </SkeletonTheme>
        ) : (
          <>
            {tableData.map((o: any, index: number) => {
              const key = o?.token?.address0 ? o.token.address0 : `item-${index}`;
              const isSelected = selectedTokens.has(o.id);

              return (
                <div
                  key={key}
                  className={clsx(
                    "grid grid-cols-[minmax(200px,2.5fr),_minmax(200px,2fr),_minmax(150px,1.2fr),_minmax(150px,1.2fr),_minmax(120px,1fr)] relative duration-200 rounded-2 pr-5 pl-5",
                    isTokenBeingClaimed(o.id)
                      ? "opacity-60 pointer-events-none"
                      : "hover:bg-tertiary-bg cursor-pointer",
                  )}
                >
                  <div
                    className={clsx(
                      "min-h-[72px] flex text-secondary-text items-center gap-3 pl-5",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        handleChange={() => handleTokenSelect(o.id)}
                        id={`claim-token-${o.id}`}
                        disabled={hasClaimInProgress || isTokenBeingClaimed(o.id)}
                      />
                      <Image
                        src={o.logoURI || "/images/tokens/placeholder.svg"}
                        width={32}
                        height={32}
                        alt=""
                        className="flex-shrink-0"
                      />
                      <div className="flex min-w-0 justify-center gap-2 items-center">
                        <span className="truncate text-secondary-text text-14 font-medium">
                          {o.name}
                        </span>
                        <span className="text-13 text-tertiary-text">{o.symbol}</span>
                      </div>
                    </div>
                  </div>
                  <div className={clsx("min-h-[72px] flex items-center")}>
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center gap-2">
                        <a
                          target="_blank"
                          href={getExplorerLink(
                            ExplorerLinkType.ADDRESS,
                            o.erc20Address,
                            o.chainId,
                          )}
                          className="flex items-center gap-1 text-green hocus:text-green-hover duration-200"
                        >
                          <span className="w-[80px] text-left">
                            {truncateMiddle(o.erc20Address || "", {
                              charsFromStart: 3,
                              charsFromEnd: 3,
                            })}
                          </span>
                          <ForwardIcon className="flex-shrink-0 w-6 h-6" size={24} />
                        </a>
                        <IconButton
                          variant={IconButtonVariant.COPY}
                          text={o.fullErc20Address}
                          buttonSize={IconButtonSize.EXTRA_SMALL}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          target="_blank"
                          href={getExplorerLink(
                            ExplorerLinkType.ADDRESS,
                            o.erc223Address,
                            o.chainId,
                          )}
                          className="flex items-center gap-1 text-green hocus:text-green-hover duration-200"
                        >
                          <span className="w-[80px] text-left">
                            {truncateMiddle(o.erc223Address || "", {
                              charsFromStart: 3,
                              charsFromEnd: 3,
                            })}
                          </span>
                          <ForwardIcon className="flex-shrink-0 w-6 h-6" size={24} />
                        </a>
                        <IconButton
                          variant={IconButtonVariant.COPY}
                          text={o.fullErc223Address}
                          buttonSize={IconButtonSize.EXTRA_SMALL}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={clsx("min-h-[72px] flex text-14 items-center justify-end pr-4")}>
                    <div className="flex items-center">
                      <span className="text-primary-text">{o.amount}</span>
                      <span className="text-secondary-text ml-1">{o.symbol}</span>
                    </div>
                  </div>
                  <div
                    className={clsx(
                      "min-h-[72px] flex text-secondary-text text-14 items-center justify-end pr-4",
                    )}
                  >
                    {o.amountUSD}
                  </div>
                  <div className={clsx("min-h-[72px] flex items-center justify-center ml-10")}>
                    {isTokenBeingClaimed(o.id) ? (
                      <div className="flex items-center gap-2">
                        <Preloader size={20} />
                        <span className="text-secondary-text text-14">Claiming...</span>
                      </div>
                    ) : (
                      <Button
                        variant={ButtonVariantType.CONTAINED}
                        colorScheme={ButtonColor.GREEN}
                        size={ButtonSize.MEDIUM}
                        onClick={() => handleClaimSingle(o)}
                        disabled={selectedTokens.size > 0 || hasClaimInProgress}
                      >
                        Claim
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {selectedCount > 0 && !isLoading && (
          <div className="mt-4 p-4 bg-tertiary-bg rounded-b-3 flex items-center justify-between gap-4 border border-quaternary-bg">
            <div className="flex items-center gap-4">
              <span className="text-tertiary-text text-14">
                Total claim: {selectedCount} token{selectedCount !== 1 ? "s" : ""}
              </span>
              <button
                onClick={handleUnselectAll}
                className="text-secondary-text hover:text-primary-text transition-colors text-14 font-medium"
              >
                Unselect all
              </button>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Svg iconName="gas-edit" size={20} className="text-tertiary-text" />
                <span className="text-tertiary-text text-14">Gas price: $12.23</span>
                <Button
                  variant={ButtonVariantType.CONTAINED}
                  colorScheme={ButtonColor.LIGHT_GREEN}
                  size={ButtonSize.EXTRA_SMALL}
                >
                  Edit
                </Button>
              </div>
              <div className="h-[20px] w-[2px] bg-secondary-border"></div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <Svg iconName="subtract" size={20} className="text-tertiary-text" />
                  <span className="text-tertiary-text text-14 font-light">
                    Total reward: ${totalReward.toFixed(2)}
                  </span>
                </div>
                <Button
                  variant={ButtonVariantType.CONTAINED}
                  colorScheme={ButtonColor.GREEN}
                  size={ButtonSize.SMALL}
                  onClick={handleClaimSelected}
                  className="!rounded-[8px]"
                  disabled={hasClaimInProgress}
                >
                  {hasClaimInProgress ? (
                    <div className="flex items-center gap-2">
                      <Preloader size={16} />
                      Claiming...
                    </div>
                  ) : (
                    "Claim selected tokens"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile and Tablet version */}
      <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 overflow-x-hidden w-full">
        {isLoading ? (
          <SkeletonTheme
            baseColor="#272727"
            highlightColor="#2E2F2F"
            borderRadius="0.75rem"
            enableAnimation={false}
          >
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-primary-bg rounded-3 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Skeleton circle width={16} height={16} className="mt-1" />
                  <Skeleton circle width={32} height={32} />
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center justify-between">
                      <Skeleton width={120} height={14} />
                      <Skeleton width={60} height={14} />
                    </div>
                    <Skeleton width={80} height={13} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mb-3">
                  <Skeleton width={100} height={12} />
                  <Skeleton width={100} height={12} />
                </div>

                <Skeleton width="100%" height={40} />
              </div>
            ))}
          </SkeletonTheme>
        ) : (
          <>
            {selectedCount > 0 && !isLoading && (
              <div className="bg-tertiary-bg rounded-3 p-4 xl:col-span-2">
                <div className="flex items-center mb-3 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Svg iconName="gas-edit" size={16} className="text-tertiary-text" />
                    <span className="text-secondary-text text-14">Gas price: $12.23</span>
                  </div>
                  <Button
                    variant={ButtonVariantType.OUTLINED}
                    colorScheme={ButtonColor.LIGHT_GREEN}
                    size={ButtonSize.EXTRA_SMALL}
                    className="!h-6 !px-2 !text-12"
                  >
                    Edit
                  </Button>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Svg iconName="subtract" size={16} className="text-tertiary-text" />
                    <span className="text-secondary-text text-14">
                      Total reward: ${totalReward.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={ButtonVariantType.OUTLINED}
                    colorScheme={ButtonColor.LIGHT_GREEN}
                    size={ButtonSize.MEDIUM}
                    onClick={handleUnselectAll}
                    className="flex-1 h-10 !px-0"
                  >
                    Unselect all
                  </Button>
                  <Button
                    variant={ButtonVariantType.CONTAINED}
                    colorScheme={ButtonColor.GREEN}
                    size={ButtonSize.MEDIUM}
                    onClick={handleClaimSelected}
                    disabled={hasClaimInProgress}
                    className="flex-1 h-10 !px-0"
                  >
                    {hasClaimInProgress ? (
                      <div className="flex items-center gap-2">
                        <Preloader size={16} />
                        Claiming...
                      </div>
                    ) : (
                      `Claim ${selectedCount} token${selectedCount !== 1 ? "s" : ""}`
                    )}
                  </Button>
                </div>
              </div>
            )}
            {tableData.map((o: any, index: number) => {
              const key = o?.token?.address0 ? o.token.address0 : `item-${index}`;
              const isSelected = selectedTokens.has(o.id);

              return (
                  <div
                    key={key}
                    className={clsx(
                      "bg-primary-bg rounded-3 p-4 flex flex-col overflow-hidden w-full",
                      isTokenBeingClaimed(o.id) && "opacity-60 pointer-events-none",
                    )}
                  >
                    {/* Header with token info */}
                    <div className="flex items-center gap-3 mb-2 overflow-hidden w-full">
                      <Checkbox
                        checked={isSelected}
                        handleChange={() => handleTokenSelect(o.id)}
                        id={`claim-token-mobile-${o.id}`}
                        disabled={hasClaimInProgress || isTokenBeingClaimed(o.id)}
                      />
                      <Image
                        src={o.logoURI || "/images/tokens/placeholder.svg"}
                        width={32}
                        height={32}
                        alt=""
                        className="flex-shrink-0"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-primary-text text-14 font-medium truncate">
                            {o.name}
                          </span>
                          <span className="text-primary-text text-14 font-medium flex-shrink-0">
                            {o.amountUSD}
                          </span>
                        </div>
                        <div className="text-13 text-secondary-text">
                          {o.amount} {o.symbol}
                        </div>
                      </div>
                    </div>

                    {/* Addresses section */}
                    <div className="flex flex-row justify-between gap-2 md:gap-3 mb-3 overflow-hidden w-full">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                        <span className="text-tertiary-text text-13 flex-shrink-0">ERC-20</span>
                        <a
                          target="_blank"
                          href={getExplorerLink(
                            ExplorerLinkType.ADDRESS,
                            o.fullErc20Address || o.erc20Address,
                            o.chainId,
                          )}
                          className="flex items-center gap-0.5 text-green hocus:text-green-hover duration-200 min-w-0 overflow-hidden"
                        >
                          <span className="text-13 truncate">
                            {truncateMiddle(o.fullErc20Address || o.erc20Address || "", {
                              charsFromStart: 3,
                              charsFromEnd: 3,
                            })}
                          </span>
                          <Svg iconName="forward" size={16} className="flex-shrink-0" />
                        </a>
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                        <span className="text-tertiary-text text-13 flex-shrink-0">ERC-223</span>
                        <a
                          target="_blank"
                          href={getExplorerLink(
                            ExplorerLinkType.ADDRESS,
                            o.fullErc223Address || o.erc223Address,
                            o.chainId,
                          )}
                          className="flex items-center gap-0.5 text-green hocus:text-green-hover duration-200 min-w-0 overflow-hidden"
                        >
                          <span className="text-13 truncate">
                            {truncateMiddle(o.fullErc223Address || o.erc223Address || "", {
                              charsFromStart: 3,
                              charsFromEnd: 3,
                            })}
                          </span>
                          <Svg iconName="forward" size={16} className="flex-shrink-0" />
                        </a>
                      </div>
                    </div>

                    {isTokenBeingClaimed(o.id) ? (
                      <div className="flex items-center justify-center gap-2 h-10 bg-quaternary-bg rounded-2">
                        <Preloader size={16} />
                        <span className="text-secondary-text text-14">Claiming...</span>
                      </div>
                    ) : (
                      <Button
                        className="w-full h-10"
                        variant={ButtonVariantType.CONTAINED}
                        colorScheme={ButtonColor.GREEN}
                        size={ButtonSize.MEDIUM}
                        disabled={selectedTokens.size > 0 || hasClaimInProgress}
                        onClick={() => handleClaimSingle(o)}
                      >
                        Claim
                      </Button>
                    )}
                  </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
};
