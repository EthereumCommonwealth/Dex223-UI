import { useCallback, useMemo } from "react";
import { Abi, Address, formatUnits, getAbiItem } from "viem";
import { useAccount, usePublicClient, useReadContract, useWalletClient } from "wagmi";

import { AddLiquidityApproveStatus } from "@/app/[locale]/add/stores/useAddLiquidityStatusStore";
import { ERC20_ABI } from "@/config/abis/erc20";
import { USDT_ADDRESS_ERC_20 } from "@/config/constants/usdt";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import addToast from "@/other/toast";
import { DexChainId } from "@/sdk_bi/chains";
import { Currency } from "@/sdk_bi/entities/currency";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

export enum AllowanceStatus {
  INITIAL = AddLiquidityApproveStatus.INITIAL,
  PENDING = AddLiquidityApproveStatus.PENDING,
  LOADING = AddLiquidityApproveStatus.LOADING,
  SUCCESS = AddLiquidityApproveStatus.SUCCESS,
  ERROR = AddLiquidityApproveStatus.ERROR,
}

const allowanceGasLimitMap: Record<DexChainId, { base: bigint; additional: bigint }> = {
  [DexChainId.MAINNET]: { base: BigInt(50000), additional: BigInt(12000) },
  [DexChainId.SEPOLIA]: { base: BigInt(46200), additional: BigInt(10000) },
  [DexChainId.BSC_TESTNET]: { base: BigInt(46200), additional: BigInt(10000) },
  [DexChainId.EOS]: { base: BigInt(46200), additional: BigInt(10000) },
  [DexChainId.BASE]: { base: BigInt(60000), additional: BigInt(15000) },
  [DexChainId.BSC]: { base: BigInt(60000), additional: BigInt(15000) },
  [DexChainId.ARBITRUM]: { base: BigInt(60000), additional: BigInt(15000) },
  [DexChainId.POLYGON]: { base: BigInt(70000), additional: BigInt(15000) },
  [DexChainId.AVALANCHE]: { base: BigInt(60000), additional: BigInt(15000) },
  [DexChainId.OPTIMISM]: { base: BigInt(60000), additional: BigInt(15000) },
  [DexChainId.MONAD]: { base: BigInt(90000), additional: BigInt(15000) },
  [DexChainId.UNICHAIN]: { base: BigInt(60000), additional: BigInt(15000) },
  [DexChainId.PLASMA]: { base: BigInt(60000), additional: BigInt(15000) },
  [DexChainId.SONIC]: { base: BigInt(60000), additional: BigInt(15000) },
  [DexChainId.LINEA]: { base: BigInt(60000), additional: BigInt(15000) },
  [DexChainId.INK]: { base: BigInt(60000), additional: BigInt(15000) },
  [DexChainId.MANTLE]: { base: BigInt(60000), additional: BigInt(15000) },
};

const defaultApproveValue = BigInt(46000);

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
      //set ! to avoid ts errors, make sure it is not undefined with "enabled" option
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
  });

  const { addRecentTransaction } = useRecentTransactionsStore();

  const gasLimit = useMemo(() => {
    if (allowanceGasLimitMap[chainId]) {
      return allowanceGasLimitMap[chainId].additional + allowanceGasLimitMap[chainId].base;
    }

    return defaultApproveValue;
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

  const isAllowed = useMemo(() => {
    return Boolean(currentAllowanceData && amountToCheck && currentAllowanceData >= amountToCheck);
  }, [amountToCheck, currentAllowanceData]);

  const writeTokenApprove = useCallback(
    async ({
      customAmount,
      customGasSettings,
    }: {
      customAmount?: bigint;
      customGasSettings?: CustomGasSettings;
    }) => {
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

      // The per-chain table is only a floor. What an approve costs depends on the token and on
      // the network's storage pricing (Sepolia approves that create a new allowance slot cost
      // about 129k gas, more than double the table), and a limit that is too low makes the
      // simulation fail before the wallet opens. Estimate on chain and add a 20% margin.
      let usedGas = gasLimit;
      const approveGas = async (amount: bigint) => {
        try {
          const estimated = await publicClient.estimateContractGas({
            ...params,
            args: [contractAddress!, amount],
          });
          const buffered = (estimated * BigInt(12)) / BigInt(10);
          usedGas = buffered > gasLimit ? buffered : gasLimit;
          return usedGas;
        } catch (e) {
          return gasLimit;
        }
      };

      // Mainnet USDT reverts when a non-zero allowance is changed to another non-zero
      // value. Reset it to 0 and wait until that transaction is mined before approving
      // the amount from the dialog. Other tokens keep the single approval below.
      const isMainnetUsdt = token.address0.toLowerCase() === USDT_ADDRESS_ERC_20.toLowerCase();

      if (!isAllowed && currentAllowanceData !== BigInt(0) && isMainnetUsdt) {
        try {
          const hash = await walletClient.writeContract({
            ...params,
            args: [contractAddress, BigInt(0)],
            ...(customGasSettings || {}),
            gas: await approveGas(BigInt(0)),
            account: undefined,
          });
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          if (receipt.status !== "success") {
            return { success: false as const };
          }
        } catch (e) {
          console.log(e);
          if ((e as any)?.name !== "UserRejectedRequestError" && !/rejected/i.test(String(e))) {
            addToast((e as any)?.shortMessage || String(e), "error");
          }
          return { success: false as const };
        }
      }

      try {
        let hash;

        try {
          if (isMainnetUsdt) {
            hash = await walletClient.writeContract({
              ...params,
              ...(customGasSettings || {}),
              args: [contractAddress!, amountToApprove],
              gas: await approveGas(amountToApprove),
              account: undefined,
            });
          } else {
            const { request } = await publicClient.simulateContract({
              ...params,
              ...(customGasSettings || {}),
              gas: await approveGas(amountToApprove),
            });
            hash = await walletClient.writeContract({ ...request, account: undefined });
          }
        } catch (e) {
          console.log(e);
          // A failed simulation used to end here silently, so Approve looked like it did nothing.
          if ((e as any)?.name !== "UserRejectedRequestError" && !/rejected/i.test(String(e))) {
            addToast((e as any)?.shortMessage || String(e), "error");
          }
        }

        if (hash) {
          const transaction = await getTransactionWithRetries({ hash, publicClient });

          if (transaction) {
            const transaction = await publicClient.getTransaction({
              hash,
              blockTag: "pending" as any,
            });

            const nonce = transaction.nonce;

            addRecentTransaction(
              {
                hash,
                nonce,
                chainId,
                gas: {
                  model: GasFeeModel.EIP1559,
                  gas: usedGas.toString(),
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
                  logoURI: token?.logoURI || "/images/tokens/placeholder.svg",
                },
              },
              address,
            );

            // no await needed, function should return hash without waiting
            waitAndReFetch(hash);

            return { success: true as const, hash };
          }
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
      contractAddress,
      token,
      walletClient,
      address,
      chainId,
      publicClient,
      isAllowed,
      currentAllowanceData,
      gasLimit,
      addRecentTransaction,
      waitAndReFetch,
    ],
  );

  return {
    isAllowed,
    writeTokenApprove,
    currentAllowance: currentAllowanceData,
    estimatedGas: allowanceGasLimitMap[chainId]?.base || defaultApproveValue,
    updateAllowance: refetch,
  };
}
