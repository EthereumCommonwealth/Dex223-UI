import { useCallback, useEffect, useMemo, useState } from "react";
import { Address, decodeFunctionData, formatUnits } from "viem";
import { useAccount } from "wagmi";

import { MULTISIG_ABI } from "@/config/abis/Multisig";
import { useTokens } from "@/hooks/useTokenLists";

import useMultisigContract, { MultisigTransaction } from "./useMultisigContract";

export interface TransactionDisplayData {
  id: string;
  type: "ETH" | "Token";
  amount: string;
  symbol: string;
  to: Address;
  numberOfVotes: string;
  requiredVotes: string;
  deadline: string;
  status: "pending" | "approved" | "declined" | "executed";
  executed: boolean;
  data: `0x${string}`;
  canExecute: boolean;
  canVote: boolean;
}

export default function useMultisigTransactions() {
  const { address } = useAccount();
  const {
    getTransaction,
    getAllTransactions,
    isOwner,
    isTransactionAllowed,
    getTransactionDeadline,
  } = useMultisigContract();

  const tokens = useTokens();
  const [transactions, setTransactions] = useState<TransactionDisplayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unknownTokenCache, setUnknownTokenCache] = useState<
    Map<string, { symbol: string; decimals: number }>
  >(new Map());

  const tokenMap = useMemo(() => {
    const map = new Map<string, { symbol: string; decimals: number }>();
    tokens.forEach((token) => {
      if (token.isToken) {
        map.set(token.address0.toLowerCase(), {
          symbol: token.symbol || "Unknown",
          decimals: token.decimals,
        });
        if (token.address1) {
          map.set(token.address1.toLowerCase(), {
            symbol: token.symbol || "Unknown",
            decimals: token.decimals,
          });
        }
      }
    });
    return map;
  }, [tokens]);

  const getTokenInfo = useCallback(
    (tokenAddress: string) => {
      const lowerAddress = tokenAddress.toLowerCase();

      const knownToken = tokenMap.get(lowerAddress);
      if (knownToken) {
        return knownToken;
      }

      const cachedToken = unknownTokenCache.get(lowerAddress);
      if (cachedToken) {
        return cachedToken;
      }

      return null;
    },
    [tokenMap, unknownTokenCache],
  );

  const cacheTokenInfo = useCallback((tokenAddress: string, symbol: string, decimals: number) => {
    setUnknownTokenCache((prev) => {
      const newCache = new Map(prev);
      newCache.set(tokenAddress.toLowerCase(), { symbol, decimals });
      return newCache;
    });
  }, []);

  const formatTransaction = useCallback(
    async (tx: MultisigTransaction, txId: number): Promise<TransactionDisplayData> => {
      const isEthTransaction = tx.value > 0n && tx.data === "0x";
      const isTokenTransaction = tx.data !== "0x";

      let amount = "0";
      let symbol = "ETH";
      let type: "ETH" | "Token" = "ETH";

      if (isEthTransaction) {
        amount = formatUnits(tx.value, 18);
        symbol = "ETH";
        type = "ETH";
      } else if (isTokenTransaction) {
        try {
          let decoded;
          try {
            decoded = decodeFunctionData({
              abi: MULTISIG_ABI,
              data: tx.data,
            });
          } catch (multisigError) {
            decoded = decodeFunctionData({
              abi: MULTISIG_ABI,
              data: tx.data,
            });
          }

          if (decoded.functionName === "transfer") {
            const [to, value] = decoded.args as [Address, bigint];

            const tokenInfo = getTokenInfo(tx.to);
            if (tokenInfo) {
              amount = formatUnits(value, tokenInfo.decimals);
              symbol = tokenInfo.symbol;
              type = "Token";
            } else {
              try {
                amount = formatUnits(value, 18);
                symbol = "Loading...";
                type = "Token";
              } catch (fetchError) {
                console.warn("Failed to fetch token info:", fetchError);
                amount = formatUnits(value, 18);
                symbol = "Unknown Token";
                type = "Token";
              }
            }
          } else {
            amount = "Unknown";
            symbol = "Unknown Token";
            type = "Token";
          }
        } catch (error) {
          console.warn("Failed to decode transaction data:", error);
          amount = "Unknown";
          symbol = "Unknown Token";
          type = "Token";
        }
      }

      const canExecute = await isTransactionAllowed(BigInt(txId));
      const isUserOwner = address ? await isOwner(address) : false;
      const canVote = isUserOwner && !tx.executed;

      const status = tx.executed
        ? "executed"
        : Number(tx.num_approvals) >= Number(tx.required_approvals)
          ? "approved"
          : "pending";

      const deadlineTimestamp = await getTransactionDeadline(BigInt(txId));
      const deadlineString = deadlineTimestamp
        ? new Date(Number(deadlineTimestamp) * 1000).toLocaleString()
        : new Date(Number(tx.proposed_timestamp) * 1000).toLocaleString();

      // Fetch proposer from events

      return {
        id: txId.toString(),
        type,
        amount,
        symbol,
        to: tx.to,
        numberOfVotes: tx.num_approvals.toString(),
        requiredVotes: tx.required_approvals.toString(),
        deadline: deadlineString,
        status,
        executed: tx.executed,
        data: tx.data,
        canExecute,
        canVote,
      };
    },
    [isTransactionAllowed, isOwner, address, getTokenInfo, getTransactionDeadline],
  );

  const loadTransactions = useCallback(async () => {
    if (!getAllTransactions) return;

    setLoading(true);
    setError(null);

    try {
      const txs = await getAllTransactions();
      const formattedTxs = await Promise.all(
        txs.map((tx: MultisigTransaction, index: number) => formatTransaction(tx, index)),
      );
      setTransactions(formattedTxs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [getAllTransactions, formatTransaction]);

  const loadTransaction = useCallback(
    async (txId: string) => {
      if (!getTransaction) return null;

      setLoading(true);
      setError(null);

      try {
        const tx = await getTransaction(BigInt(txId));
        if (!tx) return null;

        const formattedTx = await formatTransaction(tx, parseInt(txId));
        return formattedTx;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load transaction");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getTransaction, formatTransaction],
  );

  const refreshTransactions = useCallback(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  return {
    transactions,
    loading,
    error,
    loadTransaction,
    refreshTransactions,
    getTokenInfo,
    cacheTokenInfo,
  };
}
