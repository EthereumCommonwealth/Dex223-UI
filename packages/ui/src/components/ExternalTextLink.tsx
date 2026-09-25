import { AnchorHTMLAttributes } from "react";
import { clsxMerge } from "../functions/clsxMerge";
import ForwardIcon from "../icons/ForwardIcon";

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
      rel="noopener noreferrer"
      href={href}
      className={clsxMerge(
        "ui-flex ui-items-center ui-duration-200",
        color === "green" ? "ui-text-green hocus:ui-text-green-hover" : "ui-text-white hocus:ui-text-green",
        className,
      )}
    >
      <span className={textClassname}>{text}</span>
      <ForwardIcon className="ui-flex-shrink-0" size={arrowSize} />
    </a>
  );
}