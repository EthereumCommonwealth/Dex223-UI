import clsx from "clsx";
import React from "react";

import { MarginPosition } from "@/app/[locale]/margin-trading/types";

enum DangerStatus {
  STABLE,
  RISKY,
  DANGEROUS,
}

const progressBarBackgroundMap: Record<DangerStatus, string> = {
  [DangerStatus.STABLE]: "bg-gradient-progress-bar-green",
  [DangerStatus.RISKY]: "bg-gradient-progress-bar-yellow",
  [DangerStatus.DANGEROUS]: "bg-gradient-progress-bar-red",
};

export default function PositionProgressBar({
  position,
  dangerStatus = DangerStatus.STABLE,
}: {
  position: MarginPosition;
  dangerStatus?: DangerStatus;
}) {
  const createdAtMs = position.createdAt * 1000;
  const deadlineMs = +position.deadline * 1000;
  const now = Date.now();

  const totalDuration = deadlineMs - createdAtMs;
  const elapsed = Math.min(Math.max(now - createdAtMs, 0), totalDuration); // clamp between 0 and total
  const progress = (elapsed / totalDuration) * 100;

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, "0");

    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());

    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());

    return `${dd}.${MM}.${yyyy} ${hh}:${mm}:${ss}`;
  };

  return (
    <div className="mt-2">
      <div className="grid grid-cols-3 mb-1">
        <div className="text-secondary-text">{formatDateTime(createdAtMs)}</div>
        <div className="text-center text-18 ">{Math.floor(progress)}%</div>
        <div className="text-secondary-text text-right">{formatDateTime(deadlineMs)}</div>
      </div>
      <div className="bg-secondary-bg h-5 relative rounded">
        <div
          className={clsx(
            "absolute h-full left-0 top-0 rounded",
            progressBarBackgroundMap[dangerStatus],
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
