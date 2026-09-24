import clsx from "clsx";
import { ButtonHTMLAttributes, PropsWithChildren } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  size: 28 | 32 | 40 | 48 | 60;
  active: boolean;
  inactiveBackground?: "bg-secondary-bg" | "bg-primary-bg";
  className?: string;
}
export default function TabButton({
  size,
  active,
  inactiveBackground = "bg-secondary-bg",
  className,
  children,
  ...props
}: PropsWithChildren<Props>) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={clsx(
        "rounded-2 md:hocus:bg-green-bg transition-colors duration-200 border md:px-4 px-2",
        size === 28 && "h-7 text-12",
        size === 32 && "h-8 text-12",
        size === 40 && "h-10 text-16",
        size === 48 && "h-10 lg:h-12 text-14 lg:text-16",
        size === 60 && "h-[60px] text-18",
        active
          ? "text-primary-text border-green bg-green-bg pointer-events-none"
          : "text-secondary-text border-transparent " + inactiveBackground,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
