import clsx from "clsx";
import Image from "next/image";
import { PropsWithChildren } from "react";

import Svg from "@/components/atoms/Svg";

export default function SelectOption({
  onClick,
  isActive,
  disabled = false,
  children,
}: PropsWithChildren<{ onClick: any; isActive: boolean; disabled?: boolean }>) {
  return (
    <button
      onClick={onClick}
      className={clsx(
<<<<<<< HEAD
        "flex gap-2 items-center py-3 px-5 bg-primary-bg hocus:bg-green-bg duration-200 w-full",
=======
        "flex gap-2 items-center py-3 px-5 bg-primary-bg hocus:bg-quaternary-bg duration-200 w-full",
>>>>>>> b44a3b58fd2a351d754c5c9202d7c40eb76eeaed
        isActive && "text-green pointer-events-none",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {children}

      {isActive && <Svg className="ml-auto" iconName="check" />}
    </button>
  );
}
