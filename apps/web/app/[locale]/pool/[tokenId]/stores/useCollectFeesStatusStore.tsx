import { Address } from "viem";
import { create } from "zustand";

export enum CollectFeesStatus {
  INITIAL,
  PENDING,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum CollectFeesError {
  OUT_OF_GAS,
  UNKNOWN,
}

interface CollectFeesStatusStore {
  status: CollectFeesStatus;
  hash: Address | undefined;
  errorType: CollectFeesError;

  setStatus: (status: CollectFeesStatus) => void;
  setHash: (hash: Address) => void;
  setErrorType: (errorType: CollectFeesError) => void;
}

export const useCollectFeesStatusStore = create<CollectFeesStatusStore>((set, get) => ({
  status: CollectFeesStatus.INITIAL,
  hash: undefined,
  errorType: CollectFeesError.UNKNOWN,

  setStatus: (status) => {
    if (status === CollectFeesStatus.INITIAL) {
      set({ status, hash: undefined });
    }

    set({ status });
  },
  setErrorType: (errorType) => set({ errorType }),
  setHash: (hash) => set({ hash }),
}));
