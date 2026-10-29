import Alert from "@repo/ui/alert";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  formatFrozenAt,
  formatGroupedAmount,
  formatMaintenancePercent,
  fullDurationInterest,
  liquidationLevel,
} from "@/app/[locale]/margin-trading/helpers/liquidationMath";
import useMaintenanceMarginBps from "@/app/[locale]/margin-trading/hooks/useMaintenanceMarginBps";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";

const DASH = "—";

export default function FrozenPositionAlert({
  position,
  frozenTime,
  isLiquidatable,
  isKnown,
  actualBalance,
}: {
  position: MarginPosition;
  frozenTime: number;
  isLiquidatable: boolean;
  isKnown: boolean;
  actualBalance: bigint | undefined;
}) {
  const t = useTranslations("Margin");
  const maintenanceBps = useMaintenanceMarginBps();
  const symbol = position.loanAsset.symbol || t("unknown");

  const level = useMemo(() => {
    if (maintenanceBps === undefined) {
      return undefined;
    }

    const interest = fullDurationInterest(
      position.loanAmount,
      position.order.interestRate,
      position.order.positionDuration,
    );
    return liquidationLevel(position.loanAmount, interest, maintenanceBps);
  }, [
    maintenanceBps,
    position.loanAmount,
    position.order.interestRate,
    position.order.positionDuration,
  ]);

  const values = {
    frozenAt: frozenTime > 0 ? formatFrozenAt(frozenTime) : DASH,
    value:
      actualBalance !== undefined
        ? formatGroupedAmount(actualBalance, position.loanAsset.decimals)
        : DASH,
    level: level !== undefined ? formatGroupedAmount(level, position.loanAsset.decimals) : DASH,
    symbol,
    margin: maintenanceBps !== undefined ? formatMaintenancePercent(maintenanceBps) : DASH,
  };

  const recovered = isKnown && !isLiquidatable;

  return (
    <Alert
      className="mb-3"
      type={recovered ? "info" : "warning"}
      text={recovered ? t("frozen_recovered_alert", values) : t("frozen_at_risk_alert", values)}
    />
  );
}
