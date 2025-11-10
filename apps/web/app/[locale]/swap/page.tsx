"use client";
import React, { useEffect, useState } from "react";

import ConfirmConvertDialog from "@/app/[locale]/swap/components/ConfirmConvertDialog";
import TradeForm from "@/app/[locale]/swap/components/TradeForm";
import TradingViewWidget from "@/components/common/TradingViewWidget";
import TwoVersionsInfo from "@/app/[locale]/swap/components/TwoVersionsInfo";
import { Field, useSwapAmountsStore } from "@/app/[locale]/swap/stores/useSwapAmountsStore";
import { useSwapRecentTransactionsStore } from "@/app/[locale]/swap/stores/useSwapRecentTransactions";
import { useSwapTokensStore } from "@/app/[locale]/swap/stores/useSwapTokensStore";
import RecentTransactions from "@/components/common/RecentTransactions";
import SelectedTokensInfo from "@/components/common/SelectedTokensInfo";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useSwapSearchParams } from "@/hooks/useSwapSearchParams";

export default function SwapPage() {
  useSwapSearchParams();

  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useSwapRecentTransactionsStore();

  const chainId = useCurrentChainId();

  const { tokenA, tokenB, reset: resetTokens, switchTokens } = useSwapTokensStore();
  const [isChartVisible, setIsChartVisible] = useState(false);
  const { reset: resetAmount, setTypedValue } = useSwapAmountsStore();

  const handleSwapTokens = () => {
    switchTokens();
    setTypedValue({
      typedValue: "",
      field: Field.CURRENCY_A,
    });
  };

  useEffect(() => {
    resetTokens();
    resetAmount();
  }, [chainId, resetAmount, resetTokens]);

  return (
    <>
      <div className="flex py-3 sm:py-4 xl:py-[40px] mx-auto gap-3 sm:gap-4 xl:gap-6 px-3 sm:px-4 xl:px-6 max-w-full overflow-x-hidden">
        {(isChartVisible || showRecentTransactions) && (
          <div className="hidden xl:flex flex-col gap-3 sm:gap-4 xl:gap-6 flex-1 min-w-0">
            {isChartVisible && (
              <div className="w-full h-[600px] xl:h-[700px] bg-secondary-bg rounded-2 border border-secondary-border overflow-hidden">
                <TradingViewWidget tokenA={tokenA} tokenB={tokenB} onSwapTokens={handleSwapTokens} />
              </div>
            )}

            <div className="w-full min-w-0">
              <RecentTransactions
                showRecentTransactions={showRecentTransactions}
                handleClose={() => setShowRecentTransactions(false)}
                store={useSwapRecentTransactionsStore}
              />
            </div>
          </div>
        )}

        <div className={`flex flex-col gap-3 sm:gap-4 xl:gap-6 w-full xl:w-[600px] flex-shrink-0 ${isChartVisible || showRecentTransactions ? 'mx-auto xl:mx-0' : 'mx-auto'}`}>
          {isChartVisible && (
            <div className="w-full h-[300px] xs:h-[350px] sm:h-[450px] md:h-[500px] bg-secondary-bg rounded-2 border border-secondary-border overflow-hidden xl:hidden">
              <TradingViewWidget tokenA={tokenA} tokenB={tokenB} onSwapTokens={handleSwapTokens} />
            </div>
          )}

          <div className="flex flex-col gap-2 sm:gap-3 max-w-[600px] mx-auto">
            <TwoVersionsInfo />

          <TradeForm setIsChartVisible={setIsChartVisible} isChartVisible={isChartVisible} />
          <SelectedTokensInfo tokenA={tokenA} tokenB={tokenB} />
          </div>
          <div className="w-full min-w-0 xl:hidden max-w-[600px] mx-auto">
            <RecentTransactions
              showRecentTransactions={showRecentTransactions}
              handleClose={() => setShowRecentTransactions(false)}
              store={useSwapRecentTransactionsStore}
            />
          </div>
        </div>
      </div>

      <ConfirmConvertDialog />
    </>
  );
}
