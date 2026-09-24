"use client";

import { useTranslations } from "next-intl";

import Svg from "@/components/atoms/Svg";
import { copyToClipboard } from "@/functions/copyToClipboard";
import addToast from "@/other/toast";

export default function CopyLinkButton() {
  const t = useTranslations("Post");

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await copyToClipboard(window.location.href);
          addToast(t("link_copied"));
        } catch {
          addToast(t("link_copy_failed"), "error");
        }
      }}
      className="flex-shrink-0 bg-tertiary-bg flex gap-1 items-center h-8 md:h-10 text-12 md:text-16 px-4 rounded-2 text-secondary-text hocus:text-primary-text hocus:bg-quaternary-bg duration-200"
    >
      <Svg className="text-tertiary-text !w-4 !h-4 md:!w-5 md:!h-5" iconName="copy" size={20} />
      {t("copy_link")}
    </button>
  );
}
