import { create } from "zustand";

import { TransactionSendStatus } from "@/components/dialogs/MSigTransactionDialog";

interface TransactionSendDialogStore {
  isOpen: boolean;
  status: TransactionSendStatus;
  transactionId?: string;
  transactionHash?: string;
  explorerUrl?: string;
  errorMessage?: string;
  canClose?: boolean;
  // Actions
  openDialog: (
    status: TransactionSendStatus,
    data?: {
      transactionId?: string;
      transactionHash?: string;
      explorerUrl?: string;
      errorMessage?: string;
    },
  ) => void;
  closeDialog: () => void;
  updateStatus: (
    status: TransactionSendStatus,
    data?: {
      transactionId?: string;
      transactionHash?: string;
      explorerUrl?: string;
      errorMessage?: string;
      canClose?: boolean;
    },
  ) => void;
}

export const useTransactionSendDialogStore = create<TransactionSendDialogStore>((set) => ({
  isOpen: false,
  status: "sending",
  transactionId: undefined,
  transactionHash: undefined,
  explorerUrl: undefined,
  errorMessage: undefined,

  openDialog: (status, data) =>
    set({
      isOpen: true,
      status,
      transactionId: data?.transactionId,
      transactionHash: data?.transactionHash,
      explorerUrl: data?.explorerUrl,
      errorMessage: data?.errorMessage,
    }),

  closeDialog: () =>
    set({
      isOpen: false,
      status: "sending",
      transactionId: undefined,
      transactionHash: undefined,
      explorerUrl: undefined,
      errorMessage: undefined,
    }),

  updateStatus: (status, data) =>
    set({
      status,
      transactionId: data?.transactionId,
      transactionHash: data?.transactionHash,
      explorerUrl: data?.explorerUrl,
      errorMessage: data?.errorMessage,
      canClose: data?.canClose,
    }),
}));
