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
import { filterTokens } from "@/functions/searchTokens";
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
            className="rounded-full p-0.5 bg-primary-bg group-hocus:bg-tertiary-bg duration-200"
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
    <button
      role="button"
      onClick={() => handlePick(currency)}
      className="rounded-2 flex items-center flex-wrap md:block md:rounded-0 pl-3 pr-1.5 md:px-10 bg-tertiary-bg md:bg-transparent hocus:bg-tertiary-bg duration-200 group pt-1.5 md:pt-0 pb-1.5 md:pb-2 w-full text-left"
    >
      <div className="grid grid-cols-[40px_1fr] gap-2 w-full">
        <div className="flex items-center md:pt-3">
          <Image width={40} height={40} src={currency?.logoURI || ""} alt="" />
        </div>
        <div className="w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center md:gap-2 flex-wrap">
              <div className="flex items-center w-[120px] md:gap-2 md:w-[256px]">
                <span className="whitespace-nowrap overflow-ellipsis overflow-hidden">
                  {currency.name}
                </span>
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

              {isTokenPinned ? (
                <span className="block w-full text-primary-text text-12 md:hidden">$0.00</span>
              ) : (
                <span className="w-full ">
                  <span className="w-[100px] whitespace-nowrap overflow-hidden overflow-ellipsis block text-secondary-text text-12 md:hidden">
                    {currency.symbol}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-primary-text text-12 hidden md:inline">$0.00</span>
              {currency.isToken ? (
                <Tooltip
                  text={`Token belongs to ${currency.lists?.length || 1} token lists`}
                  renderTrigger={(ref, refProps) => {
                    return (
                      <span
                        ref={ref.setReference}
                        {...refProps}
                        className="flex gap-0.5 items-center text-secondary-text text-14 cursor-pointer w-10"
                      >
                        {currency.lists?.length || 1}
                        <Svg className="text-tertiary-text" iconName="list" />
                      </span>
                    );
                  }}
                />
              ) : (
                <span className="block w-10" />
              )}
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

          <div className="auto-cols-fr grid-flow-col gap-2 hidden md:grid">
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
      <div className="auto-cols-fr grid grid-flow-col gap-2 md:hidden mt-1">
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
    </button>
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
    return tokensSearchValue ? [filterTokens(tokensSearchValue, tokens), true] : [tokens, false];
  }, [tokens, tokensSearchValue]);
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  useEffect(() => {
    if (!isMobile || !pinnedTokens.length) {
      setEditActivated(false);
    }
  }, [isMobile, pinnedTokens.length]);

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
                        <div
                          key={
                            pinnedToken.isToken
                              ? pinnedToken.address0
                              : `native-${pinnedToken.wrapped.address0}`
                          }
                          className="group relative"
                        >
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
                            className={clsx(
                              isEditActivated
                                ? "bg-transparent border-secondary-border hocus:bg-transparent"
                                : "bg-tertiary-bg border-transparent hocus:bg-green-bg",
                              "items-center border justify-center px-4 duration-200 h-10 rounded-1  flex gap-2",
                            )}
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
                              "group-hocus:opacity-100 hocus:opacity-100 opacity-0 duration-200 flex absolute w-5 h-5 items-center justify-center bg-quaternary-bg rounded-full text-secondary-text hocus:text-primary-text -right-1 -top-1",
                              isEditActivated && "opacity-100",
                            )}
                          >
                            <Svg size={16} iconName="close" />
                          </button>
                        </div>
                      );
                    })}
                    {!!pinnedTokens.length && (
                      <span className="md:hidden">
                        <button
                          className={clsx(
                            "w-10 h-10 rounded-2 flex items-center justify-center",
                            isEditActivated ? "bg-green-bg-hover" : "bg-tertiary-bg",
                          )}
                          onClick={() => {
                            setEditActivated(!isEditActivated);
                          }}
                        >
                          <Svg iconName="edit" size={20} />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
                {Boolean(filteredTokens.length) && (
                  <div className="h-[420px] overflow-auto flex flex-col gap-2 md:gap-0 px-4 md:px-0 pb-2">
                    {filteredTokens.map((token) => (
                      <TokenRow
                        setTokenForPortfolio={setTokenForPortfolio}
                        handlePick={handlePick}
                        key={token.isToken ? token.address0 : `native-${token.wrapped.address0}`}
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
                  className="w-full text-green hocus:text-green-hover rounded-b-5 flex items-center justify-center gap-2 h-[60px] bg-tertiary-bg hocus:bg-green-bg hocus:shadow hocus:shadow-green/60 duration-200"
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
