import { create } from "zustand";

type RefreshDepositsDataStore = {
  refreshDepositsTrigger: boolean;
  setRefreshDepositsTrigger: (value: boolean) => void;
};

export const useRefreshDepositsDataStore = create<RefreshDepositsDataStore>((set) => ({
  refreshDepositsTrigger: false,
  setRefreshDepositsTrigger: (value) => set({ refreshDepositsTrigger: value }),
}));
