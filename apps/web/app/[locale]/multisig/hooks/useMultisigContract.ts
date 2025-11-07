import { useCallback, useEffect, useState } from "react";
import { Address, encodeFunctionData, Log } from "viem";
import { useAccount, usePublicClient, useWalletClient, useWatchContractEvent } from "wagmi";

import { MULTISIG_ABI } from "@/config/abis/Multisig";
import { getGasSettings } from "@/functions/gasSettings";
import explorerMap, { ExplorerLinkType } from "@/functions/getExplorerLink";
import getExplorerLink from "@/functions/getExplorerLink";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { addNotification } from "@/other/notification";
import addToast from "@/other/toast";
import { DexChainId } from "@/sdk_bi/chains";
import { useGlobalFees } from "@/shared/hooks/useGlobalFees";
import { GasOption } from "@/stores/factories/createGasPriceStore";
import {
  RecentTransactionStatus,
  RecentTransactionTitleTemplate,
} from "@/stores/useRecentTransactionsStore";
import { useTransactionSendDialogStore } from "@/stores/useTransactionSendDialogStore";

export interface MultisigTransaction {
  to: Address;
  value: bigint;
  data: `0x${string}`;
  proposed_timestamp: bigint;
  executed: boolean;
  num_approvals: bigint;
  num_votes: bigint;
  required_approvals: bigint;
}

export interface MultisigConfig {
  numOwners: bigint;
  votePassThreshold: bigint;
  executionDelay: bigint;
  numTxs: bigint;
}

const MULTISIG_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MSIG_CONTRACT_ADDRESS as Address;
// const MULTISIG_CONTRACT_ADDRESS = "0xE0CbccaBB9a7987bC94287D555A1Aa440Efa30bf" as Address;

const generateTransactionData = (functionName: string, args: unknown[]): `0x${string}` => {
  return encodeFunctionData({
    abi: MULTISIG_ABI,
    functionName: functionName as any,
    args,
  });
};

