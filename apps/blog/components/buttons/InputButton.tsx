import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  isActive: boolean;
}

export default function InputButton({ text, isActive, ...props }: Props) {
  return (
    <button
      {...props}
      className={clsx(
        "rounded-5 px-2 text-12 py-0.5 border hocus:bg-green-bg duration-200",
        isActive
          ? "text-green shadow shadow-green/60 border-green bg-green-bg"
          : "text-green bg-tertiary-bg border-transparent ",
      )}
    >
      {text}
    </button>
  );
}
