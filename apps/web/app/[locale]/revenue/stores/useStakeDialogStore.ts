"use client";

import { create } from "zustand";

export type StakeDialogState =
  | "initial"
  | "approving"
  | "confirming"
  | "executing"
  | "success"
  | "error";

export interface StakeDialogData {
  amount: string;
  amountUSD: string;
  selectedStandard: "ERC-20" | "ERC-223";
  errorMessage?: string;
  transactionHash?: string;
  requiresApproval?: boolean;
}

interface StakeDialogStore {
  isOpen: boolean;
  state: StakeDialogState;
  data: StakeDialogData | null;
  dialogType: "stake" | "unstake";

  // Actions
  openDialog: (type: "stake" | "unstake", data: StakeDialogData) => void;
  closeDialog: () => void;
  setState: (state: StakeDialogState) => void;
  setData: (data: Partial<StakeDialogData>) => void;
  setError: (errorMessage: string) => void;
  setTransactionHash: (hash: string) => void;
}

export const useStakeDialogStore = create<StakeDialogStore>((set) => ({
  isOpen: false,
  state: "initial",
  data: null,
  dialogType: "stake",

  openDialog: (type, data) =>
    set({
      isOpen: true,
      state: "initial",
      data,
      dialogType: type,
    }),

  closeDialog: () =>
    set({
      isOpen: false,
      state: "initial",
      data: null,
    }),

  setState: (state) => set({ state }),

  setData: (newData) =>
    set((state) => ({
      data: state.data ? { ...state.data, ...newData } : null,
    })),

  setError: (errorMessage) =>
    set((state) => ({
      data: state.data ? { ...state.data, errorMessage } : null,
      state: "error",
    })),

  setTransactionHash: (transactionHash) =>
    set((state) => ({
      data: state.data ? { ...state.data, transactionHash } : null,
    })),
}));
