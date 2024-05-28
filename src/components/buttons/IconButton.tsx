import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

import Svg from "@/components/atoms/Svg";
import { IconName } from "@/config/types/IconName";
import { clsxMerge } from "@/functions/clsxMerge";

export enum IconSize {
  SMALL = 20,
  REGULAR = 24,
  LARGE = 32,
}

export enum IconButtonSize {
  SMALL = 32,
  REGULAR = 40,
  LARGE = 48,
}

interface FrameProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconName: IconName;
  iconSize?: IconSize;
  buttonSize?: IconButtonSize;
  className?: string;
}
function IconButtonFrame({
  iconSize = IconSize.REGULAR,
  buttonSize = IconButtonSize.REGULAR,
  iconName,
  className,
  ...props
}: FrameProps) {
  return (
    <button
      className={clsx(
        buttonSize === IconButtonSize.SMALL && "w-8 h-8",
        buttonSize === IconButtonSize.REGULAR && "w-10 h-10",
        buttonSize === IconButtonSize.LARGE && "w-12 h-12",
        "flex justify-center items-center disabled:opacity-50 disabled:pointer-events-none",
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
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<FrameProps, "iconName"> &
  (
    | {
        variant: IconButtonVariant.DELETE;
        handleDelete: () => void;
      }
    | { variant: IconButtonVariant.CLOSE; handleClose: () => void }
    | { variant: IconButtonVariant.CONTROL; iconName: IconName }
    | { variant?: IconButtonVariant.DEFAULT | undefined; iconName: IconName; active?: boolean }
  );
export default function IconButton(_props: Props) {
  switch (_props.variant) {
    case IconButtonVariant.DEFAULT:
    case undefined: {
      const { active, iconName, ...props } = _props;
      return (
        <IconButtonFrame
          iconName={_props.iconName}
          className={clsxMerge(
            "text-primary-text rounded-full bg-transparent hover:bg-green-bg duration-200",
            active && "text-green",
          )}
          {...props}
        />
      );
    }
    case IconButtonVariant.DELETE: {
      const { handleDelete, ...props } = _props;

      return (
        <IconButtonFrame
          iconName="delete"
          onClick={_props.handleDelete}
          className="rounded-full bg-transparent hover:bg-red-bg text-tertiary-text hover:text-red duration-200"
          {...props}
        />
      );
    }
    case IconButtonVariant.CLOSE: {
      const { handleClose, ...props } = _props;

      return (
        <IconButtonFrame
          iconName="close"
          onClick={_props.handleClose}
          className="text-secondary-text hover:text-primary-text duration-200"
          {...props}
        />
      );
    }
    case IconButtonVariant.CONTROL: {
      const { iconName, buttonSize, ...props } = _props;

      return (
        <IconButtonFrame
          iconName={iconName}
          buttonSize={buttonSize || IconButtonSize.SMALL}
          className="rounded-2 hover:bg-green-bg bg-transparent duration-200 text-primary-text"
          {...props}
        />
      );
    }
  }
}
