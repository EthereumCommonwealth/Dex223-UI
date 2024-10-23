import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import { SearchInput } from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import Tooltip from "@/components/atoms/Tooltip";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import { Check, rateToScore, TrustMarker, TrustRateCheck } from "@/components/badges/TrustBadge";
import IconButton from "@/components/buttons/IconButton";
import { TokenPortfolioDialogContent } from "@/components/dialogs/TokenPortfolioDialog";
import { clsxMerge } from "@/functions/clsxMerge";
import { formatFloat } from "@/functions/formatFloat";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import useTokenBalances from "@/hooks/useTokenBalances";
import { useTokens } from "@/hooks/useTokenLists";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { useManageTokensDialogStore } from "@/stores/useManageTokensDialogStore";
import { usePinnedTokensStore } from "@/stores/usePinnedTokensStore";

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  handlePick: (token: Currency) => void;
}

function FoundInOtherListMarker() {
  return (
    <Tooltip
      text="There is a token with a same name but different address"
      renderTrigger={(ref, refProps) => {
        return (
          <div
            className="rounded-full p-0.5 bg-primary-bg group-hover:bg-tertiary-bg group-focus:bg-tertiary-bg group-focus:outline-0 duration-200"
            ref={ref.setReference}
            {...refProps}
          >
            <div className="rounded-full p-0.5 flex items-center gap-1 cursor-pointer text-12 text-orange bg-orange-bg">
              <Svg size={20} iconName="duplicate-found" />
            </div>
          </div>
        );
      }}
    />
  );
}

