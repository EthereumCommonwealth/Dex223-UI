import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo } from "react";
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  getAbiItem,
  Hash,
  keccak256,
  parseUnits,
} from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { useEditOrderConfigStore } from "@/app/[locale]/margin-trading/lending-order/[id]/edit/stores/useEditOrderConfigStore";
import {
  EditOrderStatus,
  useEditOrderStatusStore,
} from "@/app/[locale]/margin-trading/lending-order/[id]/edit/stores/useEditOrderStatusStore";
import { OrderDepositStatus } from "@/app/[locale]/margin-trading/lending-order/[id]/stores/useDepositOrderStatusStore";
import { TradingTokensInputMode } from "@/app/[locale]/margin-trading/lending-order/create/steps/types";
import {
  useCreateOrderGasLimitStore,
  useCreateOrderGasPriceStore,
} from "@/app/[locale]/margin-trading/lending-order/create/stores/useSwapGasSettingsStore";
import { LendingOrder } from "@/app/[locale]/margin-trading/types";
import { MARGIN_MODULE_ABI } from "@/config/abis/marginModule";
import { getGasSettings } from "@/functions/gasSettings";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import { useStoreAllowance } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useFees } from "@/hooks/useFees";
import addToast from "@/other/toast";
import { MARGIN_TRADING_ADDRESS, ORACLE_ADDRESS } from "@/sdk_bi/addresses";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

export function useEditOrderParams() {
  const { firstStepValues, secondStepValues, thirdStepValues } = useEditOrderConfigStore();

  return {
    ...firstStepValues,
    ...secondStepValues,
    ...thirdStepValues,
  };
}

export function sortAddresses(addresses: string[]): string[] {
  return addresses.sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1));
}

export function getWhitelistId(addresses: Address[], isContract: boolean): Hash {
  const encoded = encodeAbiParameters(
    [
      { type: "bool", name: "isContract" },
      { type: "address[]", name: "tokens" },
    ],
    [isContract, addresses],
  );

  return keccak256(encoded);
}

/**
 * Calculate the on‐chain interestRate parameter.
 *
 * The contract expects:
 *   – interestRate = (30-day rate × 100) prorated to position duration
 *   – e.g. 11.5% for 30 days ⇒ 1150, half that for 15 days ⇒ 575
 *
 * @param monthlyPct    30-day interest rate in percent (e.g. 11.5 for 11.5%)
 * @param durationDays  Actual position length in days
 * @returns             Integer interestRate for your contract
 */
export function calculateInterestRate(monthlyPct: number, durationDays: number): bigint {
  // Convert 30-day % to “percent × 100”
  return BigInt(monthlyPct * 100);
  // Prorate by (durationDays / 30)
  // const prorated = (baseRate * durationDays) / 30;
  // // Round down to an integer (solidity uint)
  // return BigInt(Math.floor(prorated));
}