export default function useMultisigContract() {
  const [sendingTransaction, setSendingTransaction] = useState(false);
  const [estimatedDeadline, setEstimatedDeadline] = useState<string>("");
  const [estimatedDeadlineLoading, setEstimatedDeadlineLoading] = useState(false);

  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { baseFee, gasPrice, priorityFee } = useGlobalFees();
  const currentChainId = useCurrentChainId();
  const { openDialog, closeDialog, updateStatus } = useTransactionSendDialogStore();

  useWatchContractEvent({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    eventName: "TransactionProposed",
    async onLogs(logs) {
      setSendingTransaction(false);
      console.log("TransactionProposed", logs);
      if (logs.length > 0) {
        const log = logs[0] as any;
        const explorerUrl = getExplorerLink(
          ExplorerLinkType.TRANSACTION,
          log.transactionHash,
          currentChainId as DexChainId,
        );
        updateStatus("success", {
          transactionId: log.args?.txId?.toString(),
          transactionHash: log.transactionHash || undefined,
          explorerUrl,
          canClose: true,
        });
        const threshold = await readContract("vote_pass_threshold");
        if (threshold && BigInt(threshold as string) === BigInt(1)) {
          await executeTransaction(log.args?.txId as bigint);
        }
      }
    },
  });

  const readContract = useCallback(
    async (functionName: string, args: unknown[] = []) => {
      if (!publicClient) return null;

      try {
        return await publicClient.readContract({
          address: MULTISIG_CONTRACT_ADDRESS,
          abi: MULTISIG_ABI,
          functionName: functionName as any,
          args,
        });
      } catch (error) {
        return null;
      }
    },
    [publicClient],
  );

  const writeContract = useCallback(
    async (
      functionName: string,
      args: unknown[],
      title: string,
      onHashReceive?: (hash: string) => void,
      onReceiptReceive?: (receipt: unknown) => void,
    ) => {
      if (!publicClient || !walletClient || !address) {
        throw new Error("Missing required clients or address");
      }

      const params = {
        abi: MULTISIG_ABI,
        address: MULTISIG_CONTRACT_ADDRESS,
        functionName: functionName as any,
        args,
      };

      try {
        const estimatedGas = await publicClient.estimateContractGas({
          account: address as Address,
          ...params,
        });

        const gasToUse = estimatedGas + BigInt(30000);

        const gasSettings = getGasSettings({
          baseFee,
          chainId: currentChainId,
          gasPrice,
          priorityFee,
          gasPriceOption: GasOption.FAST,
          gasPriceSettings: {
            model: 0,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
          },
        });

        const hash = await walletClient.writeContract({
          ...params,
          account: address as Address,
          ...gasSettings,
          gas: gasToUse,
        });

        onHashReceive?.(hash);

        const transaction = await getTransactionWithRetries({
          hash,
          publicClient,
        });

        if (transaction) {
          const nonce = transaction.nonce;
        }

        onReceiptReceive?.(transaction);
        return hash;
      } catch (error) {
        throw error;
      }
    },
    [publicClient, walletClient, address, baseFee, currentChainId, gasPrice, priorityFee],
  );

  const getTransaction = useCallback(
    async (txId: bigint): Promise<MultisigTransaction | null> => {
      const result = await readContract("txs", [txId]);
      if (!result) return null;
      const [
        to,
        value,
        data,
        proposed_timestamp,
        executed,
        num_approvals,
        num_votes,
        required_approvals,
      ] = result as any[];

      return {
        to,
        value,
        data,
        proposed_timestamp,
        executed,
        num_approvals,
        num_votes,
        required_approvals,
      };
    },
    [readContract],
  );

  const getAllTransactions = useCallback(async (): Promise<MultisigTransaction[]> => {
    const numTxs = await readContract("num_TXs");
    if (!numTxs) return [];

    const transactions: MultisigTransaction[] = [];
    for (let i = 0; i < Number(numTxs); i++) {
      const tx = await getTransaction(BigInt(i));
      if (tx) {
        transactions.push(tx);
      }
    }
    return transactions;
  }, [readContract, getTransaction]);

  const getConfig = useCallback(async (): Promise<MultisigConfig | null> => {
    const [numOwners, votePassThreshold, executionDelay, numTxs] = await Promise.all([
      readContract("num_owners"),
      readContract("vote_pass_threshold"),
      readContract("execution_delay"),
      readContract("num_TXs"),
    ]);

    if (!numOwners || !votePassThreshold || !executionDelay || !numTxs) return null;

    return {
      numOwners: BigInt(numOwners as string),
      votePassThreshold: BigInt(votePassThreshold as string),
      executionDelay: BigInt(executionDelay as string),
      numTxs: BigInt(numTxs as string),
    };
  }, [readContract]);

  const isOwner = useCallback(
    async (address: Address): Promise<boolean> => {
      const result = await readContract("owner", [address]);
      return Boolean(result);
    },
    [readContract],
  );

  const isTransactionAllowed = useCallback(
    async (txId: bigint): Promise<boolean> => {
      const result = await readContract("txAllowed", [txId]);
      return Boolean(result);
    },
    [readContract],
  );

  const handleMultisigAction = useCallback(
    async ({
      txId,
      args = [],
      functionName,
      title,
      transactionId,
      notificationTemplate,
    }: {
      txId?: bigint;
      args?: unknown[];
      functionName: string;
      title: string;
      transactionId: string;
      notificationTemplate: RecentTransactionTitleTemplate;
    }) => {
      openDialog("sending", { transactionId });

      try {
        setSendingTransaction(true);
        updateStatus("sending", { transactionId, canClose: false });

        const hash = await writeContract(functionName, args, title);
        const explorerUrl = getExplorerLink(
          ExplorerLinkType.TRANSACTION,
          hash,
          currentChainId as DexChainId,
        );

        updateStatus("confirming", {
          transactionId,
          transactionHash: hash,
          explorerUrl,
          canClose: true,
        });

        await publicClient?.waitForTransactionReceipt({ hash });

        // setSendingTransaction(false);
        // updateStatus("success", {
        //   transactionId,
        //   transactionHash: hash,
        //   explorerUrl,
        //   canClose: true,
        // });

        addNotification(
          {
            template: notificationTemplate as any,
            chainId: currentChainId as DexChainId,
            hash,
          },
          RecentTransactionStatus.SUCCESS,
        );

        return hash;
      } catch (error) {
        setSendingTransaction(false);
        updateStatus("error", {
          transactionId,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    },
    [openDialog, updateStatus, currentChainId, publicClient, writeContract],
  );

  const approveTransaction = useCallback(
    (txId: bigint) => {
      const data = generateTransactionData("approveTx", [txId]);
      return handleMultisigAction({
        args: [MULTISIG_CONTRACT_ADDRESS, BigInt(0), data],
        functionName: "proposeTx",
        title: "Approve Transaction",
        transactionId: "approving",
        notificationTemplate: RecentTransactionTitleTemplate.MSIG_APPROVE,
      });
    },
    [handleMultisigAction],
  );

  const declineTransaction = useCallback(
    (txId: bigint) => {
      const data = generateTransactionData("declineTx", [txId]);
      return handleMultisigAction({
        args: [MULTISIG_CONTRACT_ADDRESS, BigInt(0), data],
        functionName: "proposeTx",
        title: "Decline Transaction",
        transactionId: "declining",
        notificationTemplate: RecentTransactionTitleTemplate.MSIG_DECLINE,
      });
    },
    [handleMultisigAction],
  );

  const executeTransaction = useCallback(
    (txId: bigint) => {
      const data = generateTransactionData("executeTx", [txId]);
      return handleMultisigAction({
        args: [MULTISIG_CONTRACT_ADDRESS, BigInt(0), data],
        functionName: "proposeTx",
        title: "Execute Transaction",
        transactionId: "executing",
        notificationTemplate: RecentTransactionTitleTemplate.MSIG_TRANSACTION_CONFIRMED,
      });
    },
    [handleMultisigAction],
  );

  const proposeTransaction = useCallback(
    (to: Address, value: bigint, data: `0x${string}`) => {
      return handleMultisigAction({
        args: [to, value, data],
        functionName: "proposeTx",
        title: "Propose Transaction",
        transactionId: "proposing",
        notificationTemplate: RecentTransactionTitleTemplate.MSIG_TRANSACTION_CONFIRMED,
      });
    },
    [handleMultisigAction],
  );

  const addOwner = useCallback(
    (newOwner: Address) => {
      const data = generateTransactionData("addOwner", [newOwner]);
      return handleMultisigAction({
        args: [MULTISIG_CONTRACT_ADDRESS, BigInt(0), data],
        functionName: "proposeTx",
        title: "Propose Add Owner",
        transactionId: "proposing_add_owner",
        notificationTemplate: RecentTransactionTitleTemplate.MSIG_ADD_OWNER,
      });
    },
    [handleMultisigAction],
  );

  const removeOwner = useCallback(
    (owner: Address) => {
      const data = generateTransactionData("removeOwner", [owner]);
      return handleMultisigAction({
        args: [MULTISIG_CONTRACT_ADDRESS, BigInt(0), data],
        functionName: "proposeTx",
        title: "Propose Remove Owner",
        transactionId: "proposing_remove_owner",
        notificationTemplate: RecentTransactionTitleTemplate.MSIG_REMOVE_OWNER,
      });
    },
    [handleMultisigAction],
  );

  const setupDelay = useCallback(
    (newDelay: bigint) => {
      const data = generateTransactionData("setupDelay", [newDelay]);
      return handleMultisigAction({
        args: [MULTISIG_CONTRACT_ADDRESS, BigInt(0), data],
        functionName: "proposeTx",
        title: "Propose Setup Delay",
        transactionId: "proposing_delay",
        notificationTemplate: RecentTransactionTitleTemplate.MSIG_SET_DELAY,
      });
    },
    [handleMultisigAction],
  );

  const setupThreshold = useCallback(
    (newThreshold: bigint) => {
      const data = generateTransactionData("setupThreshold", [newThreshold]);
      return handleMultisigAction({
        args: [MULTISIG_CONTRACT_ADDRESS, BigInt(0), data],
        functionName: "proposeTx",
        title: "Propose Setup Threshold",
        transactionId: "proposing_threshold",
        notificationTemplate: RecentTransactionTitleTemplate.MSIG_SET_THRESHOLD,
      });
    },
    [handleMultisigAction],
  );

  const reduceApprovalsThreshold = useCallback(
    (txId: bigint) =>
      handleMultisigAction({
        txId,
        args: [txId],
        functionName: "reduceApprovalsThreshold",
        title: "Reduce Approvals Threshold",
        transactionId: "reducing_threshold",
        notificationTemplate: RecentTransactionTitleTemplate.MSIG_SET_THRESHOLD,
      }),
    [handleMultisigAction],
  );

  // Get token transfer data
  const getTokenTransferData = useCallback(
    async (destination: Address, amount: bigint): Promise<`0x${string}`> => {
      const result = await readContract("getTokenTransferData", [destination, amount]);
      return result as `0x${string}`;
    },
    [readContract],
  );

  const getTransactionDeadline = useCallback(
    async (txId: bigint): Promise<bigint | null> => {
      const [transaction, config] = await Promise.all([getTransaction(txId), getConfig()]);
      if (!transaction || !config) return null;
      return transaction.proposed_timestamp + config.executionDelay;
    },
    [getTransaction, getConfig],
  );

  const fetchEstimatedDeadline = useCallback(async () => {
    if (!publicClient) return;
    try {
      setEstimatedDeadlineLoading(true);
      const config = await getConfig();
      if (!config) return;

      const currentBlock = await publicClient.getBlock({ blockTag: "latest" });
      const estimatedDeadlineTimestamp = currentBlock.timestamp + config.executionDelay;
      const deadlineDate = new Date(Number(estimatedDeadlineTimestamp) * 1000);
      setEstimatedDeadline(deadlineDate.toLocaleString());
    } catch (error) {
      console.error(error);
    } finally {
      setEstimatedDeadlineLoading(false);
    }
  }, [publicClient, getConfig]);

  return {
    getTransaction,
    getAllTransactions,
    getConfig,
    isOwner,
    isTransactionAllowed,
    approveTransaction,
    declineTransaction,
    executeTransaction,
    proposeTransaction,
    addOwner,
    removeOwner,
    setupDelay,
    setupThreshold,
    reduceApprovalsThreshold,
    getTokenTransferData,
    generateTransactionData,
    getTransactionDeadline,
    sendingTransaction,
    fetchEstimatedDeadline,
    estimatedDeadline,
    estimatedDeadlineLoading,
    handleMultisigAction,
  };
}
