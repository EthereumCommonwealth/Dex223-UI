import { useTranslations } from "next-intl";
import React from "react";

import DialogHeader from "@/components/atoms/DialogHeader";
import TabButton from "@/components/buttons/TabButton";
import TokenListsTab from "@/components/manage-tokens/TokenListsTab";
import TokensTab from "@/components/manage-tokens/TokensTab";
import { ManageTokensDialogContent } from "@/components/manage-tokens/types";
import { Token } from "@/sdk_bi/entities/token";
import { useManageTokensDialogStore } from "@/stores/useManageTokensDialogStore";

interface Props {
  setContent: (content: ManageTokensDialogContent) => void;
  handleClose: () => void;
  setTokenForPortfolio: (token: Token) => void;
}

export default function TokensAndLists({ setContent, handleClose, setTokenForPortfolio }: Props) {
  const t = useTranslations("ManageTokens");
  const { activeTab, setActiveTab, scrollTo } = useManageTokensDialogStore();

  return (
    <>
      <DialogHeader onClose={handleClose} title={t("manage_tokens")} />

      <div className="w-full md:w-[600px] h-[580px] flex flex-col">
        <div
          role="tablist"
          className="grid grid-cols-2 bg-secondary-bg p-1 gap-1 rounded-3  mb-3 mx-4 md:mx-10"
        >
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

        {activeTab === 0 && <TokenListsTab setContent={setContent} />}

        {activeTab === 1 && <TokensTab setTokenForPortfolio={setTokenForPortfolio} />}
      </div>
    </>
  );
}
