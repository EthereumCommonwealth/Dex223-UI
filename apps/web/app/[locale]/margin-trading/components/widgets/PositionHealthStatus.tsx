import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { ReactNode, useMemo } from "react";

import Svg from "@/components/atoms/Svg";
import { formatFloat } from "@/functions/formatFloat";

enum DangerStatus {
  STABLE,
  RISKY,
  DANGEROUS,
}

const balanceCardBackgroundMap: Record<DangerStatus, string> = {
  [DangerStatus.STABLE]: "bg-green-bg border-green",
  [DangerStatus.RISKY]: "bg-yellow-bg border-yellow",
  [DangerStatus.DANGEROUS]: "bg-red-bg border-red-light",
};

const balanceCardTextColorMap: Record<DangerStatus, string> = {
  [DangerStatus.STABLE]: "text-green",
  [DangerStatus.RISKY]: "text-yellow-light",
  [DangerStatus.DANGEROUS]: "text-red-light",
};

const dangerIconsMap: Record<DangerStatus, ReactNode> = {
  [DangerStatus.RISKY]: <Svg iconName="warning" />,
  [DangerStatus.DANGEROUS]: <Svg iconName="warning" />,
  [DangerStatus.STABLE]: <Svg iconName="done" />,
};

export default function PositionHealthStatus({ health }: { health: number }) {
  const t = useTranslations("Margin");
  const dangerStatus = useMemo(() => {
    if (health <= 1) {
      return DangerStatus.DANGEROUS;
    }

    if (health < 1.1) {
      return DangerStatus.RISKY;
    }

    return DangerStatus.STABLE;
  }, [health]);

  return (
    <div
      className={clsx(
        "flex border  gap-1 py-2 rounded-2 px-5 items-center",
        balanceCardBackgroundMap[dangerStatus],
      )}
    >
      <span className={balanceCardTextColorMap[dangerStatus]}>{dangerIconsMap[dangerStatus]}</span>
      {t("health_label")}{" "}
      <span className={clsx("font-medium", balanceCardTextColorMap[dangerStatus])}>
        {formatFloat(health)}
      </span>
      <Tooltip text={t("health_tooltip")} iconSize={20} />
    </div>
  );
}
