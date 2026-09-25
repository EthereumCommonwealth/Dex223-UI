import { useTranslations } from "next-intl";
import { ButtonHTMLAttributes, MouseEvent, useCallback, useEffect, useState } from "react";

import Svg from "@/components/atoms/Svg";
import { ThemeColors } from "@/config/theme/colors";
import { IconName } from "@/config/types/IconName";
import { clsxMerge } from "@/functions/clsxMerge";
import { copyToClipboard } from "@/functions/copyToClipboard";
import addToast from "@/other/toast";

export enum SortingType {
  NONE = "none",
  ASCENDING = "asc",
  DESCENDING = "desc",
}
export enum IconSize {
  SMALL = 20,
  REGULAR = 24,
  LARGE = 32,
}

export enum IconButtonSize {
  EXTRA_SMALL = 24,
  SMALL = 32,
  REGULAR = 40,
  LARGE = 48,
}

export enum ClickableAreaSize {
  SMALL = 32,
  REGULAR = 40,
  LARGE = 48,
}

interface FrameProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconName: IconName;
  iconSize?: IconSize;
  buttonSize?: IconButtonSize;
  clickableAreaSize?: ClickableAreaSize;
  className?: string;
}
function IconButtonFrame({
  iconSize = IconSize.REGULAR,
  buttonSize = IconButtonSize.REGULAR,
  clickableAreaSize = ClickableAreaSize.REGULAR,
  iconName,
  className,
  ...props
}: FrameProps) {
  return (
    <button
      type="button"
      className={clsxMerge(
        buttonSize === IconButtonSize.EXTRA_SMALL && "w-6 h-6",
        buttonSize === IconButtonSize.SMALL && "w-8 h-8",
        buttonSize === IconButtonSize.REGULAR && "w-10 h-10",
        buttonSize === IconButtonSize.LARGE && "w-12 h-12",
        clickableAreaSize === ClickableAreaSize.SMALL && "after:w-8 after:h-8",
        clickableAreaSize === ClickableAreaSize.REGULAR && "after:w-10 after:h-10",
        clickableAreaSize === ClickableAreaSize.LARGE && "after:w-12 after:h-12",
        "flex justify-center items-center disabled:opacity-50 disabled:pointer-events-none relative after:absolute after:left-1/2 after:top-1/2 after:-translate-x-1/2 after:-translate-y-1/2",
        className,
      )}
      {...props}
    >
      <Svg size={iconSize} iconName={iconName} className="z-10 relative" />
    </button>
  );
}

export enum IconButtonVariant {
  DEFAULT,
  DELETE,
  CLOSE,
  CONTROL,
  COPY,
  SORTING,
  ADD,
  BACK,
}

// Default names for icon-only buttons whose icon says what they do.
type IconLabelKey =
  | "recent_transactions"
  | "network_fee_settings"
  | "settings"
  | "zoom_in"
  | "zoom_out"
  | "reset"
  | "add"
  | "decrease"
  | "open_link";
