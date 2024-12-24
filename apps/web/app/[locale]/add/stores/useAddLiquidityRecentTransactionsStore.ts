import { createRecentTransactionsStore } from "@/stores/factories/createRecentTransactionsStore";

const localStorageKey = "liquidity-recent-transactions-state";
export const useAddLiquidityRecentTransactionsStore =
  createRecentTransactionsStore(localStorageKey);
