"use client";
import React, { useEffect } from "react";

import ConfirmConvertDialog from "@/app/[locale]/swap/components/ConfirmConvertDialog";
import TradeForm from "@/app/[locale]/swap/components/TradeForm";
import TradingViewWidget from "@/app/[locale]/swap/components/TradingViewWidget";
import TwoVersionsInfo from "@/app/[locale]/swap/components/TwoVersionsInfo";
import { useSwapAmountsStore } from "@/app/[locale]/swap/stores/useSwapAmountsStore";
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

  const { tokenA, tokenB, reset: resetTokens } = useSwapTokensStore();

  const { reset: resetAmount } = useSwapAmountsStore();

  useEffect(() => {
    resetTokens();
    resetAmount();
  }, [chainId, resetAmount, resetTokens]);

  return (
    <>
      <div className="grid py-3 sm:py-4 lg:py-[40px] grid-cols-1 lg:grid-cols-[2fr_1fr] mx-auto gap-3 sm:gap-4 lg:gap-6 px-3 sm:px-4 lg:px-6 max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 min-w-0 order-1">
          <div className="w-full h-[300px] xs:h-[350px] sm:h-[450px] md:h-[500px] lg:h-[600px] xl:h-[700px] bg-secondary-bg rounded-2 border border-secondary-border overflow-hidden flex-shrink-0">
            <TradingViewWidget tokenA={tokenA} tokenB={tokenB} />
          </div>

          <div className="w-full min-w-0 hidden lg:block">
            <RecentTransactions
              showRecentTransactions={showRecentTransactions}
              handleClose={() => setShowRecentTransactions(false)}
              store={useSwapRecentTransactionsStore}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 min-w-0 order-2">
          <div className="flex flex-col gap-2 sm:gap-3">
            <TwoVersionsInfo />
          </div>

          <TradeForm />
          <SelectedTokensInfo tokenA={tokenA} tokenB={tokenB} />
        </div>

        <div className="w-full min-w-0 order-3 lg:hidden">
          <RecentTransactions
            showRecentTransactions={showRecentTransactions}
            handleClose={() => setShowRecentTransactions(false)}
            store={useSwapRecentTransactionsStore}
          />
        </div>
      </div>

      <ConfirmConvertDialog />
    </>
  );
}
