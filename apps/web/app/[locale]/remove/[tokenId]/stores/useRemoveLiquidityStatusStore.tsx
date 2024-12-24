import { Address } from "viem";
import { create } from "zustand";

export enum RemoveLiquidityStatus {
  INITIAL,
  PENDING,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum RemoveLiquidityError {
  OUT_OF_GAS,
  UNKNOWN,
}

interface RemoveLiquidityStatusStore {
  status: RemoveLiquidityStatus;
  hash: Address | undefined;
  errorType: RemoveLiquidityError;

  setStatus: (status: RemoveLiquidityStatus) => void;
  setHash: (hash?: Address) => void;
  setErrorType: (errorType: RemoveLiquidityError) => void;
}

export const useRemoveLiquidityStatusStore = create<RemoveLiquidityStatusStore>((set, get) => ({
  status: RemoveLiquidityStatus.INITIAL,
  hash: undefined,
  errorType: RemoveLiquidityError.UNKNOWN,

  setStatus: (status) => {
    if (status === RemoveLiquidityStatus.INITIAL) {
      set({ status, hash: undefined });
    }

    set({ status });
  },
  setErrorType: (errorType) => set({ errorType }),
  setHash: (hash) => set({ hash }),
}));
