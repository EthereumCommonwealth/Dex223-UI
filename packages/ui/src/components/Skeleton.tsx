import { CSSProperties, HTMLAttributes } from "react";

import { clsxMerge } from "../functions/clsxMerge";

interface Props extends HTMLAttributes<HTMLDivElement> {
  shape?: "rect" | "circle";
  animationDuration?: string;
}

export default function Skeleton({ shape = "rect", animationDuration = "1.5s", className }: Props) {
  return (
    <div
      className={clsxMerge(
        // The shimmer is decorative; with reduced motion the block is shown without it.
        "ui-bg-primary-bg ui-relative ui-overflow-hidden before:ui-animate-shimmer before:ui-absolute before:ui-top-0 before:ui-left-[-100%] before:ui-w-[200%] before:ui-h-full before:ui-bg-gradient-to-r before:ui-from-transparent before:ui-via-quaternary-bg before:ui-to-transparent motion-reduce:before:ui-hidden",
        // Rects use the app's 8px control radius (short bars still read as pills); the old
        // unprefixed rounded-20 turned every rect into an 80px capsule.
        shape === "rect" ? "ui-rounded-2" : "ui-rounded-full",
        className,
      )}
      style={{ "--shimmer-duration": animationDuration } as CSSProperties}
    />
  );
}
