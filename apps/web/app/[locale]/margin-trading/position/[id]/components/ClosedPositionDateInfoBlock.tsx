import ExternalTextLink from "@repo/ui/external-text-link";
import { useTranslations } from "next-intl";
import React from "react";

import { OrderInfoBlock } from "@/app/[locale]/margin-trading/components/widgets/OrderInfoBlock";
import timestampToDateString from "@/app/[locale]/margin-trading/helpers/timestampToDateString";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import useCurrentChainId from "@/hooks/useCurrentChainId";

export default function ClosedPositionDateInfoBlock({ position }: { position: MarginPosition }) {
  const t = useTranslations("Margin");
  const chainId = useCurrentChainId();
  return (
    <div className="rounded-5 gap-x-5 gap-y-4 bg-primary-bg px-10 pt-4 pb-5 mb-5">
      <OrderInfoBlock
        title={t("closing_details")}
        cards={[
          {
            title: t("closing_date"),
            tooltipText: t("closing_date_tooltip"),
            value: timestampToDateString(position.closedAt, { withUTC: false, withSeconds: true }),
            bg: "liquidation_date",
          },
          {
            title: t("closing"),
            tooltipText: t("closing_tx_tooltip"),
            value: (
              <ExternalTextLink
                text={t("closing_transaction")}
                href={getExplorerLink(ExplorerLinkType.TRANSACTION, position.txClosed, chainId)}
              />
            ),
            bg: "closed",
          },
        ]}
      />
    </div>
  );
}
