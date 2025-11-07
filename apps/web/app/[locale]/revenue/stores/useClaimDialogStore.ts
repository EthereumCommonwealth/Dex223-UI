"use client";

import { create } from "zustand";

export type ClaimDialogState = "initial" | "confirming" | "executing" | "success" | "error";

export interface ClaimToken {
  id: number;
  name: string;
  symbol: string;
  logoURI: string;
  amount: string;
  amountUSD: string;
  erc20Address: string;
  erc223Address: string;
  chainId: number;
  selectedStandard?: "ERC-20" | "ERC-223";
}

export interface ClaimDialogData {
  selectedTokens: ClaimToken[];
  totalReward: number;
  gasPrice: string;
  gasLimit: string;
  networkFee: string;
  selectedStandard?: "ERC-20" | "ERC-223"; // Global standard for single token
  tokenStandards?: Record<number, "ERC-20" | "ERC-223">; // Per-token standards for multiple tokens
  errorMessage?: string;
  transactionHash?: string;
  isMultiple?: boolean; // Flag to determine if it's single or multiple claim
}

interface ClaimDialogStore {
  isOpen: boolean;
  state: ClaimDialogState;
  data: ClaimDialogData | null;

  // Actions
  openDialog: (data: ClaimDialogData) => void;
  closeDialog: () => void;
  setState: (state: ClaimDialogState) => void;
  setData: (data: Partial<ClaimDialogData>) => void;
  setError: (errorMessage: string) => void;
  setTransactionHash: (hash: string) => void;
  setTokenStandard: (tokenId: number, standard: "ERC-20" | "ERC-223") => void;
}

export const useClaimDialogStore = create<ClaimDialogStore>((set) => ({
  isOpen: false,
  state: "initial",
  data: null,

  openDialog: (data) =>
    set({
      isOpen: true,
      state: "initial",
      data,
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

  setTokenStandard: (tokenId, standard) =>
    set((state) => {
      if (!state.data) return state;

      const tokenStandards = state.data.tokenStandards || {};
      return {
        data: {
          ...state.data,
          tokenStandards: {
            ...tokenStandards,
            [tokenId]: standard,
          },
        },
      };
    }),
}));
