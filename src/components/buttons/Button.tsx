import clsx from "clsx/lite";
import { ButtonHTMLAttributes } from "react";

import Svg from "@/components/atoms/Svg";
import { IconName } from "@/config/types/IconName";
import { clsxMerge } from "@/functions/clsxMerge";

export const enum ButtonVariant {
  CONTAINED = "contained",
  OUTLINED = "outlined",
}

export const enum ButtonSize {
  EXTRA_SMALL = 20,
  SMALL = 32,
  MEDIUM = 40,
  LARGE = 48,
  EXTRA_LARGE = 60,
}

export const enum ButtonColor {
  GREEN,
  RED,
  LIGHT_GREEN,
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  colorScheme?: ButtonColor;
  mobileSize?: ButtonSize;
  tabletSize?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  CommonProps &
  (
    | {
        endIcon?: IconName;
        startIcon?: never;
      }
    | { startIcon?: IconName; endIcon?: never }
  );

const buttonVariantClassnameMap: Record<ButtonVariant, Record<ButtonColor, string>> = {
  [ButtonVariant.CONTAINED]: {
    [ButtonColor.RED]: "bg-red text-primary-text hover:bg-red-hover",
    [ButtonColor.GREEN]: "bg-green text-black hover:bg-green-hover",
    [ButtonColor.LIGHT_GREEN]:
      "bg-green-bg text-secondary-text border-transparent border hover:border-green hover:bg-green-bg-hover hover:text-primary-text",
  },
  [ButtonVariant.OUTLINED]: {
    [ButtonColor.RED]:
      "border border-primary text-secondary-text hover:bg-red-bg hover:border-primary-text hover:text-primary-text",
    [ButtonColor.GREEN]: "border border-green text-primary-text hover:bg-green-bg",
    [ButtonColor.LIGHT_GREEN]:
      "bg-green-bg text-primary-text border-transparent border hover:border-green",
  },
};

const buttonSizeClassnameMap: Record<ButtonSize, string> = {
  [ButtonSize.EXTRA_SMALL]: "xl:text-12 xl:min-h-5 xl:rounded-20 xl:px-4",
  [ButtonSize.SMALL]: "xl:text-14 xl:font-medium xl:min-h-8 xl:rounded-20 xl:px-6",
  [ButtonSize.MEDIUM]: "xl:text-16 xl:font-medium xl:min-h-10 xl:rounded-2 xl:px-6",
  [ButtonSize.LARGE]: "xl:text-16 xl:font-medium xl:min-h-12 xl:rounded-3 xl:px-6",
  [ButtonSize.EXTRA_LARGE]: "xl:text-18 xl:font-medium xl:min-h-[60px] xl:rounded-3 xl:px-6",
};

const tabletButtonSizeClassnameMap: Record<ButtonSize, string> = {
  [ButtonSize.EXTRA_SMALL]: "md:text-12 md:min-h-5 md:rounded-20 md:px-4",
  [ButtonSize.SMALL]: "md:text-14 md:font-medium md:min-h-8 md:rounded-20 md:px-6",
  [ButtonSize.MEDIUM]: "md:text-16 md:font-medium md:rounded-2 md:min-h-10 md:px-6",
  [ButtonSize.LARGE]: "md:text-16 md:font-medium md:rounded-3 md:min-h-12 md:px-6",
  [ButtonSize.EXTRA_LARGE]: "md:text-18 md:font-medium md:rounded-3 md:min-h-[60px] md:px-6",
};

const mobileButtonSizeClassnameMap: Record<ButtonSize, string> = {
  [ButtonSize.EXTRA_SMALL]: "text-12 min-h-5 rounded-20 px-4",
  [ButtonSize.SMALL]: "text-14 font-medium rounded-2 min-h-8 px-6",
  [ButtonSize.MEDIUM]: "text-16 font-medium rounded-2 min-h-10 px-6",
  [ButtonSize.LARGE]: "text-16 font-medium rounded-3 min-h-12 px-6",
  [ButtonSize.EXTRA_LARGE]: "text-18 font-medium rounded-3 min-h-[60px] px-6",
};

const disabledClassnameMap: Record<ButtonVariant, string> = {
  [ButtonVariant.CONTAINED]: "disabled:bg-quaternary-bg disabled:text-secondary-text",
  [ButtonVariant.OUTLINED]: "disabled:text-secondary-text disabled:border-secondary-border",
};

export default function Button({
  variant = ButtonVariant.CONTAINED,
  size = ButtonSize.LARGE,
  mobileSize,
  tabletSize,
  startIcon,
  endIcon,
  fullWidth,
  colorScheme = ButtonColor.GREEN,
  children,
  className,
  isLoading,
  ...props
}: Props) {
  const _mobileSize = mobileSize || size;
  const _tabletSize = tabletSize || size;

  return (
    <button
      className={clsxMerge(
        "flex items-center justify-center gap-2 duration-200 disabled:pointer-events-none",
        buttonVariantClassnameMap[variant][colorScheme],
        buttonSizeClassnameMap[size],
        tabletButtonSizeClassnameMap[_tabletSize],
        mobileButtonSizeClassnameMap[_mobileSize],
        fullWidth && "w-full",
        disabledClassnameMap[variant],
        isLoading && "opacity-50 pointer-events-none",
        className,
      )}
      {...props}
    >
      {startIcon && <Svg iconName={startIcon} />}
      {children}
      {endIcon && <Svg iconName={endIcon} />}
    </button>
  );
}
