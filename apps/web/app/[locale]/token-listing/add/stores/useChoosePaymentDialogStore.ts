import { create } from "zustand";

interface ChoosePaymentDialogStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useChoosePaymentDialogStore = create<ChoosePaymentDialogStore>((set, get) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));
