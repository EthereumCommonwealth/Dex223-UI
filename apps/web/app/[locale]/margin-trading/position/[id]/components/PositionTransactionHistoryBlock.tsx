import ExternalTextLink from "@repo/ui/external-text-link";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { ReactNode } from "react";
import { formatUnits } from "viem";

import timestampToDateString from "@/app/[locale]/margin-trading/helpers/timestampToDateString";
import {
  MarginPositionRecentTransaction,
  MarginPositionTransactionType,
} from "@/app/[locale]/margin-trading/hooks/helpers";
import useMarginPositionRecentTransactionsById from "@/app/[locale]/margin-trading/hooks/useMarginPositionTransactionHistory";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import Svg from "@/components/atoms/Svg";
import { formatFloat } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";

const recentTransactionIconMap: Record<MarginPositionTransactionType, ReactNode> = {
  [MarginPositionTransactionType.BORROW]: <Svg iconName="borrow" />,
  [MarginPositionTransactionType.MARGIN_SWAP]: <Svg iconName="swap" />,
  [MarginPositionTransactionType.CLOSED]: <Svg iconName="closed" />,
  [MarginPositionTransactionType.DEPOSIT]: <Svg iconName="deposit" />,
  [MarginPositionTransactionType.FROZEN]: <Svg iconName="freeze" />,
  [MarginPositionTransactionType.WITHDRAW]: <Svg iconName="withdraw" />,
  [MarginPositionTransactionType.LIQUIDATED]: <Svg iconName="liquidated" />,
};

function PositionTransactionDescription({
  transaction,
}: {
  transaction: MarginPositionRecentTransaction;
}) {
  const t = useTranslations("Margin");

  switch (transaction.type) {
    case MarginPositionTransactionType.BORROW:
      return (
        <div>
          {t("history_borrow", {
            amount: formatUnits(transaction.amount, transaction.assetToken.decimals),
            symbol: transaction.assetToken.symbol,
          })}
        </div>
      );
    case MarginPositionTransactionType.MARGIN_SWAP:
      return (
        <div>
          {t("history_swap", {
            amount: formatUnits(transaction.amountIn, transaction.assetInToken.decimals),
            symbolIn: transaction.assetInToken.symbol,
            symbolOut: transaction.assetOutToken.symbol,
            rate: formatFloat(
              +formatUnits(transaction.amountIn, transaction.assetInToken.decimals) /
                +formatUnits(transaction.amountOut, transaction.assetOutToken.decimals),
            ),
          })}
        </div>
      );
    case MarginPositionTransactionType.DEPOSIT:
      return (
        <div>
          {t("history_deposit", {
            amount: formatUnits(transaction.amount, transaction.assetToken.decimals),
            symbol: transaction.assetToken.symbol,
          })}
        </div>
      );
    case MarginPositionTransactionType.WITHDRAW:
      return (
        <div>
          {t("history_withdraw", {
            amount: formatUnits(transaction.amount, transaction.assetToken.decimals),
            symbol: transaction.assetToken.symbol,
          })}
        </div>
      );
  }
}

export default function PositionTransactionHistoryBlock({
  position,
}: {
  position: MarginPosition;
}) {
  const t = useTranslations("Margin");
  const { loading, recentTransactions } = useMarginPositionRecentTransactionsById({
    id: position.id.toString(),
  });

  const chainId = useCurrentChainId();

  const recentTransactionTextMap: Record<MarginPositionTransactionType, ReactNode> = {
    [MarginPositionTransactionType.BORROW]: t("borrow"),
    [MarginPositionTransactionType.MARGIN_SWAP]: t("margin_swap"),
    [MarginPositionTransactionType.CLOSED]: t("status_closed"),
    [MarginPositionTransactionType.DEPOSIT]: t("deposit"),
    [MarginPositionTransactionType.FROZEN]: t("frozen"),
    [MarginPositionTransactionType.WITHDRAW]: t("withdraw"),
    [MarginPositionTransactionType.LIQUIDATED]: t("liquidated"),
  };

  if (loading || !recentTransactions) {
    return t("loading");
  }

  return (
    <div className=" bg-primary-bg rounded-5  pt-4 pb-5 mb-5 flex flex-col gap-3">
      <h3 className="text-20 text-secondary-text font-medium px-10">{t("transactions_history")}</h3>
      <div className="grid rounded-2 overflow-hidden bg-table-gradient grid-cols-[minmax(50px,1.33fr),_minmax(77px,1.33fr),_minmax(87px,1.33fr),_minmax(50px,2.67fr)] pb-2">
        <div className="h-[60px] flex items-center pl-10">{t("txn_hash")}</div>
        <div className="h-[60px] flex items-center">{t("age")}</div>
        <div className="h-[60px] flex items-center">{t("type")}</div>
        <div className="h-[60px] flex items-center pr-5">{t("action")}</div>

        {recentTransactions.map((o, index) => {
          return (
            <React.Fragment key={index}>
              <div
                className={clsx(
                  "h-[56px] flex items-center gap-2 pl-10",
                  index % 2 !== 0 && "bg-tertiary-bg",
                )}
              >
                <ExternalTextLink
                  text={truncateMiddle(o.hash)}
                  href={getExplorerLink(ExplorerLinkType.TRANSACTION, o.hash, chainId)}
                />
              </div>
              <div
                className={clsx(" h-[56px] flex items-center", index % 2 !== 0 && "bg-tertiary-bg")}
              >
                {timestampToDateString(+o.timestamp, { withUTC: false })}
              </div>
              <div
                className={clsx(
                  " h-[56px] flex items-center gap-1",
                  index % 2 !== 0 && "bg-tertiary-bg",
                )}
              >
                <span className="text-tertiary-text">
                  {o.type != null ? recentTransactionIconMap[o.type] : t("unknown")}
                </span>
                {o.type != null ? recentTransactionTextMap[o.type] : t("unknown")}
              </div>
              <div
                className={clsx(
                  " h-[56px] flex items-center pr-5  ",
                  index % 2 !== 0 && "bg-tertiary-bg",
                )}
              >
                <PositionTransactionDescription transaction={o} />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
