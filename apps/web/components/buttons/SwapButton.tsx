import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { ButtonHTMLAttributes, useState } from "react";

import { Field } from "@/app/[locale]/swap/stores/useSwapAmountsStore";
import Svg from "@/components/atoms/Svg";
import { ThemeColors } from "@/config/theme/colors";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: () => void;
  colorScheme?: ThemeColors;
}
export default function SwapButton({ onClick, colorScheme = ThemeColors.GREEN, ...props }: Props) {
  const t = useTranslations("A11y");
  const [effect, setEffect] = useState(false);

  return (
    <button
      aria-label={t("switch_tokens")}
      onClick={() => {
        setEffect(true);
        onClick();
      }}
      {...props}
      className={clsx(
        "group border-[3px] border-primary-bg !outline hover:!outline !outline-primary-bg w-10 h-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-secondary-bg rounded-full flex items-center justify-center duration-200  hover:shadow  before:opacity-0 before:duration-200 hover:before:opacity-60 before:absolute before:w-4 before:h-4 before:rounded-full before:bg-green-hover-icon before:blur-[20px]",
        colorScheme === ThemeColors.GREEN
          ? "text-green hover:!outline-green hover:shadow-green/60"
          : "text-purple hover:!outline-purple hover:shadow-purple/60",
      )}
    >
      <Svg
        className={clsx(
          effect ? "animate-swap" : "",
          "relative duration-200",
          colorScheme === ThemeColors.GREEN
            ? "group-hocus:text-green-hover-icon"
            : "group-hocus:text-purple-hover-icon",
        )}
        onAnimationEnd={() => setEffect(false)}
        iconName="swap"
      />
    </button>
  );
}