function TokenRow({
  currency,
  handlePick,
  setTokenForPortfolio,
}: {
  currency: Currency;
  handlePick: (currency: Currency) => void;
  setTokenForPortfolio: (currency: Currency) => void;
}) {
  const { toggleToken, isTokenPinned, pinnedTokens } = usePinnedTokensStore((s) => ({
    toggleToken: s.toggleToken,
    pinnedTokens: s.tokens,
    isTokenPinned: s.tokens[currency.chainId].includes(
      currency.isNative ? "native" : currency.address0,
    ),
  }));

  const {
    balance: { erc20Balance, erc223Balance },
  } = useTokenBalances(isTokenPinned ? currency : undefined);

  const scoreObj = useMemo((): [number, boolean] | undefined => {
    if (currency.isToken && currency.rate) {
      return [
        rateToScore(currency.rate),
        currency.rate[Check.SAME_NAME_IN_OTHER_LIST] === TrustRateCheck.TRUE,
      ];
    }

    return;
  }, [currency]);

  return (
    <div
      role="button"
      onClick={() => handlePick(currency)}
      className="px-10 hover:bg-tertiary-bg focus:bg-tertiary-bg focus:outline-0 duration-200 group pb-2"
    >
      <div className="grid grid-cols-[40px_1fr] gap-2">
        <div className="flex items-center pt-3">
          <Image width={40} height={40} src={currency?.logoURI || ""} alt="" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{currency.name}</span>
              <div className="flex relative items-center">
                {scoreObj && (
                  <>
                    {scoreObj[0] < 20 && (
                      <>
                        {currency.isToken && currency.rate && (
                          <TrustMarker rate={currency?.rate} totalScore={scoreObj[0]} />
                        )}
                      </>
                    )}
                    {scoreObj[1] && (
                      <div className={scoreObj[0] < 20 ? "-ml-2.5" : ""}>
                        <FoundInOtherListMarker />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-primary-text text-12">$0.00</span>
              {currency.isToken ? (
                <IconButton
                  iconName="details"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTokenForPortfolio(currency);
                  }}
                />
              ) : (
                <span className="block w-10" />
              )}
              <IconButton
                iconName={isTokenPinned ? "pin-fill" : "pin"}
                onClick={(e) => {
                  e.stopPropagation();
                  if (pinnedTokens[currency.chainId].length < 8 || isTokenPinned) {
                    toggleToken(currency.isNative ? "native" : currency.address0, currency.chainId);
                  }
                }}
              />
            </div>
          </div>

          <div className="auto-cols-fr grid grid-flow-col gap-2">
            {!isTokenPinned && (
              <span className="text-secondary-text text-12">{currency.symbol}</span>
            )}
            {erc20Balance && currency.isNative && (
              <div className="flex items-center gap-1">
                <Badge size="small" variant={BadgeVariant.COLORED} text="Native" />
                <span className="text-secondary-text text-12">
                  {formatFloat(erc20Balance?.formatted)} {currency.symbol}
                </span>
              </div>
            )}
            {erc20Balance && !currency.isNative && (
              <div className="flex items-center gap-1">
                <Badge size="small" variant={BadgeVariant.COLORED} text="ERC-20" />
                <span className="text-secondary-text text-12">
                  {formatFloat(erc20Balance?.formatted)} {currency.symbol}
                </span>
              </div>
            )}
            {erc223Balance && !currency.isNative && (
              <div className="flex items-center gap-1">
                <Badge size="small" variant={BadgeVariant.COLORED} text="ERC-223" />
                <span className="text-secondary-text text-12">
                  {formatFloat(erc223Balance?.formatted)} {currency.symbol}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PickTokenDialog({ isOpen, setIsOpen, handlePick }: Props) {
  const tokens = useTokens();
  const t = useTranslations("ManageTokens");
  const chainId = useCurrentChainId();
  const { tokens: pinnedTokensAddresses, toggleToken } = usePinnedTokensStore();

  const pinnedTokens = useMemo(() => {
    return tokens.filter((t) =>
      pinnedTokensAddresses[chainId].includes(t.isNative ? "native" : t.address0),
    );
  }, [chainId, pinnedTokensAddresses, tokens]);

  const [tokenForPortfolio, setTokenForPortfolio] = useState<Currency | null>(null);
  const [isEditActivated, setEditActivated] = useState<boolean>(true);
  const { isOpen: isManageOpened, setIsOpen: setManageOpened } = useManageTokensDialogStore();

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setTokenForPortfolio(null);
    }, 400);
  }, [setIsOpen]);

  const [tokensSearchValue, setTokensSearchValue] = useState("");

  const [filteredTokens, isTokenFilterActive] = useMemo(() => {
    return tokensSearchValue
      ? [
          tokens.filter(
            (t) => t.name && t.name.toLowerCase().startsWith(tokensSearchValue.toLowerCase()),
          ),
          true,
        ]
      : [tokens, false];
  }, [tokens, tokensSearchValue]);
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  useEffect(() => {
    if (!isMobile) {
      setEditActivated(false);
    }
  }, [isMobile]);

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={handleClose}>
      {tokenForPortfolio ? (
        <>
          <DialogHeader
            onClose={handleClose}
            onBack={() => {
              setTokenForPortfolio(null);
            }}
            title={tokenForPortfolio.name || "Unknown"}
          />
          {tokenForPortfolio.isToken && <TokenPortfolioDialogContent token={tokenForPortfolio} />}
        </>
      ) : (
        <>
          <DialogHeader onClose={handleClose} title={t("select_token")} />

          {Boolean(tokens.length) && (
            <>
              <div className="w-full md:w-[600px]">
                <div className="px-4 md:px-10 pb-3">
                  <SearchInput
                    value={tokensSearchValue}
                    onChange={(e) => setTokensSearchValue(e.target.value)}
                    placeholder={t("search_name_or_paste_address")}
                  />
                  <div
                    className={clsx(
                      "flex flex-wrap gap-3 mt-3",
                      !!pinnedTokens.length && "border-b border-secondary-border pb-3",
                    )}
                  >
                    {pinnedTokens.map((pinnedToken) => {
                      return (
                        <div key={pinnedToken.wrapped.address0} className="group relative">
                          <button
                            onClick={() => {
                              if (isMobile && isEditActivated) {
                                toggleToken(
                                  pinnedToken.isNative ? "native" : pinnedToken.address0,
                                  pinnedToken.chainId,
                                );
                              } else {
                                handlePick(pinnedToken);
                              }
                            }}
                            className="items-center justify-center px-4 duration-200 h-10 rounded-1 bg-tertiary-bg hover:bg-green-bg focus:bg-green-bg focus:outline-0 flex gap-2"
                          >
                            <Image
                              width={24}
                              height={24}
                              src={pinnedToken.logoURI || "/tokens/placeholder.svg"}
                              alt=""
                            />
                            {pinnedToken.symbol}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleToken(
                                pinnedToken.isNative ? "native" : pinnedToken.address0,
                                pinnedToken.chainId,
                              );
                            }}
                            className={clsxMerge(
                              "group-hover:opacity-100 group-focus:opacity-100 group-focus:outline-0 opacity-0 duration-200 flex absolute w-5 h-5 items-center justify-center bg-quaternary-bg rounded-full text-secondary-text hover:text-primary-text focus:text-primary-text focus:outline-0 -right-1 -top-1",
                              isEditActivated && "opacity-100",
                            )}
                          >
                            <Svg size={16} iconName="close" />
                          </button>
                        </div>
                      );
                    })}
                    {
                      <span className="md:hidden">
                        <IconButton
                          onClick={() => {
                            setEditActivated(!isEditActivated);
                          }}
                          iconName="edit"
                        />
                      </span>
                    }
                  </div>
                </div>
                {Boolean(filteredTokens.length) && (
                  <div className="h-[420px] overflow-auto">
                    {filteredTokens.map((token) => (
                      <TokenRow
                        setTokenForPortfolio={setTokenForPortfolio}
                        handlePick={handlePick}
                        key={token.wrapped.address0}
                        currency={token}
                      />
                    ))}
                  </div>
                )}
                {Boolean(!filteredTokens.length && isTokenFilterActive) && (
                  <div className="flex items-center justify-center gap-2 flex-col h-full min-h-[420px] w-full md:w-[570px]">
                    <EmptyStateIcon iconName="search" />
                    <span className="text-secondary-text">{t("token_not_found")}</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setManageOpened(true);
                  }}
                  className="w-full text-green hover:text-green-hover focus:text-green-hover focus:outline-0 rounded-b-5 flex items-center justify-center gap-2 h-[60px] bg-tertiary-bg hover:bg-green-bg hover:shadow hover:shadow-green/60 duration-200"
                >
                  Manage tokens
                  <Svg iconName="edit" />
                </button>
              </div>
            </>
          )}
          {Boolean(!tokens.length) && (
            <div className="flex items-center justify-center gap-2 flex-col h-full min-h-[520px] w-full md:w-[570px]">
              <EmptyStateIcon iconName="tokens" />
              <span className="text-secondary-text">{t("no_tokens_here")}</span>
            </div>
          )}
        </>
      )}
    </DrawerDialog>
  );
}
