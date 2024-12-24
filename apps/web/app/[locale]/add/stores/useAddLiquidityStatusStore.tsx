import { Address } from "viem";
import { create } from "zustand";

export enum AddLiquidityStatus {
  INITIAL,
  APPROVE_LOADING,
  APPROVE_ERROR,
  MINT,
  MINT_PENDING,
  MINT_LOADING,
  MINT_ERROR,
  SUCCESS,
}
export enum AddLiquidityApproveStatus {
  INITIAL,
  PENDING,
  LOADING,
  SUCCESS,
  ERROR,
}

interface AddLiquidityStatusStore {
  status: AddLiquidityStatus;
  approve0Status: AddLiquidityApproveStatus;
  approve1Status: AddLiquidityApproveStatus;
  deposite0Status: AddLiquidityApproveStatus;
  deposite1Status: AddLiquidityApproveStatus;
  approve0Hash: Address | undefined;
  approve1Hash: Address | undefined;
  deposite0Hash: Address | undefined;
  deposite1Hash: Address | undefined;
  liquidityHash: Address | undefined;

  setStatus: (status: AddLiquidityStatus) => void;
  setApprove0Status: (status: AddLiquidityApproveStatus) => void;
  setApprove1Status: (status: AddLiquidityApproveStatus) => void;
  setApprove0Hash: (hash: Address | undefined) => void;
  setApprove1Hash: (hash: Address | undefined) => void;
  setDeposite0Status: (status: AddLiquidityApproveStatus) => void;
  setDeposite1Status: (status: AddLiquidityApproveStatus) => void;
  setDeposite0Hash: (hash: Address | undefined) => void;
  setDeposite1Hash: (hash: Address | undefined) => void;
  setLiquidityHash: (hash: Address) => void;
}

export const useAddLiquidityStatusStore = create<AddLiquidityStatusStore>((set, get) => ({
  status: AddLiquidityStatus.INITIAL,
  approve0Status: AddLiquidityApproveStatus.INITIAL,
  approve1Status: AddLiquidityApproveStatus.INITIAL,
  deposite0Status: AddLiquidityApproveStatus.INITIAL,
  deposite1Status: AddLiquidityApproveStatus.INITIAL,
  approve0Hash: undefined,
  approve1Hash: undefined,
  deposite0Hash: undefined,
  deposite1Hash: undefined,
  liquidityHash: undefined,

  setStatus: (status) => {
    if (status === AddLiquidityStatus.INITIAL) {
      set({ status, liquidityHash: undefined });
    }

    set({ status });
  },
  setApprove0Status: (status) => {
    if (status === AddLiquidityApproveStatus.INITIAL) {
      set({
        approve0Status: status,
        approve0Hash: undefined,
      });
    }

    set({ approve0Status: status });
  },
  setApprove1Status: (status) => {
    if (status === AddLiquidityApproveStatus.INITIAL) {
      set({
        approve1Status: status,
        approve1Hash: undefined,
      });
    }

    set({ approve1Status: status });
  },
  setDeposite0Status: (status) => {
    if (status === AddLiquidityApproveStatus.INITIAL) {
      set({
        deposite0Status: status,
        deposite0Hash: undefined,
      });
    }

    set({ deposite0Status: status });
  },
  setDeposite1Status: (status) => {
    if (status === AddLiquidityApproveStatus.INITIAL) {
      set({
        deposite1Status: status,
        deposite1Hash: undefined,
      });
    }

    set({ deposite1Status: status });
  },
  setLiquidityHash: (hash) => set({ liquidityHash: hash }),
  setApprove0Hash: (hash) => set({ approve0Hash: hash }),
  setApprove1Hash: (hash) => set({ approve1Hash: hash }),
  setDeposite0Hash: (hash) => set({ deposite0Hash: hash }),
  setDeposite1Hash: (hash) => set({ deposite1Hash: hash }),
}));
