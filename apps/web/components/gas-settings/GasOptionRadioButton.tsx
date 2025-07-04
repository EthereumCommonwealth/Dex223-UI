import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import React, { ReactNode } from "react";

import Svg from "@/components/atoms/Svg";
import { ThemeColors } from "@/config/theme/colors";
import { IconName } from "@/config/types/IconName";
import { useColorScheme } from "@/lib/color-scheme";

interface Props {
  gasPriceGWEI: string | undefined;
  gasPriceCurrency: string;
  gasPriceUSD: string;
  tooltipText: string;
  title: string;
  iconName: Extract<IconName, "cheap-gas" | "custom-gas" | "fast-gas" | "auto-increase">;
  customContent?: ReactNode;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}
export default function GasOptionRadioButton({
  onClick,
  gasPriceGWEI,
  gasPriceCurrency,
  gasPriceUSD,
  tooltipText,
  title,
  iconName,
  customContent,
  isActive,
  disabled,
}: Props) {
  const colorScheme = useColorScheme();

  return (
    <div
      onClick={onClick}
      className={clsx(
        "w-full rounded-3 bg-tertiary-bg group cursor-pointer",
        isActive && "cursor-auto",
        disabled && "pointer-events-none",
      )}
    >
      <div
        className={clsx(
          "flex justify-between px-5 items-center min-h-12 md:min-h-[60px] duration-200",
          !!customContent
            ? "border-primary-bg rounded-t-3 border-b"
            : "border-primary-bg rounded-3",
          !isActive &&
            {
              [ThemeColors.GREEN]: "group-hocus:bg-green-bg",
              [ThemeColors.PURPLE]: "group-hocus:bg-purple-bg",
            }[colorScheme],
          disabled && "opacity-50",
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              "w-4 h-4 duration-200 before:duration-200 border bg-secondary-bg rounded-full before:w-2.5 before:h-2.5 before:absolute before:top-1/2 before:rounded-full before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 relative",
              isActive
                ? {
                    [ThemeColors.GREEN]: "border-green before:bg-green",
                    [ThemeColors.PURPLE]: "border-purple before:bg-purple",
                  }[colorScheme]
                : {
                    [ThemeColors.GREEN]: "border-secondary-border group-hocus:border-green",
                    [ThemeColors.PURPLE]: "border-secondary-border group-hocus:border-purple",
                  }[colorScheme],
            )}
          />

          <span
            className={clsx(
              isActive
                ? {
                    [ThemeColors.GREEN]: "text-green",
                    [ThemeColors.PURPLE]: "text-purple ",
                  }[colorScheme]
                : "text-tertiary-text group-hocus:text-primary-text",
              "duration-200",
            )}
          >
            <Svg iconName={iconName} />
          </span>
          <div className="flex flex-col md:flex-row md:items-center md:gap-2">
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  isActive
                    ? "text-primary-text"
                    : "text-secondary-text group-hocus:text-primary-text",
                  "duration-200 font-bold text-14 md:text-16",
                )}
              >
                {title}
              </span>

              <span className="text-tertiary-text">
                <Tooltip iconSize={20} text={tooltipText} />
              </span>
            </div>
            <span
              className={clsx(
                isActive
                  ? "text-secondary-text"
                  : "text-tertiary-text group-hocus:text-secondary-text",
                "duration-200 text-12 md:text-16",
              )}
            >
              {gasPriceUSD}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={clsx(
              isActive ? "text-primary-text" : "text-secondary-text group-hocus:text-primary-text",
              "duration-200  text-12 md:text-16",
            )}
          >
            {gasPriceCurrency}
          </span>
          <span
            className={clsx(
              isActive ? "text-tertiary-text" : "text-tertiary-text",
              "duration-200  text-12 md:text-14",
            )}
          >
            {gasPriceGWEI}
          </span>
        </div>
      </div>
      {customContent}
    </div>
  );
}
