import { useMemo } from "react";
import { parseGwei } from "viem";

import { RecentTransaction } from "@/db/db";
import { add10PercentsToBigInt } from "@/functions/addPercentsToBigInt";
import { useFees } from "@/hooks/useFees";
import { GasFeeModel, IRecentTransaction } from "@/stores/useRecentTransactionsStore";

export default function useRepriceGasValidation({
  transaction,
  ...values
}: {
  transaction: IRecentTransaction | null;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  gasPrice: string;
}) {
  const { baseFee, priorityFee, gasPrice } = useFees();

  const maxFeePerGasError = useMemo(() => {
    return transaction?.gas.model === GasFeeModel.EIP1559 &&
      transaction.gas.maxFeePerGas &&
      parseGwei(values.maxFeePerGas) < add10PercentsToBigInt(transaction.gas.maxFeePerGas)
      ? "You have to set at least +10% value to apply transaction speed up."
      : undefined;
  }, [transaction, values.maxFeePerGas]);

  const legacyGasPriceError = useMemo(() => {
    return transaction?.gas.model === GasFeeModel.LEGACY &&
      transaction.gas.gasPrice &&
      parseGwei(values.gasPrice) < add10PercentsToBigInt(transaction.gas.gasPrice)
      ? "You have to set at least +10% value to apply transaction speed up."
      : undefined;
  }, [transaction, values.gasPrice]);

  const legacyGasPriceWarning = useMemo(() => {
    return gasPrice && parseGwei(values.gasPrice) > gasPrice * BigInt(3)
      ? "Gas price is unnecessarily high for current network condition"
      : undefined;
  }, [gasPrice, values.gasPrice]);

  const maxFeePerGasWarning = useMemo(() => {
    return baseFee && parseGwei(values.maxFeePerGas) > baseFee * BigInt(3)
      ? "Max fee per gas is unnecessarily high for current network condition"
      : undefined;
  }, [baseFee, values.maxFeePerGas]);

  const maxPriorityFeePerGasError = useMemo(() => {
    return transaction?.gas.model === GasFeeModel.EIP1559 &&
      transaction.gas.maxPriorityFeePerGas &&
      parseGwei(values.maxPriorityFeePerGas) <
        add10PercentsToBigInt(transaction.gas.maxPriorityFeePerGas)
      ? "You have to set at least +10% value to apply transaction speed up."
      : undefined;
  }, [transaction, values.maxPriorityFeePerGas]);

  const maxPriorityFeePerGasWarning = useMemo(() => {
    return priorityFee && parseGwei(values.maxPriorityFeePerGas) > priorityFee * BigInt(3)
      ? "Max priority fee per gas is unnecessarily high for current network condition"
      : undefined;
  }, [priorityFee, values.maxPriorityFeePerGas]);

  return {
    maxFeePerGasError,
    maxFeePerGasWarning,
    maxPriorityFeePerGasError,
    maxPriorityFeePerGasWarning,
    legacyGasPriceError,
    legacyGasPriceWarning,
  };
}
