"use client";
import ExternalTextLink from "@repo/ui/external-text-link";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import React, { use, useMemo, useState } from "react";

import useMarginPositionById from "@/app/[locale]/margin-trading/hooks/useMarginPosition";
import ActivePositionAssetsBlock from "@/app/[locale]/margin-trading/position/[id]/components/ActivePositionAssetsBlock";
import ActivePositionMainInfoBlock from "@/app/[locale]/margin-trading/position/[id]/components/ActivePositionMainInfoBlock";
import ActivePositionParametersBlock from "@/app/[locale]/margin-trading/position/[id]/components/ActivePositionParametersBlock";
import ActivePositionTimeframeBlock from "@/app/[locale]/margin-trading/position/[id]/components/ActivePositionTimeframeBlock";
import ClosedPositionDateInfoBlock from "@/app/[locale]/margin-trading/position/[id]/components/ClosedPositionDateInfoBlock";
import ClosedPositionInfoBlock from "@/app/[locale]/margin-trading/position/[id]/components/ClosedPositionInfoBlock";
import ClosedPositionWithdrawDialog from "@/app/[locale]/margin-trading/position/[id]/components/ClosedPositionWithdrawDialog";
import LiquidatedPositionInfoBlock from "@/app/[locale]/margin-trading/position/[id]/components/LiquidatedPositionInfoBlock";
import PositionCloseDialog from "@/app/[locale]/margin-trading/position/[id]/components/PositionCloseDialog";
import PositionLiquidateDialog from "@/app/[locale]/margin-trading/position/[id]/components/PositionLiquidateDialog";
import PositionTransactionHistoryBlock from "@/app/[locale]/margin-trading/position/[id]/components/PositionTransactionHistoryBlock";
import PositionWithdrawDialog from "@/app/[locale]/margin-trading/position/[id]/components/PositionWithdrawDialog";
import Container from "@/components/atoms/Container";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Svg from "@/components/atoms/Svg";
import { TokenPortfolioDialogContent } from "@/components/dialogs/TokenPortfolioDialog";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";

export default function MarginPositionPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const locale = useLocale();
  const t = useTranslations("Margin");
  const { id: positionId } = use(params);
  const chainId = useCurrentChainId();
  const { position, loading } = useMarginPositionById({ id: positionId });
  const [isCloseDialogOpened, setIsCloseDialogOpened] = useState(false);
  const [isWithdrawDialogOpened, setIsWithdrawDialogOpened] = useState(false);
  const [isLiquidateDialogOpened, setIsLiquidateDialogOpened] = useState(false);

  if (loading || !position) {
    return t("loading");
  }

  return (
    <div className="py-10">
      <Container>
        <div className="mb-10">
          <button onClick={() => window.history.back()} className="flex items-center gap-1">
            <Svg iconName="back" />
            {t("back_to_margin_positions")}
          </button>
        </div>

        <h1 className="text-40 font-medium mb-3">{t("margin_position_details")}</h1>

        <div className="flex items-center gap-3 mb-5">
          <div className="bg-primary-bg rounded-2 flex items-center gap-1 pl-5 pr-4 py-1 min-h-12 text-tertiary-text">
            {t("owner")}:{" "}
            <ExternalTextLink
              text={truncateMiddle(position.owner, { charsFromEnd: 6, charsFromStart: 6 })}
              href={getExplorerLink(ExplorerLinkType.ADDRESS, position.owner, chainId)}
            />
          </div>
          <div className="bg-primary-bg rounded-2 flex items-center gap-1 pl-5 pr-4 py-1 min-h-12 text-tertiary-text">
            {t("margin_position_id")}: <span className="text-secondary-text">{position.id}</span>
          </div>
          <div className="bg-primary-bg rounded-2 flex items-center gap-1 pl-5 pr-4 py-1 min-h-12 text-tertiary-text">
            {t("lending_order_id")}:{" "}
            <ExternalTextLink
              text={position.order.id.toString()}
              href={`/${locale}/margin-trading/lending-order/${position.order.id.toString()}`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {!position.isClosed && !position.isLiquidated && (
            <>
              <ActivePositionMainInfoBlock
                position={position}
                setIsCloseDialogOpened={setIsCloseDialogOpened}
                setIsWithdrawDialogOpened={setIsWithdrawDialogOpened}
              />
              <ActivePositionParametersBlock position={position} />
              <ActivePositionTimeframeBlock position={position} />
              <ActivePositionAssetsBlock position={position} />
            </>
          )}

          {position.isLiquidated && <LiquidatedPositionInfoBlock position={position} />}

          {position.isClosed && (
            <>
              <ClosedPositionInfoBlock
                position={position}
                setIsWithdrawDialogOpened={setIsWithdrawDialogOpened}
              />
              {position.assetsWithBalances.some(
                (asset) => asset.balance && Boolean(asset.balance > 0),
              ) && <ActivePositionAssetsBlock position={position} />}
              <ClosedPositionDateInfoBlock position={position} />
            </>
          )}

          <PositionTransactionHistoryBlock position={position} />
        </div>
      </Container>

      <ClosedPositionWithdrawDialog
        isOpen={isWithdrawDialogOpened}
        setIsOpen={setIsWithdrawDialogOpened}
        position={position}
      />

      <PositionCloseDialog
        isOpen={isCloseDialogOpened}
        position={position}
        setIsOpen={setIsCloseDialogOpened}
      />

      <PositionLiquidateDialog
        isOpen={isLiquidateDialogOpened}
        position={position}
        setIsOpen={setIsLiquidateDialogOpened}
      />
    </div>
  );
}
