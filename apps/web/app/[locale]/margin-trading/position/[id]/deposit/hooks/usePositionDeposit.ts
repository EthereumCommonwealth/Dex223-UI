import { useCallback, useMemo } from "react";
import { getAbiItem, parseUnits } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { getMarginAssetAddress } from "@/app/[locale]/margin-trading/helpers/assetFunding";
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
import { Currency } from "@/sdk_bi/entities/currency";
import { Standard } from "@/sdk_bi/standard";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

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
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { addRecentTransaction } = useRecentTransactionsStore();
  const parsedAmount = useMemo(() => {
    try {
      return amount.trim() ? parseUnits(amount, currency.decimals) : null;
    } catch {
      return null;
    }
  }, [amount, currency.decimals]);
  const depositAddress = getMarginAssetAddress(currency, standard);
  const assetIndex = position.order.allowedTradingAddresses.findIndex(
    (asset) => asset.toLowerCase() === depositAddress.toLowerCase(),
  );
  const { isAllowed, writeTokenApprove } = useStoreAllowance({
    token: standard === Standard.ERC20 && !currency.isNative ? currency : undefined,
    contractAddress: MARGIN_TRADING_ADDRESS[chainId],
    amountToCheck: parsedAmount,
  });

  const handlePositionDeposit = useCallback(
    async (amountToApprove: string) => {
      if (!isMarginDeployed(chainId) || !walletClient || !publicClient || !address) return;
      // positionDeposit is nonpayable and only the owner of an open position can call it.
      const existingAsset = position.assetAddresses.some(
        (asset) => asset.address.toLowerCase() === depositAddress.toLowerCase(),
      );
      if (
        !parsedAmount ||
        parsedAmount <= 0n ||
        currency.isNative ||
        assetIndex < 0 ||
        position.isClosed ||
        position.isLiquidated ||
        position.owner.toLowerCase() !== address.toLowerCase() ||
        (!existingAsset && position.assetAddresses.length >= position.order.currencyLimit)
      ) {
        setStatus(PositionDepositStatus.ERROR_DEPOSIT);
        return;
      }

      let failureStatus = PositionDepositStatus.ERROR_DEPOSIT;
      try {
        if (standard === Standard.ERC20 && !isAllowed) {
          const approvalAmount = parseUnits(amountToApprove, currency.decimals);
          if (approvalAmount < parsedAmount) throw new Error("Approval is too small");
          failureStatus = PositionDepositStatus.ERROR_APPROVE;
          setStatus(PositionDepositStatus.PENDING_APPROVE);
          const result = await writeTokenApprove({
            customAmount: approvalAmount,
          });
          if (!result?.success) throw new Error("Approval failed");
          setApproveHash(result.hash);
          setStatus(PositionDepositStatus.LOADING_APPROVE);
          if (
            (await publicClient.waitForTransactionReceipt({ hash: result.hash })).status !==
            "success"
          )
            throw new Error("Approval failed");
        }
        if (standard === Standard.ERC223) {
          failureStatus = PositionDepositStatus.ERROR_TRANSFER;
          setStatus(PositionDepositStatus.PENDING_TRANSFER);
          const hash = await walletClient.writeContract({
            abi: ERC223_ABI,
            address: depositAddress,
            functionName: "transfer",
            args: [MARGIN_TRADING_ADDRESS[chainId], parsedAmount],
            account: undefined,
          });
          setTransferHash(hash);
          setStatus(PositionDepositStatus.LOADING_TRANSFER);
          const transaction = await getTransactionWithRetries({ hash, publicClient });
          addRecentTransaction(
            {
              hash,
              nonce: transaction.nonce,
              chainId,
              gas: {
                model: GasFeeModel.EIP1559,
                gas: "0",
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
              },
              params: {
                ...stringifyObject({
                  address: depositAddress,
                  functionName: "transfer",
                  args: [MARGIN_TRADING_ADDRESS[chainId], parsedAmount],
                }),
                abi: [getAbiItem({ name: "transfer", abi: ERC223_ABI })],
              },
              title: {
                symbol: currency.symbol!,
                template: RecentTransactionTitleTemplate.TRANSFER,
                amount,
                logoURI: currency.logoURI || "/images/tokens/placeholder.svg",
              },
            },
            address,
          );
          if ((await publicClient.waitForTransactionReceipt({ hash })).status !== "success")
            throw new Error("Transfer failed");
        }

        failureStatus = PositionDepositStatus.ERROR_DEPOSIT;
        setStatus(PositionDepositStatus.PENDING_DEPOSIT);
        const hash = await walletClient.writeContract({
          abi: MARGIN_MODULE_ABI,
          address: MARGIN_TRADING_ADDRESS[chainId],
          functionName: "positionDeposit",
          args: [BigInt(position.id), depositAddress, BigInt(assetIndex), parsedAmount],
          account: undefined,
        });
        setDepositHash(hash);
        setStatus(PositionDepositStatus.LOADING_DEPOSIT);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        setStatus(
          receipt.status === "success"
            ? PositionDepositStatus.SUCCESS
            : PositionDepositStatus.ERROR_DEPOSIT,
        );
      } catch (error) {
        console.error(error);
        setStatus(failureStatus);
      }
    },
    [
      addRecentTransaction,
      amount,
      currency,
      address,
      assetIndex,
      chainId,
      depositAddress,
      isAllowed,
      parsedAmount,
      position,
      publicClient,
      setApproveHash,
      setDepositHash,
      setStatus,
      setTransferHash,
      standard,
      walletClient,
      writeTokenApprove,
    ],
  );

  return { handlePositionDeposit };
}
