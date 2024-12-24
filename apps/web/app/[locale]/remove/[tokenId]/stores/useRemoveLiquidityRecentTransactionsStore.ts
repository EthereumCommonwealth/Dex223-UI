import { createRecentTransactionsStore } from "@/stores/factories/createRecentTransactionsStore";

const localStorageKey = "remove-recent-transactions-state";
export const useRemoveRecentTransactionsStore = createRecentTransactionsStore(localStorageKey);
