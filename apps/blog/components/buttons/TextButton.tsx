import clsx from "clsx";
import { ButtonHTMLAttributes, PropsWithChildren } from "react";

import Svg from "@/components/atoms/Svg";
import { IconName } from "@/config/types/IconName";
import { clsxMerge } from "@/functions/clsxMerge";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "green" | "secondary";
  endIcon?: IconName;
}

export default function TextButton({
  color = "green",
  endIcon,
  children,
  className,
  ...props
}: PropsWithChildren<Props>) {
  return (
    <button
      className={clsxMerge(
        "disabled:opacity-50 disabled:pointer-events-none disabled:text-tertiary-text rounded-2 flex items-center justify-center gap-2 px-6 duration-200",
        color === "green" && "text-green hocus:text-green-hover",
        color === "secondary" && "text-secondary-text hocus:text-green-hover",
        className,
      )}
      {...props}
    >
      {children}
      {endIcon && <Svg iconName={endIcon} />}
    </button>
  );
}
