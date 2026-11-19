"use client";
import React, { useEffect, useRef } from "react";

import ConfirmConvertDialog from "@/app/[locale]/swap/components/ConfirmConvertDialog";
import TradeForm from "@/app/[locale]/swap/components/TradeForm";
import TwoVersionsInfo from "@/app/[locale]/swap/components/TwoVersionsInfo";
import { useTrade } from "@/app/[locale]/swap/hooks/useTrade";
import { useSwapAmountsStore } from "@/app/[locale]/swap/stores/useSwapAmountsStore";
import { useSwapRecentTransactionsStore } from "@/app/[locale]/swap/stores/useSwapRecentTransactions";
import { useSwapTokensStore } from "@/app/[locale]/swap/stores/useSwapTokensStore";
import RecentTransactions from "@/components/common/RecentTransactions";
import SelectedTokensInfo from "@/components/common/SelectedTokensInfo";
import { useTradingChartStore } from "@/components/trading-chart/store";
import TradingChart from "@/components/trading-chart/TradingChart";
import TradingLayout from "@/components/trading-chart/TradingLayout";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useSwapAnalytics } from "@/hooks/useSwapAnalytics";
import { useSwapSearchParams } from "@/hooks/useSwapSearchParams";

export default function SwapPage() {
  useSwapSearchParams();

  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useSwapRecentTransactionsStore();

  const chainId = useCurrentChainId();

  const { tokenA, tokenB } = useSwapTokensStore();

  // Symbols and chain only - never addresses or amounts. See lib/analytics.ts.
  useSwapAnalytics({ tokenIn: tokenA?.symbol, tokenOut: tokenB?.symbol, chainId });

  const { reset: resetAmount } = useSwapAmountsStore();
  const previousChainId = useRef(chainId);

  // The first render must keep the pair useSwapSearchParams just applied. A later chain
  // change still clears the typed amount; that hook clears the tokens and selects again.
  useEffect(() => {
    if (previousChainId.current === chainId) {
      return;
    }
    previousChainId.current = chainId;
    resetAmount();
  }, [chainId, resetAmount]);

  const { visible: chartVisible, setVisible: setChartVisible } = useTradingChartStore();
  const { trade } = useTrade();
  const showChart = chartVisible && !!tokenA && !!tokenB;

  return (
    <>
      <TradingLayout
        showChart={showChart}
        showRecent={showRecentTransactions}
        form={
          <>
            <div className="flex flex-col gap-2 lg:gap-3">
              <TwoVersionsInfo />
            </div>
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
      <ConfirmConvertDialog />
    </>
  );
}