const iconLabelKeys: Partial<Record<IconName, IconLabelKey>> = {
  "recent-transactions": "recent_transactions",
  "gas-edit": "network_fee_settings",
  settings: "settings",
  "zoom-in": "zoom_in",
  "zoom-out": "zoom_out",
  reset: "reset",
  add: "add",
  minus: "decrease",
  forward: "open_link",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<FrameProps, "iconName"> &
  (
    | {
        variant: IconButtonVariant.DELETE;
        handleDelete: () => void;
      }
    | {
        variant: IconButtonVariant.ADD;
        handleAdd: () => void;
      }
    | {
        variant: IconButtonVariant.CLOSE;
        handleClose: (e: MouseEvent<HTMLButtonElement>) => void;
      }
    | { variant: IconButtonVariant.CONTROL; iconName: IconName }
    | { variant: IconButtonVariant.COPY; text: string }
    | { variant: IconButtonVariant.BACK; iconName?: IconName }
    | {
        variant?: IconButtonVariant.DEFAULT | undefined;
        iconName: IconName;
        active?: boolean;
        colorScheme?: ThemeColors;
      }
    | {
        variant: IconButtonVariant.SORTING;
        sorting: SortingType;
        handleSort?: () => void;
      }
  );

type CopyIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<FrameProps, "iconName"> & { text: string; isTouchDevice?: boolean };

function CopyIconButton(_props: CopyIconButtonProps) {
  const t = useTranslations("Toast");
  const tA11y = useTranslations("A11y");
  const [isCopied, setIsCopied] = useState(false);
  const { text, buttonSize, className, isTouchDevice, ...props } = _props;

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(text);
      setIsCopied(true);
      addToast(t("successfully_copied"));
      setTimeout(() => {
        setIsCopied(false);
      }, 800);
    } catch (e) {
      addToast("Clipboard API not supported", "error");
    }
  }, [t, text]);

  return (
    <div className="relative">
      <IconButtonFrame
        iconName={"done"}
        onClick={handleCopy}
        // Visual "copied" state only; the button below is the one users reach.
        tabIndex={-1}
        aria-hidden
        buttonSize={buttonSize || IconButtonSize.SMALL}
        className={clsxMerge(
          "duration-200 text-tertiary-text absolute text-green pointer-events-none",
          className,
          isCopied ? "opacity-100" : "opacity-0",
        )}
        {...props}
      />
      <IconButtonFrame
        iconName={"copy"}
        onClick={handleCopy}
        aria-label={tA11y("copy")}
        buttonSize={buttonSize || IconButtonSize.SMALL}
        className={clsxMerge(
          "duration-200 text-tertiary-text ",
          className,
          isCopied ? "opacity-0" : "opacity-100",
          !isTouchDevice && "hocus:text-green",
        )}
        {...props}
      />
    </div>
  );
}
export default function IconButton(_props: Props) {
  // Icon-only buttons need a text name for screen readers; callers can still pass aria-label.
  const t = useTranslations("A11y");
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
    }
  }, []);

  switch (_props.variant) {
    case IconButtonVariant.DEFAULT:
    case undefined: {
      const { active, iconName, className, colorScheme = ThemeColors.GREEN, ...props } = _props;
      const labelKey = iconLabelKeys[iconName];
      return (
        <IconButtonFrame
          iconName={_props.iconName}
          aria-label={labelKey ? t(labelKey) : undefined}
          className={clsxMerge(
            "text-tertiary-text relative before:opacity-0 before:duration-200 hocus:before:opacity-60 before:absolute before:w-4 before:h-4 before:rounded-full before:blur-[9px] duration-200",
            active && (colorScheme === ThemeColors.GREEN ? "text-green" : "text-purple"),
            !isTouchDevice &&
              (colorScheme === ThemeColors.GREEN
                ? "hocus:text-green-hover-icon before:bg-green-hover-icon"
                : "hocus:text-purple-hover-icon before:bg-purple-hover-icon"),
            className,
          )}
          {...props}
        />
      );
    }

    case IconButtonVariant.SORTING:
      const { handleSort, sorting, className, ...props } = _props;

      return (
        <IconButtonFrame
          iconName="sort"
          aria-label={t("sort")}
          onClick={handleSort}
          className={clsxMerge(
            "text-primary-text rounded-full bg-transparent duration-200",
            sorting === SortingType.ASCENDING && "sorting-asc",
            sorting === SortingType.DESCENDING && "sorting-desc",
            className,
          )}
          {...props}
        />
      );

    case IconButtonVariant.DELETE: {
      const { handleDelete, className, ...props } = _props;

      return (
        <IconButtonFrame
          iconName="delete"
          aria-label={t("delete")}
          onClick={_props.handleDelete}
          className={clsxMerge(
            "rounded-full before:rounded-full before:z-0 before:blur bg-transparent duration-200 before:opacity-0 before:duration-200 hocus:before:opacity-100 text-tertiary-text before:absolute before:w-8 before:h-8 before:bg-red-bg hocus:text-red-light-hover",
            className,
          )}
          {...props}
        />
      );
    }
    case IconButtonVariant.ADD: {
      const { handleAdd, className, ...props } = _props;

      return (
        <IconButtonFrame
          iconName="add"
          aria-label={t("add")}
          onClick={_props.handleAdd}
          className={clsxMerge(
            "bg-green-bg-hover text-secondary-text hocus:text-primary-text hocus:border-green hocus:border rounded-2 duration-200 disabled:bg-tertiary-bg disabled:text-tertiary-text disabled:opacity-100",
            className,
          )}
          {...props}
        />
      );
    }
    case IconButtonVariant.CLOSE: {
      const { handleClose, className, ...props } = _props;

      return (
        <IconButtonFrame
          iconName="close"
          aria-label={t("close")}
          onClick={(e) => _props.handleClose(e)}
          className={clsxMerge(
            "text-secondary-text hocus:text-primary-text duration-200",
            className,
          )}
          {...props}
        />
      );
    }

    case IconButtonVariant.BACK: {
      const { className, iconName, ...props } = _props;

      return (
        <IconButtonFrame
          iconName={iconName ? iconName : "back"}
          aria-label={t("back")}
          className={clsxMerge(
            "text-secondary-text hocus:text-primary-text duration-200",
            className,
          )}
          {...props}
        />
      );
    }

    case IconButtonVariant.CONTROL: {
      const { iconName, buttonSize, className, ...props } = _props;
      const labelKey = iconLabelKeys[iconName];

      return (
        <IconButtonFrame
          iconName={iconName}
          aria-label={labelKey ? t(labelKey) : undefined}
          buttonSize={buttonSize || IconButtonSize.SMALL}
          className={clsxMerge(
            "rounded-2 hocus:bg-green-bg bg-primary-bg duration-200 text-tertiary-text hocus:text-primary-text",
            className,
          )}
          {...props}
        />
      );
    }
    case IconButtonVariant.COPY: {
      return <CopyIconButton isTouchDevice={isTouchDevice} {..._props} />;
    }
  }
}
