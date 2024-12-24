import { create } from "zustand";

type WalletDepositsLoadingStore = {
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
};

export const useWalletDepositsLoadingStore = create<WalletDepositsLoadingStore>((set) => ({
  isLoading: false,
  setIsLoading: (value) => set({ isLoading: value }),
}));
