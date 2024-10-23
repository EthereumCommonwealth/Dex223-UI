import { useTranslations } from "next-intl";
import { ButtonHTMLAttributes, useCallback, useState } from "react";
import { MouseEvent } from "react";

import { SortingType } from "@/app/[locale]/borrow-market/components/BorrowMarketTable";
import Svg from "@/components/atoms/Svg";
import { IconName } from "@/config/types/IconName";
import { clsxMerge } from "@/functions/clsxMerge";
import { copyToClipboard } from "@/functions/copyToClipboard";
import addToast from "@/other/toast";
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
      className={clsxMerge(
        buttonSize === IconButtonSize.EXTRA_SMALL && "w-6 h-6",
        buttonSize === IconButtonSize.SMALL && "w-8 h-8",
        buttonSize === IconButtonSize.REGULAR && "w-10 h-10",
        buttonSize === IconButtonSize.LARGE && "w-12 h-12",
        clickableAreaSize === ClickableAreaSize.SMALL && "after:w-8 after:h-8",
        clickableAreaSize === ClickableAreaSize.REGULAR && "after:w-10 after:h-10",
        clickableAreaSize === ClickableAreaSize.SMALL && "after:w-12 after:h-12",
        "flex justify-center items-center disabled:opacity-50 disabled:pointer-events-none relative after:absolute after:left-1/2 after:top-1/2 after:-translate-x-1/2 after:-translate-y-1/2",
        className,
      )}
      {...props}
    >
      <Svg size={iconSize} iconName={iconName} />
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
}

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
    | { variant?: IconButtonVariant.DEFAULT | undefined; iconName: IconName; active?: boolean }
    | {
        variant: IconButtonVariant.SORTING;
        sorting: SortingType;
        handleSort?: () => void;
      }
  );

type CopyIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<FrameProps, "iconName"> & { text: string };

function CopyIconButton(_props: CopyIconButtonProps) {
  const t = useTranslations("Toast");
  const [isCopied, setIsCopied] = useState(false);
  const { text, buttonSize, className, ...props } = _props;

  const handleCopy = useCallback(async () => {
    await copyToClipboard(text);
    setIsCopied(true);
    addToast(t("successfully_copied"));
    setTimeout(() => {
      setIsCopied(false);
    }, 800);
  }, [t, text]);

  return (
    <IconButtonFrame
      iconName={isCopied ? "done" : "copy"}
      onClick={handleCopy}
      buttonSize={buttonSize || IconButtonSize.SMALL}
      className={clsxMerge(
        "hover:text-green duration-200 text-tertiary-text",
        className,
        isCopied && "text-green",
      )}
      {...props}
    />
  );
}
export default function IconButton(_props: Props) {
  switch (_props.variant) {
    case IconButtonVariant.DEFAULT:
    case undefined: {
      const { active, iconName, className, ...props } = _props;
      return (
        <IconButtonFrame
          iconName={_props.iconName}
          className={clsxMerge(
            "text-tertiary-text hocus:text-green-hover-icon relative before:opacity-0 before:duration-200 hocus:before:opacity-60 before:absolute before:w-4 before:h-4 before:rounded-full before:bg-green-hover-icon before:blur-[9px] duration-200",
            active && "text-green",
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
          onClick={_props.handleDelete}
          className={clsxMerge(
            "rounded-full bg-transparent hover:bg-red-bg text-tertiary-text hover:text-red duration-200",
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
          onClick={_props.handleAdd}
          className={clsxMerge(
            "bg-green text-black hover:bg-green-hover rounded-2 duration-200",
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
          onClick={(e) => _props.handleClose(e)}
          className={clsxMerge(
            "text-secondary-text hover:text-primary-text duration-200",
            className,
          )}
          {...props}
        />
      );
    }
    case IconButtonVariant.CONTROL: {
      const { iconName, buttonSize, className, ...props } = _props;

      return (
        <IconButtonFrame
          iconName={iconName}
          buttonSize={buttonSize || IconButtonSize.SMALL}
          className={clsxMerge(
            "rounded-2 hover:bg-green-bg bg-transparent duration-200 text-primary-text",
            className,
          )}
          {...props}
        />
      );
    }
    case IconButtonVariant.COPY: {
      return <CopyIconButton {..._props} />;
    }
  }
}
