import { useTranslations } from "next-intl";
import React from "react";

import PositionProgressBar from "@/app/[locale]/margin-trading/components/PositionProgressBar";
import { OrderInfoCard } from "@/app/[locale]/margin-trading/components/widgets/OrderInfoBlock";
import timestampToDateString from "@/app/[locale]/margin-trading/helpers/timestampToDateString";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";

export default function ActivePositionTimeframeBlock({ position }: { position: MarginPosition }) {
  const t = useTranslations("Margin");

  return (
    <div className="bg-primary-bg rounded-5 px-10 pt-4 pb-5 flex flex-col gap-3 mb-5">
      <h3 className="text-20 text-secondary-text font-medium">{t("time_frame")}</h3>
      <div className="grid grid-cols-2 gap-3">
        <OrderInfoCard
          value={t("duration_days", {
            count: (position.deadline - position.createdAt) / 60 / 60 / 24,
          })}
          title={t("margin_position_duration")}
          tooltipText={t("margin_position_duration_tooltip")}
          bg="margin_positions_duration"
        />
        <OrderInfoCard
          value={timestampToDateString(position.deadline, { withUTC: false, withSeconds: true })}
          title={t("margin_position_deadline")}
          tooltipText={t("margin_position_deadline_tooltip")}
          bg="deadline"
        />
      </div>
      <PositionProgressBar position={position} />
    </div>
  );
}
