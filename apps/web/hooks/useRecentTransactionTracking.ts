import { getTransaction } from "@wagmi/core";
import { white } from "next/dist/lib/picocolors";
import { useCallback, useEffect, useMemo } from "react";
import { Address, TransactionNotFoundError, WaitForTransactionReceiptTimeoutError } from "viem";
import { useAccount, usePublicClient } from "wagmi";

import { addNotification } from "@/other/notification";
import {
  IRecentTransactionTitle,
  RecentTransactionStatus,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

const trackingTransactions: Address[] = [];
export function useRecentTransactionTracking() {
  const {
    transactions,
    updateTransactionStatus,
    updateTransactionGasSettings,
    updateTransactionHash,
  } = useRecentTransactionsStore();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const transactionsForAddress = useMemo(() => {
    return (address && transactions[address]) || [];
  }, [address, transactions]);

  const waitAndUpdate = useCallback(
    async (hash: `0x${string}`, id: string, title: IRecentTransactionTitle) => {
      if (!publicClient || !address) {
        return;
      }

      try {
        await publicClient.getTransaction({ hash });
      } catch (e) {
        if (e instanceof TransactionNotFoundError) {
          updateTransactionStatus(id, RecentTransactionStatus.ERROR, address);
        }
      }

      const transaction = await publicClient.waitForTransactionReceipt({
        timeout: 1000 * 60 * 60,
        hash,
        onReplaced: (replacement) => {
          if (replacement.reason === "repriced") {
            updateTransactionHash(id, replacement.transaction.hash, address, "repriced");
          }
          if (replacement.reason === "cancelled") {
            updateTransactionHash(id, replacement.transaction.hash, address, "cancelled");
          } //TODO: make something with closure, this callback fired mutliple times even if function failed with error
          console.log(replacement);
        },
      });
      if (transaction.status === "success") {
        updateTransactionStatus(id, RecentTransactionStatus.SUCCESS, address);
        addNotification(title, RecentTransactionStatus.SUCCESS);
      } else if (transaction.status === "reverted") {
        updateTransactionStatus(id, RecentTransactionStatus.ERROR, address);
        addNotification(title, RecentTransactionStatus.ERROR);
      }
    },
    [address, publicClient, updateTransactionHash, updateTransactionStatus],
  );

  const waitForTransaction = useCallback(
    async (hash: `0x${string}`, id: string, title: IRecentTransactionTitle) => {
      while (true) {
        try {
          console.log("trying again");
          await waitAndUpdate(hash, id, title);
          return;
        } catch (e) {
          console.log(e);
          if (!(e instanceof WaitForTransactionReceiptTimeoutError)) {
            return;
          }
        }
      }
    },
    [waitAndUpdate],
  );

  useEffect(() => {
    for (const transaction of transactionsForAddress) {
      if (
        transaction.status === RecentTransactionStatus.PENDING &&
        !trackingTransactions.includes(transaction.id)
      ) {
        waitForTransaction(transaction.hash, transaction.id, transaction.title);
        trackingTransactions.push(transaction.id);
      }
    }
  }, [transactionsForAddress, waitForTransaction]);
}
