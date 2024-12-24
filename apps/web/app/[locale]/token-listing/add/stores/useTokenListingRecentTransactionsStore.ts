import { createRecentTransactionsStore } from "@/stores/factories/createRecentTransactionsStore";

const localStorageKey = "listing-recent-transactions-state";
export const useTokenListingRecentTransactionsStore =
  createRecentTransactionsStore(localStorageKey);