export default function useEditOrder() {
  const t = useTranslations("Swap");
  const { data: walletClient } = useWalletClient();
  const params = useEditOrderParams();
  const publicClient = usePublicClient();
  const chainId = useCurrentChainId();

  const { setStatus, setModifyOrderHash } = useEditOrderStatusStore();

  const {
    isAllowed: isAllowedA,
    writeTokenApprove: approveA,
    updateAllowance,
  } = useStoreAllowance({
    token: params.loanToken,
    contractAddress: MARGIN_TRADING_ADDRESS[chainId],
    amountToCheck: parseUnits(params.loanAmount, params.loanToken?.decimals ?? 18),
  });

  const { addRecentTransaction } = useRecentTransactionsStore();

  const { customGasLimit } = useCreateOrderGasLimitStore();
  const { gasPriceOption, gasPriceSettings } = useCreateOrderGasPriceStore();
  const { baseFee, priorityFee, gasPrice } = useFees();
  const {
    tradingTokens,
    loanToken,
    loanTokenStandard,
    collateralTokens,
    loanAmount,
    includeERC223Collateral,
    liquidationFeeToken,
    liquidationFeeForLiquidator,
    liquidationFeeForLender,
    liquidationMode,
    minimumBorrowingAmount,
    orderCurrencyLimit,
    period,
    interestRatePerMonth,
    leverage,
    priceSource,
  } = useEditOrderParams();

  const gasSettings = useMemo(() => {
    return getGasSettings({
      baseFee,
      chainId,
      gasPrice,
      priorityFee,
      gasPriceOption,
      gasPriceSettings,
    });
  }, [baseFee, chainId, gasPrice, priorityFee, gasPriceOption, gasPriceSettings]);

  const { address } = useAccount();
  useEffect(() => {
    setStatus(EditOrderStatus.INITIAL);
  }, [setStatus]);

  const handleEditOrder = useCallback(
    async (order: LendingOrder, recreateTokenList: boolean) => {
      setStatus(EditOrderStatus.PENDING_MODIFY);

      if (
        !params.loanToken ||
        !publicClient ||
        !walletClient ||
        !loanToken ||
        !liquidationFeeToken ||
        (tradingTokens.inputMode === TradingTokensInputMode.AUTOLISTING &&
          !tradingTokens.tradingTokensAutoListing) ||
        !address
      ) {
        return;
      }

      const sortedAddresses =
        tradingTokens.inputMode === TradingTokensInputMode.AUTOLISTING
          ? [tradingTokens.tradingTokensAutoListing!.id] // add ! here because we have check upper
          : (sortAddresses(
              tradingTokens.allowedTokens.flatMap((token) =>
                tradingTokens.includeERC223Trading
                  ? [token.wrapped.address0, token.wrapped.address1]
                  : [token.wrapped.address0],
              ),
            ) as Address[]);

      const encodedAddTokenListParams = encodeFunctionData({
        abi: MARGIN_MODULE_ABI,
        functionName: "addTokenlist",
        args: [sortedAddresses, tradingTokens.inputMode === TradingTokensInputMode.AUTOLISTING],
      });

      const whitelistId = getWhitelistId(
        sortedAddresses,
        tradingTokens.inputMode === TradingTokensInputMode.AUTOLISTING,
      );

      const encodedModifyOrderParams = encodeFunctionData({
        abi: MARGIN_MODULE_ABI,
        functionName: "modifyOrder",
        args: [
          BigInt(order.id), // _orderId
          whitelistId, // _whitelist
          calculateInterestRate(Number(interestRatePerMonth), Number(period.positionDuration)), // _interestRate
          BigInt(Number(period.positionDuration) * 24 * 60 * 60), // _duration
          parseUnits(minimumBorrowingAmount.toString(), loanToken.decimals), // _minLoan
          Number(orderCurrencyLimit), // _currencyLimit
          leverage, // _leverage
          ORACLE_ADDRESS[chainId], // _oracle
          parseUnits(liquidationFeeForLiquidator, liquidationFeeToken.decimals), // _liquidationRewardAmount
          liquidationFeeToken.wrapped.address0, // _liquidationRewardAsset
          Math.floor(new Date(period.lendingOrderDeadline).getTime() / 1000), // _deadline
        ],
      });

      const actionsToUpdate = recreateTokenList
        ? [encodedAddTokenListParams, encodedModifyOrderParams]
        : [encodedModifyOrderParams];
      //
      // const addTokenListHash = await walletClient.writeContract({
      //   abi: MARGIN_MODULE_ABI,
      //   address: MARGIN_TRADING_ADDRESS[chainId],
      //   functionName: "addTokenlist",
      //   args: [sortedAddresses, tradingTokens.inputMode === TradingTokensInputMode.AUTOLISTING],
      //   account: undefined,
      // });
      //
      // setStatus(CreateOrderStatus.LOADING_CONFIRM_ORDER);
      // await publicClient.waitForTransactionReceipt({ hash: addTokenListHash });
      // setStatus(CreateOrderStatus.PENDING_CONFIRM_ORDER);
      //

      try {
        const modifyOrderHash = await walletClient.writeContract({
          abi: MARGIN_MODULE_ABI,
          address: MARGIN_TRADING_ADDRESS[chainId],
          functionName: "multicall",
          args: [actionsToUpdate],
          account: undefined,
        });
        setStatus(EditOrderStatus.LOADING_MODIFY);
        setModifyOrderHash(modifyOrderHash);

        const transaction = await getTransactionWithRetries({
          hash: modifyOrderHash,
          publicClient,
        });

        const nonce = transaction.nonce;

        addRecentTransaction(
          {
            hash: modifyOrderHash,
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
              abi: [getAbiItem({ name: "setOrderStatus", abi: MARGIN_MODULE_ABI })],
            },
            title: {
              symbol: order.baseAsset.symbol!,
              orderId: order.id,
              template: RecentTransactionTitleTemplate.EDIT_LENDING_ORDER,
              logoURI: order.baseAsset?.logoURI || "/images/tokens/placeholder.svg",
            },
          },
          address,
        );

        const createOrderReceipt = await publicClient.waitForTransactionReceipt({
          hash: modifyOrderHash,
        });

        if (createOrderReceipt.status === "success") {
          setStatus(EditOrderStatus.SUCCESS);
        } else {
          setStatus(EditOrderStatus.ERROR_MODIFY);
        }

        // console.log("Receipt", receipt);
      } catch (e) {
        console.log(e);
        addToast("Unexpected error", "error");
        setStatus(EditOrderStatus.INITIAL);
      }
    },
    [
      addRecentTransaction,
      address,
      chainId,
      interestRatePerMonth,
      leverage,
      liquidationFeeForLiquidator,
      liquidationFeeToken,
      loanToken,
      minimumBorrowingAmount,
      orderCurrencyLimit,
      params,
      period.lendingOrderDeadline,
      period.positionDuration,
      publicClient,
      setModifyOrderHash,
      setStatus,
      tradingTokens.allowedTokens,
      tradingTokens.includeERC223Trading,
      tradingTokens.inputMode,
      tradingTokens.tradingTokensAutoListing,
      walletClient,
    ],
  );

  return { handleEditOrder };
}
