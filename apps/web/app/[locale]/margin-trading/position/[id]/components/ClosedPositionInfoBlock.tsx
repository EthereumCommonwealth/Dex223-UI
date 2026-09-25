import Image from "next/image";
import React, { useMemo } from "react";
import { formatUnits } from "viem";

import { OrderInfoCard } from "@/app/[locale]/margin-trading/components/widgets/OrderInfoBlock";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor } from "@/components/buttons/Button";
import { formatFloat } from "@/functions/formatFloat";

export default function ClosedPositionInfoBlock({
  position,
  setIsWithdrawDialogOpened,
}: {
  position: MarginPosition;
  setIsWithdrawDialogOpened: (isOpen: boolean) => void;
}) {
  const isTokensToWithdraw = useMemo(() => {
    return position.assetsWithBalances.some((assetWithBalance) => {
      return !!assetWithBalance.balance && assetWithBalance.balance > BigInt(0);
    });
  }, [position.assetsWithBalances]);

  return (
    <div className="flex flex-col gap-5 px-10 py-5 bg-primary-bg rounded-5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image width={40} height={40} src="/images/tokens/placeholder.svg" alt="" />
          <span className="text-secondary-text text-18 font-bold">{position.loanAsset.name}</span>
          <div className="flex items-center gap-3 text-tertiary-text">
            Executed
            <Svg iconName="done" />
          </div>
        </div>
        {isTokensToWithdraw && (
          <Button
            colorScheme={ButtonColor.LIGHT_GREEN}
            onClick={() => setIsWithdrawDialogOpened(true)}
          >
            Withdraw
          </Button>
        )}
      </div>

      <div className="grid gap-3 grid-cols-3">
        <OrderInfoCard
          value={
            formatFloat(formatUnits(position.loanAmount, position.loanAsset.decimals)) +
            " " +
            position.loanAsset.symbol
          }
          title={"Borrowed"}
          tooltipText="tooltip text"
          bg="borrowed"
        />
        <OrderInfoCard value={"-"} title={"Profit"} tooltipText="tooltip text" bg="borrowed" />
        <OrderInfoCard
          value={formatFloat(position.initialLeverage)}
          title={"Initial leverage"}
          tooltipText="tooltip text"
          bg="borrowed"
        />
      </div>
    </div>
  );
}
