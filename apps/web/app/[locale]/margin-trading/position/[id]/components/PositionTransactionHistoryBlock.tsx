import ExternalTextLink from "@repo/ui/external-text-link";
import clsx from "clsx";
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

const recentTransactionTextMap: Record<MarginPositionTransactionType, ReactNode> = {
  [MarginPositionTransactionType.BORROW]: "Borrow",
  [MarginPositionTransactionType.MARGIN_SWAP]: "Margin swap",
  [MarginPositionTransactionType.CLOSED]: "Closed",
  [MarginPositionTransactionType.DEPOSIT]: "Deposit",
  [MarginPositionTransactionType.FROZEN]: "Frozen",
  [MarginPositionTransactionType.WITHDRAW]: "Withdraw",
  [MarginPositionTransactionType.LIQUIDATED]: "Liquidated",
};

function PositionTransactionDescription({
  transaction,
}: {
  transaction: MarginPositionRecentTransaction;
}) {
  switch (transaction.type) {
    case MarginPositionTransactionType.BORROW:
      return (
        <div>
          Borrowing {formatUnits(transaction.amount, transaction.assetToken.decimals)}{" "}
          {transaction.assetToken.symbol}
        </div>
      );
    case MarginPositionTransactionType.MARGIN_SWAP:
      return (
        <div>
          {formatUnits(transaction.amountIn, transaction.assetInToken.decimals)}{" "}
          {transaction.assetInToken.symbol} was swapped for {transaction.assetOutToken.symbol} at a
          rate 1 {transaction.assetInToken.symbol} ={" "}
          {formatFloat(
            +formatUnits(transaction.amountIn, transaction.assetInToken.decimals) /
              +formatUnits(transaction.amountOut, transaction.assetOutToken.decimals),
          )}{" "}
          {transaction.assetOutToken.symbol}
        </div>
      );
    case MarginPositionTransactionType.DEPOSIT:
      return (
        <div>
          Deposit {formatUnits(transaction.amount, transaction.assetToken.decimals)}{" "}
          {transaction.assetToken.symbol}
        </div>
      );
    case MarginPositionTransactionType.WITHDRAW:
      return (
        <div>
          Withdraw {formatUnits(transaction.amount, transaction.assetToken.decimals)}{" "}
          {transaction.assetToken.symbol}
        </div>
      );
  }
}

export default function PositionTransactionHistoryBlock({
  position,
}: {
  position: MarginPosition;
}) {
  const { loading, recentTransactions } = useMarginPositionRecentTransactionsById({
    id: position.id.toString(),
  });

  const chainId = useCurrentChainId();

  if (loading || !recentTransactions) {
    return "Loading...";
  }

  return (
    <div className=" bg-primary-bg rounded-5  pt-4 pb-5 mb-5 flex flex-col gap-3">
      <h3 className="text-20 text-secondary-text font-medium px-10">Transactions history</h3>
      <div className="grid rounded-2 overflow-hidden bg-table-gradient grid-cols-[minmax(50px,1.33fr),_minmax(77px,1.33fr),_minmax(87px,1.33fr),_minmax(50px,2.67fr)] pb-2">
        <div className="h-[60px] flex items-center pl-10">Txn hash</div>
        <div className="h-[60px] flex items-center">Age</div>
        <div className="h-[60px] flex items-center">Type</div>
        <div className="h-[60px] flex items-center pr-5">Action</div>

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
                  {o.type != null ? recentTransactionIconMap[o.type] : "Unknown"}
                </span>
                {o.type != null ? recentTransactionTextMap[o.type] : "Unknown"}
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
