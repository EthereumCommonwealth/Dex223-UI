import { useCallback, useEffect, useMemo, useState } from "react";
import { Abi, Address, formatUnits, getAbiItem, parseUnits } from "viem";
import {
  useAccount,
  useBlockNumber,
  usePublicClient,
  useReadContract,
  useWalletClient,
} from "wagmi";

import { ERC20_ABI } from "@/config/abis/erc20";
import { formatFloat } from "@/functions/formatFloat";
import { IIFE } from "@/functions/iife";
import addToast from "@/other/toast";
import { Currency } from "@/sdk_hybrid/entities/currency";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

import { AllowanceStatus } from "./useAllowance";
import useCurrentChainId from "./useCurrentChainId";

const amountToRevoke = BigInt(0);

export default function useRevoke({
  token,
  contractAddress,
}: {
  token: Currency | undefined;
  contractAddress: Address | undefined;
}) {
  const [status, setStatus] = useState(AllowanceStatus.INITIAL);
  const { address } = useAccount();
  const chainId = useCurrentChainId();
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

  const { data: blockNumber } = useBlockNumber({ watch: true });

  useEffect(() => {
    refetch();
  }, [refetch, blockNumber]);

  const writeTokenRevoke = useCallback(async () => {
    if (!contractAddress || !token || !walletClient || !address || !chainId || !publicClient) {
      return;
    }

    setStatus(AllowanceStatus.PENDING);

    const params: {
      address: Address;
      account: Address;
      abi: Abi;
      functionName: "approve";
      args: [Address, bigint];
    } = {
      address: token.wrapped.address0 as Address,
      account: address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [contractAddress!, amountToRevoke!],
    };

    try {
      const estimatedGas = await publicClient.estimateContractGas(params);

      const { request } = await publicClient.simulateContract({
        ...params,
        gas: estimatedGas + BigInt(30000),
      });
      const hash = await walletClient.writeContract(request);

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
            gas: (estimatedGas + BigInt(30000)).toString(),
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
            amount: formatFloat(formatUnits(amountToRevoke, token.decimals)),
            logoURI: token?.logoURI || "/tokens/placeholder.svg",
          },
        },
        address,
      );

      if (hash) {
        setStatus(AllowanceStatus.LOADING);
        await publicClient.waitForTransactionReceipt({ hash });
        setStatus(AllowanceStatus.SUCCESS);
      }
    } catch (e) {
      console.log(e);
      setStatus(AllowanceStatus.INITIAL);
      addToast("Unexpected error, please contact support", "error");
    }
  }, [contractAddress, token, walletClient, address, chainId, publicClient, addRecentTransaction]);

  const [estimatedGas, setEstimatedGas] = useState(null as null | bigint);

  useEffect(() => {
    IIFE(async () => {
      if (!contractAddress || !token || !walletClient || !address || !chainId || !publicClient) {
        return;
      }

      const params: {
        address: Address;
        account: Address;
        abi: Abi;
        functionName: "approve";
        args: [Address, bigint];
      } = {
        address: token.wrapped.address0 as Address,
        account: address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contractAddress!, amountToRevoke!],
      };

      try {
        const estimatedGas = await publicClient.estimateContractGas(params);
        setEstimatedGas(estimatedGas);
      } catch (error) {
        console.warn("🚀 ~ useRevoke ~ estimatedGas ~ error:", error, "params:", params);
        setEstimatedGas(null);
      }
    });
  }, [contractAddress, token, walletClient, address, chainId, publicClient]);

  return {
    revokeStatus: status,
    revokeHandler: writeTokenRevoke,
    revokeEstimatedGas: estimatedGas,
    currentAllowance: currentAllowanceData,
  };
}
