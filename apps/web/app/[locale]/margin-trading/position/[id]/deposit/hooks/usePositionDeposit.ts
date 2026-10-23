import { useCallback } from "react";
import { Address, getAbiItem, parseUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";

import { useMarginWriteGas } from "@/app/[locale]/margin-trading/components/MarginGasSettings";
import useMarginGasEstimate from "@/app/[locale]/margin-trading/hooks/useMarginGasEstimate";
import useMarginWalletClient from "@/app/[locale]/margin-trading/hooks/useMarginWalletClient";
import { OrderDepositStatus } from "@/app/[locale]/margin-trading/lending-order/[id]/stores/useDepositOrderStatusStore";
import {
  PositionDepositStatus,
  useDepositPositionStatusStore,
} from "@/app/[locale]/margin-trading/position/[id]/stores/usePositionDepositStatusStore";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import { ERC223_ABI } from "@/config/abis/erc223";
import { MARGIN_MODULE_ABI } from "@/config/abis/marginModule";
import { isMarginDeployed } from "@/config/modules";
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

export function usePositionDepositGasEstimate({
  position,
  amount,
  currency,
  standard,
}: {
  position: MarginPosition;
  amount: string;
  currency: Currency | undefined;
  standard: Standard;
}) {
  const chainId = useCurrentChainId();
  useMarginGasEstimate("depositPosition", () => {
    if (!currency || !amount || parseUnits(amount, currency.decimals) <= 0n) return;
    return {
      abi: MARGIN_MODULE_ABI,
      address: MARGIN_TRADING_ADDRESS[chainId],
      functionName: "positionDeposit",
      args: [
        BigInt(position.id),
        getTokenAddressForStandard(currency, standard),
        BigInt(
          position.order.allowedTradingAddresses.findIndex(
            (asset) =>
              asset.toLowerCase() === getTokenAddressForStandard(currency, standard).toLowerCase(),
          ),
        ),
        parseUnits(amount, currency.decimals),
      ],
    };
  });
}

export default function usePositionDeposit({
  position,
  amount,
  currency,
  standard,
}: {
  position: MarginPosition;
  currency: Currency;
  amount: string;
  standard: Standard;
}) {
  const { setStatus, setDepositHash, setApproveHash, setTransferHash } =
    useDepositPositionStatusStore();
  const chainId = useCurrentChainId();
  const gasOverrides = useMarginWriteGas("depositPosition");
  const { data: walletClient } = useMarginWalletClient("depositPosition");

  const publicClient = usePublicClient();
  const { address } = useAccount();
  const {
    isAllowed: isAllowedA,
    writeTokenApprove: approveA,
    updateAllowance,
  } = useStoreAllowance({
    token: currency,
    contractAddress: MARGIN_TRADING_ADDRESS[chainId],
    amountToCheck: parseUnits(amount, currency?.decimals ?? 18),
  });

  const { addRecentTransaction } = useRecentTransactionsStore();

  usePositionDepositGasEstimate({ position, amount, currency, standard });

  const handlePositionDeposit = useCallback(
    async (amountToApprove: string) => {
      // Never build a transaction against the zero address on chains without a margin deployment.
      if (!isMarginDeployed(chainId)) {
        return;
      }

      if (!walletClient || !publicClient || !address) {
        return;
      }

      let failureStatus = PositionDepositStatus.ERROR_DEPOSIT;
      try {
        if (standard === Standard.ERC20 && !currency.isNative) {
          failureStatus = PositionDepositStatus.ERROR_APPROVE;
          setStatus(PositionDepositStatus.PENDING_APPROVE);
          const approveResult = await approveA({
            customAmount: parseUnits(amountToApprove, currency.decimals ?? 18),
            customGasSettings: gasOverrides,
          });

          if (!approveResult?.success) {
            setStatus(PositionDepositStatus.ERROR_APPROVE);
            return;
          }

          setStatus(PositionDepositStatus.LOADING_APPROVE);

          const approveReceipt = await publicClient.waitForTransactionReceipt({
            hash: approveResult.hash,
          });

          if (approveReceipt.status !== "success") {
            setStatus(PositionDepositStatus.ERROR_APPROVE);
            return;
          }
        }

        if (standard === Standard.ERC223 && !currency.isNative) {
          failureStatus = PositionDepositStatus.ERROR_TRANSFER;
          setStatus(PositionDepositStatus.PENDING_TRANSFER);
          const _params = {
            account: address as Address,
            abi: ERC223_ABI,
            functionName: "transfer" as const,
            address: currency.wrapped.address1 as Address,
            args: [
              MARGIN_TRADING_ADDRESS[chainId as DexChainId],
              parseUnits(amount, currency.decimals ?? 18),
            ] as const,
          };

          const _firstDepositHash = await walletClient.writeContract({
            ..._params,
            ...gasOverrides,
            account: undefined,
          });
          setStatus(PositionDepositStatus.LOADING_TRANSFER);
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
            setStatus(PositionDepositStatus.ERROR_TRANSFER);
            return;
          }
        }

        failureStatus = PositionDepositStatus.ERROR_DEPOSIT;
        setStatus(PositionDepositStatus.PENDING_DEPOSIT);

        const depositOrderHash = await walletClient.writeContract({
          abi: MARGIN_MODULE_ABI,
          address: MARGIN_TRADING_ADDRESS[chainId],
          functionName: "positionDeposit",
          args: [
            BigInt(position.id),
            getTokenAddressForStandard(currency, standard),
            BigInt(
              position.order.allowedTradingAddresses.findIndex(
                (asset) =>
                  asset.toLowerCase() ===
                  getTokenAddressForStandard(currency, standard).toLowerCase(),
              ),
            ),
            parseUnits(amount, currency.decimals ?? 18),
          ],
          ...gasOverrides,
          account: undefined,
        });
        setStatus(PositionDepositStatus.LOADING_DEPOSIT);

        const receipt = await publicClient.waitForTransactionReceipt({ hash: depositOrderHash });

        if (receipt.status === "success") {
          setStatus(PositionDepositStatus.SUCCESS);
        } else {
          setStatus(PositionDepositStatus.ERROR_DEPOSIT);
        }
      } catch (error) {
        console.error(error);
        setStatus(failureStatus);
      }
    },
    [
      addRecentTransaction,
      address,
      amount,
      approveA,
      chainId,
      gasOverrides,
      currency,
      position.id,
      position.order.allowedTradingAddresses,
      publicClient,
      setStatus,
      setTransferHash,
      standard,
      walletClient,
    ],
  );

  return { handlePositionDeposit };
}
