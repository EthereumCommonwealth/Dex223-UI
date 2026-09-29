"use client";
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
import RecentTransactions from "@/components/common/RecentTransactions";
import SelectedTokensInfo from "@/components/common/SelectedTokensInfo";
import { useTradingChartStore } from "@/components/trading-chart/store";
import TradingChart from "@/components/trading-chart/TradingChart";
import TradingLayout from "@/components/trading-chart/TradingLayout";
import { ThemeColors } from "@/config/theme/colors";
import { ColorSchemeProvider } from "@/lib/color-scheme";

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

  const { visible: chartVisible, setVisible: setChartVisible } = useTradingChartStore();
  const showChart = chartVisible && !!tokenA && !!tokenB;

  return (
    <ColorSchemeProvider value={ThemeColors.PURPLE}>
      <TradingLayout
        showChart={showChart}
        showRecent={showRecentTransactions}
        form={
          <>
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

            <TradeForm setIsChartVisible={setChartVisible} isChartVisible={chartVisible} />
            <SelectedTokensInfo tokenA={tokenA} tokenB={tokenB} />
          </>
        }
        chart={
          <TradingChart tokenA={tokenA} tokenB={tokenB} routedFee={trade?.route.pools?.[0]?.fee} />
        }
        recent={
          <RecentTransactions
            showRecentTransactions={showRecentTransactions}
            handleClose={() => setShowRecentTransactions(false)}
            store={useSwapRecentTransactionsStore}
          />
        }
      />
    </ColorSchemeProvider>
  );
}
