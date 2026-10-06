import { useMemo } from "react";
import { useAccount } from "wagmi";

import {
  IRecentTransaction,
  RecentTransactionStatus,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

/**
 * The pending recent-transaction entry for a hash, which is what the global speed-up dialog
 * needs. A sped-up transaction keeps its original hash as `id`, so it is still found after a
 * replacement. Returns undefined when the wallet did not record it (no speed-up available).
 */
export default function useRecentTransactionByHash(
  hash: string | undefined,
): IRecentTransaction | undefined {
  const { address } = useAccount();
  const { transactions } = useRecentTransactionsStore();

  return useMemo(() => {
    if (!hash || !address) return undefined;
    const lowered = hash.toLowerCase();
    return (transactions[address] || []).find(
      (tx) =>
        tx.status === RecentTransactionStatus.PENDING &&
        (tx.hash?.toLowerCase() === lowered || tx.id?.toLowerCase() === lowered),
    );
  }, [address, hash, transactions]);
}
