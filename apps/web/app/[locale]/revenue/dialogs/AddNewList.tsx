import { useTranslations } from "next-intl";
import { useState } from "react";

import DialogHeader from "@/components/atoms/DialogHeader";
import RadioButton from "@/components/buttons/RadioButton";
import ImportListWithContract from "@/components/manage-tokens/ImportListWithContract";
import ImportListWithJSON from "@/components/manage-tokens/ImportListWithJSON";
import ImportListWithURL from "@/components/manage-tokens/ImportListWithURL";
import { ManageTokensDialogContent } from "@/components/manage-tokens/types";

interface Props {
  setContent: (content: ManageTokensDialogContent) => void;
  handleClose: () => void;
}
export default function AddNewList({ setContent, handleClose }: Props) {
  const t = useTranslations("ManageTokens");

  const [importType, setImportType] = useState<"url" | "json" | "contract">("contract");

  return (
    <>
      <DialogHeader onClose={handleClose} title="Add new list" />

      <div className="px-4 pb-4 md:px-10 md:pb-10 w-full md:w-[600px] h-[580px] flex flex-col">
        <h3 className="text-16 font-bold mb-1 text-secondary-text">{t("importing_type")}</h3>
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5">
          <RadioButton
            bgColor="bg-tertiary-bg"
            isActive={importType === "contract"}
            onClick={() => setImportType("contract")}
            className="pr-[9px]"
          >
            {t("contract")}
          </RadioButton>
          <RadioButton
            bgColor="bg-tertiary-bg"
            isActive={importType === "url"}
            onClick={() => setImportType("url")}
          >
            {t("URL")}
          </RadioButton>
          <RadioButton
            bgColor="bg-tertiary-bg"
            isActive={importType === "json"}
            onClick={() => setImportType("json")}
          >
            {t("JSON")}
          </RadioButton>
        </div>

        {importType === "url" && <ImportListWithURL setContent={setContent} />}
        {importType === "json" && <ImportListWithJSON setContent={setContent} />}
        {importType === "contract" && <ImportListWithContract setContent={setContent} />}
      </div>
    </>
  );
}
