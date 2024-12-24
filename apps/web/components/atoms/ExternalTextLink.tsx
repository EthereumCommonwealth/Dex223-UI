import clsx from "clsx";
import { AnchorHTMLAttributes } from "react";

import Svg from "@/components/atoms/Svg";
import { clsxMerge } from "@/functions/clsxMerge";

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  text: string;
  href: string;
  arrowSize?: number;
  color?: "green" | "white";
  textClassname?: string;
}

export default function ExternalTextLink({
  text,
  href,
  color = "green",
  className,
  arrowSize = 24,
  textClassname,
  ...props
}: Props) {
  return (
    <a
      {...props}
      target="_blank"
      href={href}
      className={clsxMerge(
        "flex items-center duration-200",
        color === "green" ? "text-green hocus:text-green-hover" : "text-white hocus:text-green",
        className,
      )}
    >
      <span className={textClassname}>{text}</span>
      <Svg className="flex-shrink-0" iconName="forward" size={arrowSize} />
    </a>
  );
}
