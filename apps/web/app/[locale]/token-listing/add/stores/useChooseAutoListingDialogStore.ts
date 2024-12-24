import { create } from "zustand";

interface ChooseAutoListingDialogStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useChooseAutoListingDialogStore = create<ChooseAutoListingDialogStore>((set, get) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));
