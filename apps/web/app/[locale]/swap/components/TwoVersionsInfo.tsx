import clsx from "clsx";
import { useTranslations } from "next-intl";
import React from "react";

import { useTwoVersionsInfoStore } from "@/app/[locale]/swap/stores/useTwoVersionsInfoStore";
import Collapse from "@/components/atoms/Collapse";
import Svg from "@/components/atoms/Svg";

export default function TwoVersionsInfo() {
  const t = useTranslations("Swap");
  const { isOpened, setIsOpened } = useTwoVersionsInfoStore();

  return (
    <div className="overflow-hidden text-14 rounded-2 bg-gradient-to-r from-primary-bg to-secondary-bg">
      <button
        onClick={() => setIsOpened(!isOpened)}
        className="h-10 px-5 py-2 flex items-center justify-between font-medium w-full text-14 text-secondary-text bg-gradient-to-r via-50% via-primary-bg from-green-bg to-green-bg/0 border-l-4 border-green rounded-2"
      >
        {t("tokens_in_two_standards_title")}
        <Svg
          className={clsx(isOpened ? "-rotate-180" : "", "duration-200")}
          iconName="small-expand-arrow"
        />
      </button>
      <Collapse open={isOpened}>
        <div className="px-5 py-3 text-tertiary-text">
          {t.rich("tokens_in_two_standards_paragraph", {
            convert: (chunks) => (
              <a
                target="_blank"
                href="https://gorbatiukcom.github.io/token-converter/"
                className="text-green underline hocus:text-green-hover duration-200"
              >
                {chunks}
              </a>
            ),
          })}
        </div>
      </Collapse>
    </div>
  );
}
