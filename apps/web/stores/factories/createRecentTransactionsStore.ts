import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentTransactionsStore {
  isOpened: boolean;
  setIsOpened: (isOpened: boolean) => void;
}

type RecentTransactionsData = Pick<RecentTransactionsStore, "isOpened">;

const initialRecentTransactionsData: RecentTransactionsData = { isOpened: false };
export const createRecentTransactionsStore = (
  localStorageKey: string,
  initialData: RecentTransactionsData = initialRecentTransactionsData,
) =>
  create<RecentTransactionsStore>()(
    persist(
      (set, get) => ({
        isOpened: initialData.isOpened,
        setIsOpened: (isOpened) => set({ isOpened }),
      }),
      {
        name: localStorageKey, // name of the item in the storage (must be unique)
      },
    ),
  );
