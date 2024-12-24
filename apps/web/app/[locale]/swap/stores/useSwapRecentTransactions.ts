import { createRecentTransactionsStore } from "@/stores/factories/createRecentTransactionsStore";

const localStorageKey = "swap-recent-transactions-state";
export const useSwapRecentTransactionsStore = createRecentTransactionsStore(localStorageKey);
