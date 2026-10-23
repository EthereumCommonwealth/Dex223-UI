"use client";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { use } from "react";

import useMarginPositionById from "@/app/[locale]/margin-trading/hooks/useMarginPosition";
import DepositForm from "@/app/[locale]/margin-trading/position/[id]/deposit/components/DepositForm";
import { useSwapRecentTransactionsStore } from "@/app/[locale]/swap/stores/useSwapRecentTransactions";
import Container from "@/components/atoms/Container";
import RecentTransactions from "@/components/common/RecentTransactions";

export default function LiquidatePositionPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const t = useTranslations("Margin");
  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useSwapRecentTransactionsStore();

  const { id: positionId } = use(params);

  const { position, loading } = useMarginPositionById({ id: positionId });

  if (loading || !position) {
    return t("loading");
  }

  return (
    <>
      <Container>
        <div
          className={clsx(
            "grid py-4 lg:py-[40px] grid-cols-1 mx-auto",
            showRecentTransactions
              ? "xl:grid-cols-[580px_600px] xl:max-w-[1200px] gap-4 xl:grid-areas-[left_right] grid-areas-[right,left]"
              : "xl:grid-cols-[600px] xl:max-w-[600px] grid-areas-[right]",
          )}
        >
          <div className="grid-in-[left] flex justify-center">
            <div className="w-full sm:max-w-[600px] xl:max-w-full">
              <RecentTransactions
                showRecentTransactions={showRecentTransactions}
                handleClose={() => setShowRecentTransactions(false)}
                store={useSwapRecentTransactionsStore}
              />
            </div>
          </div>

          <div className="flex justify-center grid-in-[right]">
            <div className="flex flex-col gap-4 md:gap-6 lg:gap-5 w-full sm:max-w-[600px] xl:max-w-full">
              <DepositForm position={position} />
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
