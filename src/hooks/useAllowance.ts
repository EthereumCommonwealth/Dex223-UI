import { useCallback, useEffect, useMemo, useState } from "react";
import { Abi, Address, formatUnits, getAbiItem } from "viem";
import { useAccount, usePublicClient, useReadContract, useWalletClient } from "wagmi";

import { ERC20_ABI } from "@/config/abis/erc20";
import { formatFloat } from "@/functions/formatFloat";
import { IIFE } from "@/functions/iife";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import useScopedBlockNumber from "@/hooks/useScopedBlockNumber";
import addToast from "@/other/toast";
import { DexChainId } from "@/sdk_hybrid/chains";
import { Currency } from "@/sdk_hybrid/entities/currency";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

import useDeepEffect from "./useDeepEffect";

export enum AllowanceStatus {
  INITIAL,
  PENDING,
  LOADING,
  SUCCESS,
  ERROR,
}

const allowanceGasLimitMap: Record<DexChainId, { base: bigint; additional: bigint }> = {
  [DexChainId.SEPOLIA]: { base: BigInt(46200), additional: BigInt(10000) },
  [DexChainId.BSC_TESTNET]: { base: BigInt(46200), additional: BigInt(10000) },
  [DexChainId.EOS]: { base: BigInt(46200), additional: BigInt(10000) },
};

const defaultApproveValue = BigInt(46000);

