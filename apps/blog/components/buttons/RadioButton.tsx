import clsx from "clsx";
import React, { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { clsxMerge } from "@/functions/clsxMerge";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
  onClick: () => void;
  bgColor?: "bg-tertiary-bg" | "bg-quaternary-bg";
}

export default function RadioButton({
  isActive,
  children,
  className,
  bgColor = "bg-quaternary-bg",
  ...props
}: PropsWithChildren<Props>) {
  return (
    <button
      className={clsxMerge(
        "duration-200 items-baseline text-14 md:text-16 pt-3 pb-3 min-h-12 flex px-4 md:px-4 lg:px-5 rounded-3 group gap-x-2 md:gap-2  disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "text-primary-text"
          : "text-secondary-text hocus:bg-green-bg  hocus:text-primary-text",
        bgColor,
        className,
      )}
      {...props}
    >
      <span
        className={clsx(
          "flex-shrink-0 duration-200 w-4 h-4  rounded-full border relative bg-secondary-bg top-[3px]",
          isActive ? "border-green" : "border-secondary-border group-hocus:border-green",
        )}
      >
        <span
          className={clsx(
            "duration-200 w-2.5 h-2.5 rounded-full bg-green absolute inset-0 m-auto",
            isActive ? "opacity-100 shadow shadow-green/60" : "opacity-0",
          )}
        />
      </span>
      {children}
    </button>
  );
}
