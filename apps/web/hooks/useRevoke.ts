import { useCallback, useEffect, useMemo, useState } from "react";
import { Abi, Address, formatUnits, getAbiItem } from "viem";
import { useAccount, usePublicClient, useReadContract, useWalletClient } from "wagmi";

import { useRevokeGasSettings } from "@/app/[locale]/add/stores/useRevokeGasSettings";
import { useRevokeGasLimitStore } from "@/app/[locale]/add/stores/useRevokeGasSettings";
import { useRefreshDepositsDataStore } from "@/app/[locale]/portfolio/components/stores/useRefreshTableStore";
import { ERC20_ABI } from "@/config/abis/erc20";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import { IIFE } from "@/functions/iife";
import useDeepEffect from "@/hooks/useDeepEffect";
import addToast from "@/other/toast";
import { Currency } from "@/sdk_bi/entities/currency";
import { useGlobalBlockNumber } from "@/shared/hooks/useGlobalBlockNumber";
import {
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";
import { useRevokeStatusStore } from "@/stores/useRevokeStatusStore";

import { AllowanceStatus } from "./useAllowance";
import useCurrentChainId from "./useCurrentChainId";

const amountToRevoke = BigInt(0);

const useRevokeParams = ({
  token,
  contractAddress,
}: {
  token: Currency | undefined;
  contractAddress: Address | undefined;
}) => {
  const { address } = useAccount();

  return useMemo(() => {
    if (!contractAddress || !token || !address) return {};

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

    return { params };
  }, [token, address, contractAddress]);
};

const REVOKE_DEFAULT_GAS_LIMIT = BigInt(50000);
export function useRevokeEstimatedGas({
  token,
  contractAddress,
}: {
  token: Currency | undefined;
  contractAddress: Address | undefined;
}) {
  const { setEstimatedGas } = useRevokeGasLimitStore();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { params } = useRevokeParams({ token, contractAddress });

  useDeepEffect(() => {
    IIFE(async () => {
      if (!params || !address) {
        setEstimatedGas(REVOKE_DEFAULT_GAS_LIMIT);
        console.log("Can't estimate gas");
        return;
      }

      try {
        // const estimated = await publicClient?.estimateContractGas(params as any);

        // if (estimated) {
        //   setEstimatedGas(estimated + BigInt(10000));
        // } else {
        setEstimatedGas(REVOKE_DEFAULT_GAS_LIMIT);
        // }
      } catch (e) {
        console.error(e);
        setEstimatedGas(REVOKE_DEFAULT_GAS_LIMIT);
      }
    });
  }, [publicClient, address, params]);
}

export default function useRevoke({
  token,
  contractAddress,
}: {
  token: Currency | undefined;
  contractAddress: Address | undefined;
}) {
  const { status, setStatus } = useRevokeStatusStore();
  const { address } = useAccount();
  const chainId = useCurrentChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [hash, setHash] = useState<string | undefined>(undefined);

  const { addRecentTransaction } = useRecentTransactionsStore();

  const { setRefreshDepositsTrigger } = useRefreshDepositsDataStore();

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

  const { blockNumber } = useGlobalBlockNumber();

  const { gasSettings, customGasLimit, gasModel } = useRevokeGasSettings();

  useEffect(() => {
    refetch();
  }, [refetch, blockNumber]);

  const { params } = useRevokeParams({ token, contractAddress });

  const writeTokenRevoke = useCallback(async () => {
    if (
      !contractAddress ||
      !token ||
      !walletClient ||
      !address ||
      !chainId ||
      !publicClient ||
      !params
    ) {
      return;
    }

    setStatus(AllowanceStatus.PENDING);

    try {
      const estimatedGas = await publicClient.estimateContractGas(params);
      const gasToUse = customGasLimit ? customGasLimit : estimatedGas + BigInt(10000); // set custom gas here if user changed it

      const { request } = await publicClient.simulateContract({
        ...params,
        ...gasSettings,
        gas: gasToUse,
      });

      const hash = await walletClient.writeContract(request);
      const transaction = await getTransactionWithRetries({
        hash,
        publicClient,
      });

      setHash(hash);

      const nonce = transaction.nonce;

      addRecentTransaction(
        {
          hash,
          nonce,
          chainId,
          gas: {
            ...stringifyObject({ ...gasSettings, model: gasModel }),
            gas: gasToUse.toString(),
          },
          params: {
            ...stringifyObject(params),
            abi: [getAbiItem({ name: "approve", abi: ERC20_ABI })],
          },
          title: {
            symbol: token.symbol!,
            template: RecentTransactionTitleTemplate.APPROVE,
            amount: formatUnits(amountToRevoke, token.decimals),
            logoURI: token?.logoURI || "/images/tokens/placeholder.svg",
          },
        },
        address,
      );

      if (hash) {
        setStatus(AllowanceStatus.LOADING);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // A reverted transaction still produces a receipt; without checking it a
        // failed revoke was shown as successful, leaving the allowance in place while
        // the user believed it had been removed.
        if (receipt.status !== "success") {
          setStatus(AllowanceStatus.INITIAL);
          return;
        }

        setStatus(AllowanceStatus.SUCCESS);
        setRefreshDepositsTrigger(true);
      }
    } catch (e) {
      console.log(e);
      setStatus(AllowanceStatus.INITIAL);
      addToast((e as any).toString(), "error");
    }
  }, [
    contractAddress,
    token,
    walletClient,
    address,
    chainId,
    publicClient,
    params,
    setStatus,
    customGasLimit,
    gasSettings,
    addRecentTransaction,
    gasModel,
    setRefreshDepositsTrigger,
  ]);

  // if ((currentAllowanceData || 0) > 0 && status === AllowanceStatus.SUCCESS) {
  //   console.log("resetting revoke status");
  //   setStatus(AllowanceStatus.INITIAL);
  // }

  return {
    revokeHash: hash,
    revokeStatus: status,
    revokeHandler: writeTokenRevoke,
    currentAllowance: currentAllowanceData,
  };
}
