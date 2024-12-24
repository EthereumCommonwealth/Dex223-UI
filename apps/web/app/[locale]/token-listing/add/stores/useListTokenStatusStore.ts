import { Address } from "viem";
import { create } from "zustand";

export enum ListTokenStatus {
  INITIAL,
  PENDING_APPROVE,
  LOADING_APPROVE,
  PENDING,
  LOADING,
  SUCCESS,
  ERROR,
  APPROVE_ERROR,
}

export enum ListError {
  OUT_OF_GAS,
  UNKNOWN,
}

interface ListTokenStatusStore {
  status: ListTokenStatus;
  approveHash: Address | undefined;
  listTokenHash: Address | undefined;
  errorType: ListError;

  setStatus: (status: ListTokenStatus) => void;
  setApproveHash: (hash: Address) => void;
  setListTokenHash: (hash: Address) => void;
  setErrorType: (errorType: ListError) => void;
}

export const useListTokenStatusStore = create<ListTokenStatusStore>((set, get) => ({
  status: ListTokenStatus.INITIAL,
  approveHash: undefined,
  listTokenHash: undefined,
  errorType: ListError.UNKNOWN,
  setStatus: (status) => {
    if (status === ListTokenStatus.INITIAL) {
      set({ status, listTokenHash: undefined, approveHash: undefined });
    }

    set({ status });
  },
  setErrorType: (errorType) => set({ errorType }),
  setListTokenHash: (hash) => set({ listTokenHash: hash }),
  setApproveHash: (hash) => set({ approveHash: hash }),
}));
