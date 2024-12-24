import clsx from "clsx";
import { ReactNode } from "react";

import Svg from "@/components/atoms/Svg";

export enum PositionRangeStatus {
  IN_RANGE = "in-range",
  OUT_OF_RANGE = "out-of-range",
  CLOSED = "closed",
}
interface Props {
  status: PositionRangeStatus;
}

const iconsMap: Record<PositionRangeStatus, ReactNode> = {
  [PositionRangeStatus.IN_RANGE]: (
    <div className="w-4 h-4 md:w-6 md:h-6 flex justify-center items-center">
      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green" />
    </div>
  ),
  [PositionRangeStatus.OUT_OF_RANGE]: (
    <Svg iconName="error" size={24} className="max-w-4 max-h-4 md:max-w-6 md:max-h-6" />
  ),
  [PositionRangeStatus.CLOSED]: (
    <Svg iconName="closed" size={24} className="max-w-4 max-h-4 md:max-w-6 md:max-h-6" />
  ),
};

const textMap: Record<PositionRangeStatus, string> = {
  [PositionRangeStatus.IN_RANGE]: "In range",
  [PositionRangeStatus.OUT_OF_RANGE]: "Out of range",
  [PositionRangeStatus.CLOSED]: "Closed",
};

const textColorMap: Record<PositionRangeStatus, string> = {
  [PositionRangeStatus.IN_RANGE]: "text-green",
  [PositionRangeStatus.OUT_OF_RANGE]: "text-orange",
  [PositionRangeStatus.CLOSED]: "text-tertiary-text",
};
export default function RangeBadge({ status }: Props) {
  return (
    <div
      className={clsx(
        "rounded-5 py-1 flex items-center gap-1 font-medium text-12 md:text-16 text-nowrap",
        textColorMap[status],
      )}
    >
      {textMap[status]}
      {iconsMap[status]}
    </div>
  );
}
