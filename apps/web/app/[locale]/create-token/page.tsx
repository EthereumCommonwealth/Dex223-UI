"use client";

import clsx from "clsx";
import React from "react";
import { getContractAddress } from "viem";

import CreateTokenForm from "@/app/[locale]/create-token/components/CreateTokenForm";
import { useCreateTokenRecentTransactionsStore } from "@/app/[locale]/create-token/stores/useCreateTokenRecentTransactions";
import { useRemoveRecentTransactionsStore } from "@/app/[locale]/remove/[tokenId]/stores/useRemoveLiquidityRecentTransactionsStore";
import Container from "@/components/atoms/Container";
import IconButton, { IconButtonSize } from "@/components/buttons/IconButton";
import RecentTransactions from "@/components/common/RecentTransactions";
import { ERC223_TOKEN_DEPLOYER_ADDRESS } from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";

export default function DecreaseLiquidityPage() {
  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useCreateTokenRecentTransactionsStore();

  return (
    <Container>
      <div
        className={clsx(
          "grid py-4 lg:py-10 grid-cols-1 mx-auto",
          showRecentTransactions
            ? "xl:grid-cols-[580px_600px] xl:max-w-[1200px] gap-4 xl:grid-areas-[left_right] grid-areas-[right,left]"
            : "xl:grid-cols-[600px] xl:max-w-[600px] grid-areas-[right]",
        )}
      >
        <div className="grid-in-[left] flex justify-center">
          <div className="w-full sm:max-w-[600px] xl:max-w-full mx-auto">
            <RecentTransactions
              showRecentTransactions={showRecentTransactions}
              handleClose={() => setShowRecentTransactions(false)}
              store={useRemoveRecentTransactionsStore}
            />
          </div>
        </div>

        <div>
          <div className="lg:w-[600px] bg-primary-bg mx-auto card-spacing rounded-5">
            <div className="flex justify-between py-1.5 -mr-3">
              <h2 className="text-18 lg:text-20 font-bold flex justify-center items-center text-nowrap">
                Create a new ERC-223 token
              </h2>
              <div className="flex items-center gap-2 justify-end">
                <IconButton
                  onClick={() => setShowRecentTransactions(!showRecentTransactions)}
                  buttonSize={IconButtonSize.LARGE}
                  iconName="recent-transactions"
                  active={showRecentTransactions}
                />
              </div>
            </div>
            <div className="rounded-b-2 bg-primary-bg">
              <CreateTokenForm />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
