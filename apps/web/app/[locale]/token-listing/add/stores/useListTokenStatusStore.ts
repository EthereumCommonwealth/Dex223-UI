import { create } from "zustand";

import { createOperationStatusStore } from "@/stores/factories/createOperationStatusStore";

export enum ListTokenStatus {
  INITIAL,

  PENDING_APPROVE,
  LOADING_APPROVE,
  ERROR_APPROVE,

  PENDING_LIST_TOKEN,
  LOADING_LIST_TOKEN,
  ERROR_LIST_TOKEN,

  SUCCESS,
}

export enum ListError {
  OUT_OF_GAS,
  UNKNOWN,
}

export const useListTokenStatusStore = createOperationStatusStore({
  initialStatus: ListTokenStatus.INITIAL,
  operations: ["approve", "listToken"],
  errorType: ListError.UNKNOWN,
});

// Revert reason from the autolisting contract, shown under the failed status so a user can act on it.
export const useListTokenErrorReasonStore = create<{
  reason: string | undefined;
  setReason: (reason: string | undefined) => void;
}>((set) => ({
  reason: undefined,
  setReason: (reason) => set({ reason }),
}));
