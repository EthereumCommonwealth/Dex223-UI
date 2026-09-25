"use client";

import clsx from "clsx";

import { ChartRange } from "@/hooks/usePoolPriceChart";

const RANGES: ChartRange[] = [7, 30, 90];

export default function ChartRangeToggle({
  value,
  onChange,
}: {
  value: ChartRange;
  onChange: (days: ChartRange) => void;
}) {
  return (
    <div className="flex gap-1">
      {RANGES.map((days) => (
        <button
          key={days}
          type="button"
          onClick={() => onChange(days)}
          className={clsx(
            "px-2 h-7 rounded-2 text-12 duration-200",
            value === days
              ? "bg-green-bg text-primary-text border border-green"
              : "text-secondary-text hocus:text-primary-text",
          )}
        >
          {days}D
        </button>
      ))}
    </div>
  );
}
