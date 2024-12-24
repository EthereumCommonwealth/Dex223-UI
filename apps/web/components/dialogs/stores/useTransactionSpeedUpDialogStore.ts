import { create } from "zustand";

import { IRecentTransaction } from "@/stores/useRecentTransactionsStore";

interface WalletDialogStore {
  transaction: IRecentTransaction | null;
  isOpen: boolean;
  handleSpeedUp: (transaction: IRecentTransaction) => void;
  handleCancel: (transaction: IRecentTransaction) => void;
  handleClose: () => void;
  replacement: "reprice" | "cancel";
}

export const useTransactionSpeedUpDialogStore = create<WalletDialogStore>((set, get) => ({
  transaction: null,
  isOpen: false,
  handleSpeedUp: (transaction) => set({ transaction, isOpen: true, replacement: "reprice" }),
  handleCancel: (transaction) => set({ transaction, isOpen: true, replacement: "cancel" }),
  handleClose: () => set({ isOpen: false }),
  replacement: "reprice",
}));
