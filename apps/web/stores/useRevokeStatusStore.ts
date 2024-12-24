import { create } from "zustand";

import { AllowanceStatus } from "@/hooks/useAllowance";

interface RevokeStatusStore {
  status: AllowanceStatus;
  setStatus: (newStatus: AllowanceStatus) => void;
}

export const useRevokeStatusStore = create<RevokeStatusStore>((set) => ({
  status: AllowanceStatus.INITIAL,
  setStatus: (newStatus) => set({ status: newStatus }),
}));
