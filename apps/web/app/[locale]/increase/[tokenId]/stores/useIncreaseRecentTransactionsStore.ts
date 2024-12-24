import { createRecentTransactionsStore } from "@/stores/factories/createRecentTransactionsStore";

const localStorageKey = "increase-recent-transactions-state";
export const useIncreaseRecentTransactionsStore = createRecentTransactionsStore(localStorageKey);
