import Checkbox from "@repo/ui/checkbox";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useCallback, useMemo, useState } from "react";

import { useCollateralTokensDialogOpenedStore } from "@/app/[locale]/margin-trading/stores/dialogStates";
import Dialog from "@/components/atoms/Dialog";
import DialogHeader from "@/components/atoms/DialogHeader";
import { SearchInput } from "@/components/atoms/Input";
import ScrollbarContainer from "@/components/atoms/ScrollbarContainer";
import Button, { ButtonColor } from "@/components/buttons/Button";
import IconButton from "@/components/buttons/IconButton";
import { TokenPortfolioDialogContent } from "@/components/dialogs/TokenPortfolioDialog";
import { clsxMerge } from "@/functions/clsxMerge";
import { filterTokens } from "@/functions/searchTokens";
import { useTokens } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
import { Currency } from "@/sdk_bi/entities/currency";

function TokenRowWithCheckbox({
  currency,
  setSelected,
  setTokenForPortfolio,
  isSelected,
}: {
  currency: Currency;
  setSelected: () => void;
  setTokenForPortfolio: (currency: Currency) => void;
  isSelected: boolean;
}) {
  return (
    <div className="rounded-2 flex items-center flex-wrap md:block md:rounded-0 pl-3 pr-1.5 md:pl-10 md:pr-7 bg-transparent duration-200 group py-1 md:py-2 w-full text-left">
      <div className="grid md:grid-cols-[40px_1fr] grid-cols-[32px_1fr] gap-2 w-full">
        <div className="flex items-center">
          <Image
            width={40}
            height={40}
            src={
              currency?.logoURI !== "/tokens/placeholder.svg"
                ? currency?.logoURI || ""
                : "/images/tokens/placeholder.svg"
            }
            alt=""
          />
        </div>
        <div className="w-full pl-1 md:pl-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center md:gap-x-2 flex-wrap">
              <div className="flex items-center w-[120px] md:gap-2 md:w-[256px]">
                <span className="whitespace-nowrap overflow-ellipsis overflow-hidden">
                  {currency.name}
                </span>
              </div>

              <span className="w-full ">
                <span className="w-[100px] whitespace-nowrap overflow-hidden overflow-ellipsis block text-secondary-text text-12  md:text-14">
                  {currency.symbol}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-4">
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
              <Checkbox
                checked={isSelected}
                handleChange={setSelected}
                id={currency.wrapped.address0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PickMultipleTokensDialog({
  isOpen,
  setIsOpen,
  handlePick,
  selectedTokens,
  restrictDisable,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  handlePick: (tokens: Currency[]) => void;
  selectedTokens: Currency[];
  restrictDisable?: Currency | undefined;
}) {
  const t = useTranslations("ManageTokens");

  const [internalTokens, setInternalTokens] = useState<Currency[]>(selectedTokens);

  const tokens = useTokens();

  const [tokensSearchValue, setTokensSearchValue] = useState("");

  const parentRef = React.useRef(null);

  const [filteredTokens, isTokenFilterActive] = useMemo(() => {
    return tokensSearchValue ? [filterTokens(tokensSearchValue, tokens), true] : [tokens, false];
  }, [tokens, tokensSearchValue]);

  const virtualizer = useVirtualizer({
    count: filteredTokens.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  });
  const items = virtualizer.getVirtualItems();

  const [paddingTop, paddingBottom] = useMemo(() => {
    return items.length > 0
      ? [
          Math.max(0, items[0].start),
          Math.max(8, virtualizer.getTotalSize() - items[items.length - 1].end),
        ]
      : [0, 8];
  }, [items, virtualizer]);
  const [tokenForPortfolio, setTokenForPortfolio] = useState<Currency | null>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setTokenForPortfolio(null);
    }, 400);
  }, [setIsOpen]);
  return (
    <Dialog isOpen={isOpen} setIsOpen={handleClose}>
      {tokenForPortfolio ? (
        <>
          <DialogHeader
            onClose={handleClose}
            onBack={() => {
              setTokenForPortfolio(null);
            }}
            title={tokenForPortfolio.name || "Unknown"}
          />
          {tokenForPortfolio.isToken && (
            <TokenPortfolioDialogContent
              onManageListAction={() => setIsOpen(false)}
              token={tokenForPortfolio}
            />
          )}
        </>
      ) : (
        <>
          <DialogHeader onClose={handleClose} title="Tokens allowed for trading" />

          {Boolean(tokens.length) && (
            <>
              <div className="w-full sm:w-[600px] max-h-[580px] h-[calc(100dvh-60px)] flex flex-col">
                <div className={clsx("card-spacing-x pb-3")}>
                  <SearchInput
                    value={tokensSearchValue}
                    onChange={(e) => setTokensSearchValue(e.target.value)}
                    placeholder={t("search_name_or_paste_address")}
                  />
                </div>
                <div className={clsxMerge("flex-grow flex min-h-0 overflow-hidden")}>
                  {Boolean(filteredTokens.length) && (
                    <>
                      <ScrollbarContainer
                        scrollableNodeProps={{
                          ref: parentRef,
                        }}
                        height="full"
                      >
                        <div
                          className={clsx(
                            "flex flex-col gap-2 md:gap-0 pl-4 md:pl-0 pr-4 md:pr-[11px] pb-2 pt-3 pl-2 pr-3",
                          )}
                          style={{
                            paddingTop,
                            paddingBottom,
                          }}
                        >
                          {items.map((item) => {
                            const token = filteredTokens[item.index];
                            // if (simpleForm)
                            return (
                              <TokenRowWithCheckbox
                                setTokenForPortfolio={setTokenForPortfolio}
                                setSelected={() => {
                                  const isInList = Boolean(
                                    internalTokens.find((_token) => _token.name === token.name),
                                  );

                                  if (isInList) {
                                    if (restrictDisable && restrictDisable.equals(token)) {
                                      return addToast(
                                        "You can't disable base order token",
                                        "warning",
                                      );
                                    }

                                    setInternalTokens(
                                      internalTokens.filter((_token) => _token.name !== token.name),
                                    );
                                  } else {
                                    setInternalTokens([...internalTokens, token]);
                                  }
                                }}
                                key={
                                  token.isToken
                                    ? token.address0
                                    : `native-${token.wrapped.address0}`
                                }
                                currency={token}
                                isSelected={
                                  !!internalTokens.find(
                                    (_token) => _token.wrapped.address0 === token.wrapped.address0,
                                  )
                                }
                              />
                            );
                          })}
                        </div>
                      </ScrollbarContainer>
                    </>
                  )}
                </div>
                {Boolean(filteredTokens.length) && (
                  <div className="grid grid-cols-2 gap-3 card-spacing-x border-t border-secondary-border py-5">
                    <Button
                      type="button"
                      fullWidth
                      colorScheme={ButtonColor.LIGHT_GREEN}
                      onClick={() => {
                        handleClose();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      fullWidth
                      onClick={() => {
                        handlePick(internalTokens);
                        handleClose();
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                )}
                {Boolean(!filteredTokens.length && isTokenFilterActive) && (
                  <div
                    className={clsx(
                      "flex items-center justify-center gap-2 flex-col h-full flex-grow w-full bg-empty-not-found-token bg-right-top bg-no-repeat max-md:bg-size-180 -mt-3",
                    )}
                  >
                    <span className="text-secondary-text">{t("token_not_found")}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </Dialog>
  );
}
