"use client";

import { Address } from "viem";
import { create } from "zustand";

export enum StakeStatus {
  INITIAL,
  PENDING_APPROVE,
  LOADING_APPROVE,
  PENDING,
  LOADING,
  SUCCESS,
  ERROR,
  APPROVE_ERROR,
}

export enum StakeError {
  OUT_OF_GAS,
  INSUFFICIENT_BALANCE,
  LOCKED_TOKENS,
  UNKNOWN,
}

interface StakeDialogStore {
  isOpen: boolean;
  status: StakeStatus;
  dialogType: "stake" | "unstake";
  amount: string;
  selectedStandard: "ERC-20" | "ERC-223";
  approveHash: Address | undefined;
  stakeHash: Address | undefined;
  errorType: StakeError;
  errorMessage?: string;

  // Actions
  openDialog: (type: "stake" | "unstake", amount: string, standard: "ERC-20" | "ERC-223") => void;
  closeDialog: () => void;
  setStatus: (status: StakeStatus) => void;
  setErrorType: (errorType: StakeError) => void;
  setErrorMessage: (message: string) => void;
  setApproveHash: (hash: Address) => void;
  setStakeHash: (hash: Address) => void;
  resetHashes: () => void;
}

export const useStakeDialogStore = create<StakeDialogStore>((set) => ({
  isOpen: false,
  status: StakeStatus.INITIAL,
  dialogType: "stake",
  amount: "",
  selectedStandard: "ERC-20",
  approveHash: undefined,
  stakeHash: undefined,
  errorType: StakeError.UNKNOWN,
  errorMessage: undefined,

  openDialog: (type, amount, standard) =>
    set({
      isOpen: true,
      status: StakeStatus.INITIAL,
      dialogType: type,
      amount,
      selectedStandard: standard,
      approveHash: undefined,
      stakeHash: undefined,
      errorMessage: undefined,
    }),

  closeDialog: () =>
    set({
      isOpen: false,
      status: StakeStatus.INITIAL,
      amount: "",
      approveHash: undefined,
      stakeHash: undefined,
      errorMessage: undefined,
    }),

  setStatus: (status) => {
    if (status === StakeStatus.INITIAL) {
      set({ status, stakeHash: undefined, approveHash: undefined, errorMessage: undefined });
    } else {
      set({ status });
    }
  },

  setErrorType: (errorType) => set({ errorType }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setApproveHash: (hash) => set({ approveHash: hash }),
  setStakeHash: (hash) => set({ stakeHash: hash }),
  resetHashes: () => set({ approveHash: undefined, stakeHash: undefined }),
}));
