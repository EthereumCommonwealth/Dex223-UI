import Tooltip from "@repo/ui/tooltip";
import { useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";

import { SearchInput } from "@/components/atoms/Input";
import ScrollbarContainer from "@/components/atoms/ScrollbarContainer";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor } from "@/components/buttons/Button";
import TokenListItem from "@/components/manage-tokens/TokenListItem";
import { ManageTokensDialogContent } from "@/components/manage-tokens/types";
import { db } from "@/db/db";
import { filterTokenLists } from "@/functions/searchTokens";
import { useTokenLists } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";

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

export default function TokenListsTab({
  setContent,
}: {
  setContent: (content: ManageTokensDialogContent) => void;
}) {
  const t = useTranslations("ManageTokens");
  const lists = useTokenLists();

  const [listSearchValue, setListSearchValue] = useState("");

  const [filteredLists, isListFilterActive] = useMemo(() => {
    return listSearchValue
      ? [lists && filterTokenLists(listSearchValue, lists), true]
      : [lists, false];
  }, [lists, listSearchValue]);

  return (
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
          className="rounded-r-0 xl:rounded-r-0 md:rounded-r-0 lg:rounded-r-0 sm:rounded-r-0 flex-grow"
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
                          (!totalTokensInOtherEnabledLists || totalTokensInOtherEnabledLists < 2)
                        ) {
                          addToast(t("cant_disable_list"), "warning");
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
          <span className="text-secondary-text">{t("list_not_found")}</span>
        </div>
      )}
    </div>
  );
}
