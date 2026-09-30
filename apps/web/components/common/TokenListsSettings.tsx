import { useTranslations } from "next-intl";

import SelectButton from "@/components/atoms/SelectButton";
import Svg from "@/components/atoms/Svg";
import { useManageTokensDialogStore } from "@/stores/useManageTokensDialogStore";

export default function TokenListsSettings({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("ManageTokens");
  const { isOpen, setIsOpen } = useManageTokensDialogStore();

  return (
    <div>
      <SelectButton
        className="py-1 xl:py-2 text-14 xl:text-16 min-h-10 md:min-h-8 max-md:px-3 whitespace-nowrap w-full md:w-auto flex items-center justify-center text-secondary-text"
        withArrow={false}
        size="regular"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={compact ? t("manage_tokens") : undefined}
        title={compact ? t("manage_tokens") : undefined}
      >
        {/* On phones this is a full-width bottom-bar button and always keeps its label. */}
        <span className={compact ? "md:hidden" : undefined}>{t("manage_tokens")}</span>
        {compact && <Svg iconName="list-tokens" size={20} className="hidden md:block" />}
      </SelectButton>
    </div>
  );
}
