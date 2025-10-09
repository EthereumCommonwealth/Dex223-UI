import { useCallback, useMemo } from "react";
import { Address, formatUnits, getAbiItem } from "viem";
import { useAccount, usePublicClient, useReadContract, useWalletClient } from "wagmi";

import { ERC223_ABI } from "@/config/abis/erc223";
import { NONFUNGIBLE_POSITION_MANAGER_ABI } from "@/config/abis/nonfungiblePositionManager";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import addToast from "@/other/toast";
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESS } from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";
import { Currency } from "@/sdk_bi/entities/currency";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

import useCurrentChainId from "./useCurrentChainId";

const depositeGasLimitMap: Record<DexChainId, { base: bigint; additional: bigint }> = {
  [DexChainId.MAINNET]: { base: BigInt(100000), additional: BigInt(10000) },
  [DexChainId.SEPOLIA]: { base: BigInt(100000), additional: BigInt(10000) },
  [DexChainId.BSC_TESTNET]: { base: BigInt(100000), additional: BigInt(10000) },
  [DexChainId.EOS]: { base: BigInt(100000), additional: BigInt(10000) },
  [DexChainId.APE_CHAIN]: { base: BigInt(100000), additional: BigInt(10000) },
};

const defaultDepositeValue = BigInt(100000);

type CustomGasSettings =
  | {
      maxPriorityFeePerGas: bigint | undefined;
      maxFeePerGas: bigint | undefined;
      gasPrice?: undefined;
    }
  | {
      gasPrice: bigint | undefined;
      maxPriorityFeePerGas?: undefined;
      maxFeePerGas?: undefined;
    }
  | undefined;

export function useStoreDeposit({
  token,
  amountToCheck,
}: {
  token: Currency | undefined;
  amountToCheck: bigint | null;
}) {
  const { address } = useAccount();
  const chainId = useCurrentChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const { refetch, data: currentDepositData } = useReadContract({
    address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
    abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
    functionName: "depositedTokens",
    args: [
      //set ! to avoid ts errors, make sure it is not undefined with "enable" option
      address!,
      token?.wrapped.address1!,
    ],
    scopeKey: `${token?.wrapped.address1}-${address}-${chainId}`,
    query: {
      //make sure hook don't run when there is no addresses
      enabled: Boolean(token?.wrapped.address1) && Boolean(token?.isToken) && Boolean(address),
    },
    // cacheTime: 0,
    // watch: true,
  });

  const { addRecentTransaction } = useRecentTransactionsStore();

  const gasLimit = useMemo(() => {
    if (depositeGasLimitMap[chainId]) {
      return depositeGasLimitMap[chainId].additional + depositeGasLimitMap[chainId].base;
    }

    return defaultDepositeValue;
  }, [chainId]);

  const waitAndReFetch = useCallback(
    async (hash: Address) => {
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        await refetch();
      }
    },
    [publicClient, refetch],
  );

  const writeTokenDeposit = useCallback(
    async ({
      customAmount,
      customGasSettings,
    }: {
      customAmount?: bigint;
      customGasSettings?: CustomGasSettings;
    }) => {
      const amount =
        currentDepositData && amountToCheck && currentDepositData < amountToCheck
          ? amountToCheck - currentDepositData
          : amountToCheck;

      const amountToDeposite = customAmount || amount;

      if (!amountToDeposite || !token || !walletClient || !address || !chainId || !publicClient) {
        console.error("Error: writeTokenDeposit ~ something undefined");
        return;
      }

      if (token.isNative) {
        return;
      }

      const params = {
        account: address as Address,
        abi: ERC223_ABI,
        functionName: "transfer" as const,
        address: token.wrapped.address1 as Address,
        args: [
          NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
          amountToDeposite,
        ] as const,
      };

      try {
        // const { request } = await publicClient.simulateContract({
        //   ...params,
        //   ...(customGasSettings || {}),
        //   gas: gasLimit,
        // });

        let hash;

        try {
          hash = await walletClient.writeContract({ ...params, account: undefined });
        } catch (e) {
          console.log(e);
        }

        if (hash) {
          const transaction = await getTransactionWithRetries({
            hash,
            publicClient,
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
                abi: [getAbiItem({ name: "transfer", abi: ERC223_ABI })],
              },
              title: {
                symbol: token.symbol!,
                template: RecentTransactionTitleTemplate.DEPOSIT,
                amount: formatUnits(amountToDeposite, token.decimals),
                logoURI: token?.logoURI || "/images/tokens/placeholder.svg",
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
        addToast((e as any).toString(), "error");
        return { success: false as const };
      }
    },
    [
      amountToCheck,
      token,
      walletClient,
      address,
      chainId,
      publicClient,
      gasLimit,
      addRecentTransaction,
      waitAndReFetch,
      currentDepositData,
    ],
  );

  return {
    isDeposited: Boolean(
      currentDepositData && amountToCheck && currentDepositData >= amountToCheck,
    ),
    writeTokenDeposit,
    currentDeposit: currentDepositData,
    estimatedGas: depositeGasLimitMap[chainId]?.base || defaultDepositeValue,
    updateDeposite: refetch,
  };
}