export function useStoreAllowance({
  token,
  contractAddress,
  amountToCheck,
}: {
  token: Currency | undefined;
  contractAddress: Address | undefined;
  amountToCheck: bigint | null;
}) {
  const { address } = useAccount();
  const chainId = useCurrentChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const { refetch, data: currentAllowanceData } = useReadContract({
    abi: ERC20_ABI,
    address: token && token.isToken ? token.address0 : undefined,
    functionName: "allowance",
    args: [
      //set ! to avoid ts errors, make sure it is not undefined with "enable" option
      address!,
      contractAddress!,
    ],
    scopeKey: `${token?.wrapped.address0}-${contractAddress}-${address}-${chainId}`,
    query: {
      //make sure hook don't run when there is no addresses
      enabled:
        Boolean(token?.wrapped.address0) &&
        Boolean(token?.isToken) &&
        Boolean(address) &&
        Boolean(contractAddress),
    },
    // cacheTime: 0,
    // watch: true,
  });

  // const currentAllowanceItem = useMemo(() => {
  //   return allowances.find(
  //     (allowanceItem) =>
  //       allowanceItem.tokenAddress === token?.address0 &&
  //       allowanceItem.contractAddress === contractAddress &&
  //       allowanceItem.chainId === chainId &&
  //       allowanceItem.account === address,
  //   );
  // }, [address, allowances, chainId, contractAddress, token]);

  const { addRecentTransaction } = useRecentTransactionsStore();

  const gasLimit = useMemo(() => {
    if (allowanceGasLimitMap[chainId]) {
      return allowanceGasLimitMap[chainId].additional + allowanceGasLimitMap[chainId].base;
    }

    return defaultApproveValue;
  }, [chainId]);

  // const updateAllowance = useCallback(async () => {
  //   if (!publicClient || !address || !contractAddress || !token) {
  //     return;
  //   }
  //
  //   const data = await publicClient.readContract({
  //     abi: ERC20_ABI,
  //     functionName: "allowance",
  //     address: token.address0,
  //     args: [address, contractAddress],
  //   });
  //
  //   if (currentAllowanceItem) {
  //     updateAllowedToSpend(currentAllowanceItem, data);
  //   } else {
  //     addAllowanceItem({
  //       tokenAddress: token.address0,
  //       contractAddress,
  //       account: address,
  //       chainId,
  //       allowedToSpend: data,
  //     });
  //   }
  // }, [
  //   addAllowanceItem,
  //   address,
  //   chainId,
  //   contractAddress,
  //   currentAllowanceItem,
  //   publicClient,
  //   token,
  //   updateAllowedToSpend,
  // ]);

  // useEffect(() => {
  //   if (!currentAllowanceItem) {
  //     updateAllowance();
  //   }
  // }, [currentAllowanceItem, updateAllowance]);

  const waitAndReFetch = useCallback(
    async (hash: Address) => {
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        await refetch();
      }
    },
    [publicClient, refetch],
  );

  const writeTokenApprove = useCallback(
    async (customAmount?: bigint) => {
      const amountToApprove = customAmount || amountToCheck;

      if (
        !amountToApprove ||
        !contractAddress ||
        !token ||
        !walletClient ||
        !address ||
        !chainId ||
        !publicClient
      ) {
        console.error("Error: writeTokenApprove ~ something undefined");
        return;
      }

      if (token.isNative) {
        return;
      }

      const params: {
        address: Address;
        account: Address;
        abi: Abi;
        functionName: "approve";
        args: [Address, bigint];
      } = {
        address: token.address0 as Address,
        account: address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contractAddress!, amountToApprove!],
      };

      try {
        const { request } = await publicClient.simulateContract({
          ...params,
          gas: gasLimit,
        });

        let hash;

        try {
          hash = await walletClient.writeContract({ ...request, account: undefined });
        } catch (e) {
          console.log(e);
        }

        if (hash) {
          const transaction = await publicClient.getTransaction({
            hash,
          });

          const nonce = transaction.nonce;

          addRecentTransaction(
            {
              hash,
              nonce,
              chainId,
              gas: {
                model: GasFeeModel.EIP1559,
                gas: gasLimit.toString(),
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
              },
              params: {
                ...stringifyObject(params),
                abi: [getAbiItem({ name: "approve", abi: ERC20_ABI })],
              },
              title: {
                symbol: token.symbol!,
                template: RecentTransactionTitleTemplate.APPROVE,
                amount: formatUnits(amountToApprove, token.decimals),
                logoURI: token?.logoURI || "/tokens/placeholder.svg",
              },
            },
            address,
          );

          // no await needed, function should return hash without waiting
          waitAndReFetch(hash);

          return { success: true as const, hash };
        }
        return { success: false as const };
      } catch (e) {
        console.log(e);
        addToast("Unexpected error, please contact support", "error");
        return { success: false as const };
      }
    },
    [
      amountToCheck,
      contractAddress,
      token,
      walletClient,
      address,
      chainId,
      publicClient,
      gasLimit,
      addRecentTransaction,
      waitAndReFetch,
    ],
  );

  return {
    isAllowed: Boolean(
      currentAllowanceData && amountToCheck && currentAllowanceData >= amountToCheck,
    ),
    writeTokenApprove,
    currentAllowance: currentAllowanceData,
    estimatedGas: allowanceGasLimitMap[chainId]?.base || defaultApproveValue,
    updateAllowance: refetch,
  };
}

