import { createRecentTransactionsStore } from "@/stores/factories/createRecentTransactionsStore";

const localStorageKey = "pool-recent-transactions-state";
export const usePoolRecentTransactionsStore = createRecentTransactionsStore(localStorageKey);
