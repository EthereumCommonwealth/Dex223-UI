import { useCallback } from "react";
import { Address, getAbiItem, parseUnits } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import {
  OrderDepositStatus,
  useDepositOrderStatusStore,
} from "@/app/[locale]/margin-trading/lending-order/[id]/stores/useDepositOrderStatusStore";
import { ERC223_ABI } from "@/config/abis/erc223";
import { MARGIN_MODULE_ABI } from "@/config/abis/marginModule";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import { useStoreAllowance } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { MARGIN_TRADING_ADDRESS } from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";
import { Currency } from "@/sdk_bi/entities/currency";
import { getTokenAddressForStandard, Standard } from "@/sdk_bi/standard";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

export default function useOrderDeposit({
  orderId,
  amount,
  currency,
  standard,
}: {
  orderId: number;
  currency: Currency;
  amount: string;
  standard: Standard;
}) {
  const { setStatus, setDepositHash, setApproveHash, setTransferHash } =
    useDepositOrderStatusStore();
  const chainId = useCurrentChainId();
  const { data: walletClient } = useWalletClient();

  const { address } = useAccount();
  const publicClient = usePublicClient();

  const { addRecentTransaction } = useRecentTransactionsStore();

  const {
    isAllowed: isAllowedA,
    writeTokenApprove: approveA,
    updateAllowance,
  } = useStoreAllowance({
    token: currency,
    contractAddress: MARGIN_TRADING_ADDRESS[chainId],
    amountToCheck: parseUnits(amount, currency?.decimals ?? 18),
  });

  const handleOrderDeposit = useCallback(
    async (amountToApprove: string) => {
      if (!walletClient || !publicClient || !address) {
        return;
      }

      if (currency.isNative) {
        setStatus(OrderDepositStatus.PENDING_DEPOSIT);

        const nativeParams = {
          abi: MARGIN_MODULE_ABI,
          address: MARGIN_TRADING_ADDRESS[chainId],
          functionName: "orderDepositWETH9" as const,
          args: [BigInt(orderId), getTokenAddressForStandard(currency, standard)] as const,
          value: parseUnits(amount, currency.decimals ?? 18),
        };

        const depositOrderHash = await walletClient.writeContract({
          ...nativeParams,
          account: undefined,
        });

        setStatus(OrderDepositStatus.LOADING_DEPOSIT);
        setDepositHash(depositOrderHash);

        const transaction = await getTransactionWithRetries({
          hash: depositOrderHash,
          publicClient,
        });

        const nonce = transaction.nonce;

        addRecentTransaction(
          {
            hash: depositOrderHash,
            nonce,
            chainId,
            gas: {
              model: GasFeeModel.EIP1559,
              gas: "0",
              maxFeePerGas: undefined,
              maxPriorityFeePerGas: undefined,
            },
            params: {
              ...stringifyObject(nativeParams),
              abi: [getAbiItem({ name: "orderDepositWETH9", abi: MARGIN_MODULE_ABI })],
            },
            title: {
              symbol: currency.symbol!,
              template: RecentTransactionTitleTemplate.DEPOSIT,
              amount: amount,
              logoURI: currency?.logoURI || "/images/tokens/placeholder.svg",
            },
          },
          address,
        );

        const receipt = await publicClient.waitForTransactionReceipt({ hash: depositOrderHash });

        if (receipt.status === "success") {
          setStatus(OrderDepositStatus.SUCCESS);
        } else {
          setStatus(OrderDepositStatus.ERROR_DEPOSIT);
        }
      } else {
        if (standard === Standard.ERC20) {
          if (!isAllowedA) {
            setStatus(OrderDepositStatus.PENDING_APPROVE);
            const approveResult = await approveA({
              customAmount: parseUnits(amountToApprove, currency.decimals ?? 18),
              // customGasSettings: gasSettings,
            });

            if (!approveResult?.success) {
              setStatus(OrderDepositStatus.ERROR_APPROVE);
              return;
            }

            setApproveHash(approveResult.hash);
            setStatus(OrderDepositStatus.LOADING_APPROVE);

            const approveReceipt = await publicClient.waitForTransactionReceipt({
              hash: approveResult.hash,
            });

            if (approveReceipt.status !== "success") {
              setStatus(OrderDepositStatus.ERROR_APPROVE);
              return;
            }
          }
        } else {
          setStatus(OrderDepositStatus.PENDING_TRANSFER);
          const _params = {
            account: address as Address,
            abi: ERC223_ABI,
            functionName: "transfer" as const,
            address: currency.wrapped.address1 as Address,
            args: [
              MARGIN_TRADING_ADDRESS[chainId as DexChainId],
              parseUnits(amountToApprove, currency.decimals ?? 18),
            ] as const,
          };

          const _firstDepositHash = await walletClient.writeContract({
            ..._params,
            account: undefined,
          });
          setStatus(OrderDepositStatus.LOADING_TRANSFER);
          setTransferHash(_firstDepositHash);

          const transaction = await getTransactionWithRetries({
            hash: _firstDepositHash,
            publicClient,
          });

          const nonce = transaction.nonce;

          addRecentTransaction(
            {
              hash: _firstDepositHash,
              nonce,
              chainId,
              gas: {
                model: GasFeeModel.EIP1559,
                gas: "0",
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
              },
              params: {
                ...stringifyObject(_params),
                abi: [getAbiItem({ name: "transfer", abi: ERC223_ABI })],
              },
              title: {
                symbol: currency.symbol!,
                template: RecentTransactionTitleTemplate.TRANSFER,
                amount: amount,
                logoURI: currency?.logoURI || "/images/tokens/placeholder.svg",
              },
            },
            address,
          );

          const receipt = await publicClient.waitForTransactionReceipt({ hash: _firstDepositHash });

          if (receipt.status !== "success") {
            setStatus(OrderDepositStatus.ERROR_TRANSFER);
            return;
          }
        }

        setStatus(OrderDepositStatus.PENDING_DEPOSIT);

        const params = {
          abi: MARGIN_MODULE_ABI,
          address: MARGIN_TRADING_ADDRESS[chainId],
          functionName: "orderDepositToken" as const,
          args: [BigInt(orderId), parseUnits(amount, currency.decimals ?? 18)] as const,
        };

        try {
          const depositOrderHash = await walletClient.writeContract({
            ...params,
            account: undefined,
          });
          setStatus(OrderDepositStatus.LOADING_DEPOSIT);

          setDepositHash(depositOrderHash);

          const transaction = await getTransactionWithRetries({
            hash: depositOrderHash,
            publicClient,
          });

          const nonce = transaction.nonce;

          addRecentTransaction(
            {
              hash: depositOrderHash,
              nonce,
              chainId,
              gas: {
                model: GasFeeModel.EIP1559,
                gas: "0",
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
              },
              params: {
                ...stringifyObject(params),
                abi: [getAbiItem({ name: "orderDepositToken", abi: MARGIN_MODULE_ABI })],
              },
              title: {
                symbol: currency.symbol!,
                template: RecentTransactionTitleTemplate.DEPOSIT,
                amount: amount,
                logoURI: currency?.logoURI || "/images/tokens/placeholder.svg",
              },
            },
            address,
          );
          const receipt = await publicClient.waitForTransactionReceipt({ hash: depositOrderHash });
          if (receipt.status === "success") {
            setStatus(OrderDepositStatus.SUCCESS);
          } else {
            setStatus(OrderDepositStatus.ERROR_DEPOSIT);
          }
        } catch (e) {
          setStatus(OrderDepositStatus.ERROR_DEPOSIT);
        }
      }

      return;
    },
    [
      addRecentTransaction,
      address,
      amount,
      approveA,
      chainId,
      currency,
      isAllowedA,
      orderId,
      publicClient,
      setApproveHash,
      setDepositHash,
      setStatus,
      setTransferHash,
      standard,
      walletClient,
    ],
  );

  return { handleOrderDeposit };
}
