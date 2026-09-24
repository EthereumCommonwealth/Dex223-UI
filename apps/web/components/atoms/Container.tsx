import { PropsWithChildren } from "react";

import { clsxMerge } from "@/functions/clsxMerge";

interface Props {
  className?: string;
  // Page content gets the same side gutter everywhere. Full-width chrome (header, footer,
  // banners) and containers nested inside cards manage their own padding and opt out.
  gutter?: boolean;
}

export default function Container({
  className,
  gutter = true,
  children,
}: PropsWithChildren<Props>) {
  return (
    <div
      className={clsxMerge(
        "max-w-[1406px] my-0 mx-auto",
        gutter && "px-4 md:px-6 lg:px-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
