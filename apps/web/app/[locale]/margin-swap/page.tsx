"use client";
import clsx from "clsx";
import { redirect } from "next/navigation";
import React, { useMemo } from "react";
import { useAccount } from "wagmi";

import SelectPositionDialog, {
  SelectedPositionInfo,
} from "@/app/[locale]/margin-swap/components/SelectPositionDialog";
import TradeForm from "@/app/[locale]/margin-swap/components/TradeForm";
import { useMarginSwapTokensStore } from "@/app/[locale]/margin-swap/stores/useMarginSwapTokensStore";
import { usePositionsByOwner } from "@/app/[locale]/margin-trading/hooks/useMarginPosition";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import { useMarginTrade } from "@/app/[locale]/swap/hooks/useTrade";
import { useSwapRecentTransactionsStore } from "@/app/[locale]/swap/stores/useSwapRecentTransactions";
import Container from "@/components/atoms/Container";
import SwapPriceChart from "@/components/charts/SwapPriceChart";
import RecentTransactions from "@/components/common/RecentTransactions";
import SelectedTokensInfo from "@/components/common/SelectedTokensInfo";
import { ThemeColors } from "@/config/theme/colors";
import { ColorSchemeProvider } from "@/lib/color-scheme";
import { FeeAmount } from "@/sdk_bi/constants";

export default function MarginSwapPage() {
  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useSwapRecentTransactionsStore();
  const { tokenA, tokenB, reset: resetTokens } = useMarginSwapTokensStore();
  const { address } = useAccount();
  const { loading, positions } = usePositionsByOwner({ owner: address });
  const { trade } = useMarginTrade();

  const openedPositions = useMemo(() => {
    return positions?.filter((position) => !position.isLiquidated && !position.isClosed);
  }, [positions]);

  const [matchingPositions, otherPositions] = useMemo(() => {
    if (!tokenA && !tokenB) {
      return [openedPositions, openedPositions];
    }

    const matching: MarginPosition[] = [];
    const other: MarginPosition[] = [];

    for (const position of openedPositions ?? []) {
      const hasA = tokenA && position.assets.some((asset) => asset.equals(tokenA));

      const hasB =
        tokenB && position.order.allowedTradingAssets.some((asset) => asset.equals(tokenB));

      // If tokenA is provided → must match assets
      // If tokenB is provided → must match allowedTradingAssets
      // If both are provided → both must match
      const matches = (!tokenA || hasA) && (!tokenB || hasB);

      if (matches) {
        matching.push(position);
      } else {
        other.push(position);
      }
    }

    return [matching, other];
  }, [openedPositions, tokenA, tokenB]);

  return (
    <ColorSchemeProvider value={ThemeColors.PURPLE}>
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
              <div className="flex flex-col gap-2 lg:gap-3">
                <div className="flex justify-between items-center pl-4 pr-5 py-2 text-secondary-text border-l-4 bg-primary-bg rounded-2 border-purple">
                  {!openedPositions?.length ? (
                    "You don't have any active positions"
                  ) : (
                    <>
                      {!!(tokenA && !tokenB && matchingPositions?.length) &&
                        `${matchingPositions?.length} positions with ${tokenA.symbol}`}
                      {!!(tokenB && !tokenA && matchingPositions?.length) &&
                        `${matchingPositions?.length} positions allowed for ${tokenB.symbol} trade`}
                      {!!(tokenA && tokenB && matchingPositions?.length) &&
                        `${matchingPositions?.length} positions with ${tokenA.symbol} allowed for ${tokenB.symbol} trade`}
                      {(!!tokenA || !!tokenB) &&
                        matchingPositions?.length === 0 &&
                        "No positions for selected tokens"}
                      {!tokenA && !tokenB && `You have ${openedPositions?.length} position(s)`}
                    </>
                  )}
                  <SelectPositionDialog />
                </div>
              </div>

              <SelectedPositionInfo />

              <TradeForm />
              <SwapPriceChart
                tokenA={tokenA}
                tokenB={tokenB}
                feeTier={trade?.route.pools?.[0]?.fee as FeeAmount | undefined}
              />
              <SelectedTokensInfo tokenA={tokenA} tokenB={tokenB} />
            </div>
          </div>
        </div>
      </Container>
    </ColorSchemeProvider>
  );
}