//TODO: Rewrite all useAllowance usages to useStoreAllowance, 16.09.2024
export default function useAllowance({
  token,
  contractAddress,
  amountToCheck,
}: {
  token: Currency | undefined;
  contractAddress: Address | undefined;
  amountToCheck: bigint | null;
}) {
  const [status, setStatus] = useState(AllowanceStatus.INITIAL);
  const chainId = useCurrentChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const { addRecentTransaction } = useRecentTransactionsStore();

  const { refetch, data: currentAllowanceData } = useReadContract({
    abi: ERC20_ABI,
    address: token?.wrapped.address0 as Address,
    functionName: "allowance",
    args: [
      //set ! to avoid ts errors, make sure it is not undefined with "enable" option
      address!,
      contractAddress!,
    ],
    query: {
      //make sure hook don't run when there is no addresses
      enabled: Boolean(token?.wrapped.address0) && Boolean(address) && Boolean(contractAddress),
    },
    // cacheTime: 0,
    // watch: true,
  });

  const { data: blockNumber } = useScopedBlockNumber();

  useEffect(() => {
    // refetch();
  }, [refetch, blockNumber]);

  const isAllowed = useMemo(() => {
    if (!token) {
      return false;
    }

    // if (isNativeToken(token.address)) {
    //   return true;
    // }

    if (currentAllowanceData && amountToCheck) {
      return currentAllowanceData >= amountToCheck;
    }

    return false;
  }, [amountToCheck, currentAllowanceData, token]);

  const writeTokenApprove = useCallback(
    async (customAmount?: bigint) => {
      if (
        !amountToCheck ||
        !contractAddress ||
        !token ||
        !walletClient ||
        !address ||
        !chainId ||
        !publicClient ||
        !token.isToken
      ) {
        console.error("Error: writeTokenApprove ~ something undefined");
        return;
      }
      setStatus(AllowanceStatus.PENDING);

      // customAmount — is amount provided by user in approve amount input
      const amount = customAmount || amountToCheck;
      const params: {
        address: Address;
        account: Address;
        abi: Abi;
        functionName: "approve";
        args: [Address, bigint];
      } = {
        address: token.address0 as Address,
        account: address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contractAddress!, amount!],
      };

      try {
        const estimatedGas = await publicClient.estimateContractGas(params);

        const { request } = await publicClient.simulateContract({
          ...params,
          gas: estimatedGas + BigInt(30000),
        });

        let hash;

        try {
          hash = await walletClient.writeContract({ ...request, account: undefined });
        } catch (e) {
          setStatus(AllowanceStatus.INITIAL);
          console.log(e);
        }

        if (hash) {
          const transaction = await publicClient.getTransaction({
            hash,
          });

          const nonce = transaction.nonce;

          addRecentTransaction(
            {
              hash,
              nonce,
              chainId,
              gas: {
                model: GasFeeModel.EIP1559,
                gas: BigInt(30000).toString(),
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
              },
              params: {
                ...stringifyObject(params),
                abi: [getAbiItem({ name: "approve", abi: ERC20_ABI })],
              },
              title: {
                symbol: token.symbol!,
                template: RecentTransactionTitleTemplate.APPROVE,
                amount: formatUnits(amount, token.decimals),
                logoURI: token?.logoURI || "/tokens/placeholder.svg",
              },
            },
            address,
          );

          setStatus(AllowanceStatus.LOADING);
          await publicClient.waitForTransactionReceipt({ hash });
          setStatus(AllowanceStatus.SUCCESS);
          return { success: true as const, hash };
        }
      } catch (e) {
        console.log(e);
        setStatus(AllowanceStatus.INITIAL);
        addToast("Unexpected error, please contact support", "error");
        return { success: false as const };
      }
    },
    [
      amountToCheck,
      contractAddress,
      token,
      walletClient,
      address,
      chainId,
      publicClient,
      addRecentTransaction,
    ],
  );

  const [estimatedGas, setEstimatedGas] = useState(null as null | bigint);
  useDeepEffect(() => {
    IIFE(async () => {
      if (
        !amountToCheck ||
        !contractAddress ||
        !token ||
        !walletClient ||
        !address ||
        !chainId ||
        !publicClient
      ) {
        return;
      }

      const params: {
        address: Address;
        account: Address;
        abi: Abi;
        functionName: "approve";
        args: [Address, bigint];
      } = {
        address: token.wrapped.address0,
        // TODO: check. Before "fix: fixed re-renders issue" — account: address || contractAddress,
        account: address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contractAddress, amountToCheck],
      };

      try {
        const estimatedGas = await publicClient.estimateContractGas(params);
        setEstimatedGas(estimatedGas);
        console.log(estimatedGas);
      } catch (error) {
        console.warn("🚀 ~ useAllowance ~ estimatedGas ~ error:", error, "params:", params);
        setEstimatedGas(null);
      }
    });
  }, [amountToCheck, contractAddress, token, walletClient, address, chainId, publicClient]);

  return {
    isAllowed,
    status,
    isLoading: status === AllowanceStatus.LOADING,
    isPending: status === AllowanceStatus.PENDING,
    writeTokenApprove,
    currentAllowance: currentAllowanceData,
    estimatedGas,
  };
}
