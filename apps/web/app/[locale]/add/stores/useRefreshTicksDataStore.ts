import { create } from "zustand";

type RefreshTicksDataStore = {
  refreshTicksTrigger: boolean;
  setRefreshTicksTrigger: (value: boolean) => void;
};

export const useRefreshTicksDataStore = create<RefreshTicksDataStore>((set) => ({
  refreshTicksTrigger: false,
  setRefreshTicksTrigger: (value) => set({ refreshTicksTrigger: value }),
}));
