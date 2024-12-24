import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AutoSizer, List } from "react-virtualized";
import SimpleBar from "simplebar-react";

import Checkbox from "@/components/atoms/Checkbox";
import DialogHeader from "@/components/atoms/DialogHeader";
import { SearchInput } from "@/components/atoms/Input";
import ScrollbarContainer from "@/components/atoms/ScrollbarContainer";
import Svg from "@/components/atoms/Svg";
import Tooltip from "@/components/atoms/Tooltip";
import Button, { ButtonColor } from "@/components/buttons/Button";
import TabButton from "@/components/buttons/TabButton";
import ManageTokenItem from "@/components/manage-tokens/ManageTokenItem";
import TokenListItem from "@/components/manage-tokens/TokenListItem";
import { ManageTokensDialogContent } from "@/components/manage-tokens/types";
import { db } from "@/db/db";
import { filterTokenLists, filterTokens } from "@/functions/searchTokens";
import { useTokenLists, useTokens } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
import { Token } from "@/sdk_hybrid/entities/token";
import { useManageTokensDialogStore } from "@/stores/useManageTokensDialogStore";

interface Props {
  setContent: (content: ManageTokensDialogContent) => void;
  handleClose: () => void;
  setTokenForPortfolio: (token: Token) => void;
}

function ButtonTooltip({ text }: { text: string }) {
  return (
    <Tooltip
      customOffset={18}
      renderTrigger={(ref, refProps) => {
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            ref={ref.setReference}
            {...refProps}
            className="bg-green-bg text-secondary-text border-transparent border hocus:border-green hocus:bg-green-bg-hover hocus:text-primary-text w-12 h-full rounded-r-2 border-r-2 border-primary-bg flex items-center justify-center duration-200 cursor-pointer"
          >
            <Svg iconName="info" />
          </div>
        );
      }}
      text={text}
    />
  );
}
export default function TokensAndLists({ setContent, handleClose, setTokenForPortfolio }: Props) {
  const t = useTranslations("ManageTokens");
  const { activeTab, setActiveTab, scrollTo } = useManageTokensDialogStore();

  const lists = useTokenLists();
  const [onlyCustom, setOnlyCustom] = useState(false);

  const tokens = useTokens(onlyCustom);

  const [listSearchValue, setListSearchValue] = useState("");
  const [tokensSearchValue, setTokensSearchValue] = useState("");

  const [filteredTokens, isTokenFilterActive] = useMemo(() => {
    return tokensSearchValue ? [filterTokens(tokensSearchValue, tokens), true] : [tokens, false];
  }, [tokens, tokensSearchValue]);

  const [filteredLists, isListFilterActive] = useMemo(() => {
    return listSearchValue
      ? [lists && filterTokenLists(listSearchValue, lists), true]
      : [lists, false];
  }, [lists, listSearchValue]);

  const parentRef = React.useRef(null);

  const virtualizer = useVirtualizer({
    count: filteredTokens.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  });
  const items = virtualizer.getVirtualItems();

  const [paddingTop, paddingBottom] =
    items.length > 0
      ? [items[0].start, Math.max(0, virtualizer.getTotalSize() - items[items.length - 1].end)]
      : [0, 0];

  return (
    <>
      <DialogHeader onClose={handleClose} title={t("manage_tokens")} />

      <div className="w-full md:w-[600px] h-[580px] flex flex-col">
        <div className="grid grid-cols-2 bg-secondary-bg p-1 gap-1 rounded-3  mb-3 mx-4 md:mx-10">
          {[t("lists"), t("tokens")].map((title, index) => {
            return (
              <TabButton
                key={title}
                inactiveBackground="bg-primary-bg"
                size={48}
                active={index === activeTab}
                onClick={() => setActiveTab(index)}
              >
                {title}
              </TabButton>
            );
          })}
        </div>

        {activeTab === 0 && (
          <div className="flex-grow flex flex-col">
            <div className="flex gap-3 card-spacing-x">
              <SearchInput
                value={listSearchValue}
                onChange={(e) => setListSearchValue(e.target.value)}
                placeholder={t("search_list_name")}
              />
            </div>

            <div className="w-full flex items-center mt-3 gap-px card-spacing-x">
              <Button
                endIcon="import-list"
                colorScheme={ButtonColor.LIGHT_GREEN}
                onClick={() => setContent("import-list")}
                className="rounded-r-0 xl:rounded-r-0 md:rounded-r-0 flex-grow"
              >
                {t("import_list")}
              </Button>

              <ButtonTooltip text={t("import_list_tooltip")} />
            </div>

            {Boolean(filteredLists?.length) && (
              <div className="card-spacing-x">
                <ScrollbarContainer className="mt-3 -mr-3 pr-3 md:-mr-8 md:pr-8 " height={392}>
                  <div className="flex flex-col gap-3" id="manage-lists-container">
                    {filteredLists
                      ?.filter((l) => Boolean(l.list.tokens.length))
                      ?.map((tokenList) => {
                        return (
                          <TokenListItem
                            toggle={async () => {
                              const otherEnabledLists = lists?.filter(
                                (l) =>
                                  Boolean(l.enabled) &&
                                  Boolean(l.list.tokens.length) &&
                                  l.id !== tokenList.id,
                              );

                              const totalTokensInOtherEnabledLists = otherEnabledLists?.reduce(
                                (accumulator, currentValue) =>
                                  accumulator + currentValue.list.tokens.length,
                                0,
                              );

                              if (
                                tokenList.enabled &&
                                (!totalTokensInOtherEnabledLists ||
                                  totalTokensInOtherEnabledLists < 2)
                              ) {
                                addToast(
                                  "You can't disable this token list. Please, enable any other one and try again",
                                  "warning",
                                );
                                return;
                              }

                              (db.tokenLists as any).update(tokenList.id, {
                                enabled: !tokenList.enabled,
                              });
                            }}
                            tokenList={tokenList}
                            key={tokenList.id}
                          />
                        );
                      })}
                  </div>
                </ScrollbarContainer>
              </div>
            )}
            {Boolean(filteredLists && !filteredLists.length && isListFilterActive) && (
              <div className="flex items-center justify-center gap-2 flex-col h-full bg-empty-not-found-list bg-right-top bg-no-repeat max-md:bg-size-180">
                <span className="text-secondary-text">List not found</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 1 && (
          <div className="flex-grow flex flex-col ">
            <div className="flex gap-3 card-spacing-x">
              <SearchInput
                value={tokensSearchValue}
                onChange={(e) => setTokensSearchValue(e.target.value)}
                placeholder={t("search_name_or_paste_address")}
              />
            </div>

            <div className="w-full flex items-center mt-3 gap-px card-spacing-x">
              <Button
                endIcon="import-token"
                colorScheme={ButtonColor.LIGHT_GREEN}
                onClick={() => setContent("import-token")}
                className="rounded-r-0 xl:rounded-r-0 md:rounded-r-0 flex-grow"
              >
                {t("import_token")}
              </Button>

              <ButtonTooltip text={t("import_token_tooltip")} />
            </div>

            <div className="flex justify-between items-center my-3 card-spacing-x text-secondary-text">
              <div>
                {t("total")}{" "}
                {onlyCustom ? (
                  <>{t("custom_tokens_amount", { amount: tokens.length })}</>
                ) : (
                  tokens.length
                )}
              </div>
              <div>
                <Checkbox
                  checked={onlyCustom}
                  handleChange={() => setOnlyCustom(!onlyCustom)}
                  id="only-custom"
                  label={t("only_custom")}
                />
              </div>
            </div>
            <div className="bg-secondary-border h-px mx-4 md:mx-10" />

            <div className="flex flex-col flex-grow card-spacing-x">
              <div style={{ flex: "1 1 auto" }} className="pb-[1px] -mr-3 md:-mr-8">
                {Boolean(filteredTokens.length) && (
                  <SimpleBar
                    scrollableNodeProps={{
                      ref: parentRef,
                    }}
                    className="pr-3 md:pr-8 pt-3"
                    style={{ height: 350 }}
                    autoHide={false}
                  >
                    <div
                      style={{
                        paddingTop,
                        paddingBottom,
                      }}
                    >
                      {items.map((item) => (
                        <div
                          key={item.key}
                          data-index={item.index}
                          ref={virtualizer.measureElement}
                        >
                          <ManageTokenItem
                            setTokenForPortfolio={setTokenForPortfolio}
                            token={filteredTokens[item.index]}
                          />
                        </div>
                      ))}
                    </div>
                  </SimpleBar>
                )}
              </div>
            </div>
            {Boolean(!filteredTokens.length && onlyCustom && !isTokenFilterActive) && (
              <div className="flex items-center justify-center gap-2 flex-col h-full bg-empty-custom-token bg-right-top bg-no-repeat max-md:bg-size-180">
                <span className="text-secondary-text">{t("no_custom_yet")}</span>
              </div>
            )}
            {Boolean(!filteredTokens.length && isTokenFilterActive) && (
              <div className="flex items-center justify-center gap-2 flex-col h-full bg-empty-not-found-token bg-right-top bg-no-repeat max-md:bg-size-180">
                <span className="text-secondary-text">{t("token_not_found")}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
