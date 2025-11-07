import Preloader from "@repo/ui/preloader";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatEther, formatGwei } from "viem";
import { useAccount } from "wagmi";

import { SearchInput } from "@/components/atoms/Input";
import Button, { ButtonColor, ButtonVariant } from "@/components/buttons/Button";
import TransactionSendDialog from "@/components/dialogs/MSigTransactionDialog";
import NetworkFeeConfigDialog from "@/components/dialogs/NetworkFeeConfigDialog";
import { useConnectWalletDialogStateStore } from "@/components/dialogs/stores/useConnectWalletStore";
import { formatFloat } from "@/functions/formatFloat";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useDebounce } from "@/hooks/useDebounce";
import { useGlobalFees } from "@/shared/hooks/useGlobalFees";
import { GasOption } from "@/stores/factories/createGasPriceStore";
import { GasFeeModel } from "@/stores/useRecentTransactionsStore";
import { useTransactionSendDialogStore } from "@/stores/useTransactionSendDialogStore";

import useMultisigContract from "../../hooks/useMultisigContract";
import useMultisigTransactions, {
  TransactionDisplayData,
} from "../../hooks/useMultisigTransactions";
import { GasFeeBlock, TransactionInfoCard } from "../shared";
import {
  useMultisigGasLimitStore,
  useMultisigGasModeStore,
  useMultisigGasPriceStore,
} from "../stores/useMultisigGasSettingsStore";

export default function VoteExisting() {
  const [transactionId, setTransactionId] = useState("");
  const { isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<TransactionDisplayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpenedFee, setIsOpenedFee] = useState(false);

  const chainId = useCurrentChainId();

  const { setIsOpened: setWalletConnectOpened } = useConnectWalletDialogStateStore();
  const {
    isOpen: isTransactionDialogOpen,
    status: transactionStatus,
    transactionId: dialogTransactionId,
    transactionHash,
    explorerUrl,
    closeDialog,
    errorMessage,
  } = useTransactionSendDialogStore();

  const { approveTransaction, declineTransaction, executeTransaction, generateTransactionData } =
    useMultisigContract();

  const { loadTransaction } = useMultisigTransactions();

  const {
    gasPriceOption,
    gasPriceSettings,
    setGasPriceOption,
    setGasPriceSettings,
    updateDefaultState,
  } = useMultisigGasPriceStore();
  const { estimatedGas, customGasLimit, setEstimatedGas, setCustomGasLimit } =
    useMultisigGasLimitStore();
  const { isAdvanced, setIsAdvanced } = useMultisigGasModeStore();
  const { baseFee, priorityFee, gasPrice } = useGlobalFees();

  useEffect(() => {
    updateDefaultState(chainId);
  }, [chainId, updateDefaultState]);

  const computedGasSpending = useMemo(() => {
    if (gasPriceSettings.model === GasFeeModel.LEGACY && gasPriceSettings.gasPrice) {
      return formatFloat(formatGwei(gasPriceSettings.gasPrice));
    }

    if (gasPriceSettings.model === GasFeeModel.LEGACY && gasPrice) {
      return formatFloat(formatGwei(gasPrice));
    }

    if (
      gasPriceSettings.model === GasFeeModel.EIP1559 &&
      gasPriceSettings.maxFeePerGas &&
      gasPriceSettings.maxPriorityFeePerGas &&
      baseFee &&
      gasPriceOption === GasOption.CUSTOM
    ) {
      const lowerFeePerGas =
        gasPriceSettings.maxFeePerGas > baseFee ? baseFee : gasPriceSettings.maxFeePerGas;

      return formatFloat(formatGwei(lowerFeePerGas + gasPriceSettings.maxPriorityFeePerGas));
    }

    if (
      gasPriceSettings.model === GasFeeModel.EIP1559 &&
      baseFee &&
      priorityFee &&
      gasPriceOption !== GasOption.CUSTOM
    ) {
      return formatFloat(formatGwei(baseFee + priorityFee));
    }

    return undefined;
  }, [baseFee, gasPrice, gasPriceOption, gasPriceSettings, priorityFee]);

  const computedGasSpendingETH = useMemo(() => {
    if (gasPriceSettings.model === GasFeeModel.LEGACY && gasPriceSettings.gasPrice) {
      return formatFloat(formatEther(gasPriceSettings.gasPrice * estimatedGas));
    }

    if (
      gasPriceSettings.model === GasFeeModel.EIP1559 &&
      gasPriceSettings.maxFeePerGas &&
      gasPriceSettings.maxPriorityFeePerGas &&
      baseFee &&
      gasPriceOption === GasOption.CUSTOM
    ) {
      const lowerFeePerGas =
        gasPriceSettings.maxFeePerGas > baseFee ? baseFee : gasPriceSettings.maxFeePerGas;

      return formatFloat(
        formatEther((lowerFeePerGas + gasPriceSettings.maxPriorityFeePerGas) * estimatedGas),
      );
    }

    if (
      gasPriceSettings.model === GasFeeModel.EIP1559 &&
      baseFee &&
      priorityFee &&
      gasPriceOption !== GasOption.CUSTOM
    ) {
      return formatFloat(formatEther((baseFee + priorityFee) * estimatedGas));
    }

    return undefined;
  }, [baseFee, estimatedGas, gasPriceOption, gasPriceSettings, priorityFee]);

  const loadTransactionData = useCallback(
    async (txId: string) => {
      if (!txId) {
        setCurrentTransaction(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const tx = await loadTransaction(txId);
        if (tx) {
          setCurrentTransaction(tx);
        } else {
          setError("Transaction not found");
          setCurrentTransaction(null);
        }
      } catch (err) {
        console.error(err);
        setCurrentTransaction(null);
      } finally {
        setLoading(false);
      }
    },
    [loadTransaction],
  );

  const handleApproveTransaction = useCallback(async () => {
    if (!transactionId || !currentTransaction) return;

    try {
      await approveTransaction(BigInt(transactionId));
      await loadTransactionData(transactionId);
    } catch (error) {
      console.error(error);
    }
  }, [transactionId, currentTransaction, approveTransaction, loadTransactionData]);

  const handleRejectTransaction = useCallback(async () => {
    if (!transactionId || !currentTransaction) return;

    try {
      await declineTransaction(BigInt(transactionId));
      await loadTransactionData(transactionId);
    } catch (error) {
      console.error(error);
    }
  }, [transactionId, currentTransaction, declineTransaction, loadTransactionData]);

  const handleExecuteTransaction = useCallback(async () => {
    if (!transactionId || !currentTransaction) return;
    try {
      await executeTransaction(BigInt(transactionId));
      await loadTransactionData(transactionId);
    } catch (error) {
      console.error(error);
    }
  }, [transactionId, currentTransaction, executeTransaction, loadTransactionData]);

  const generateApproveData = useCallback(() => {
    if (!transactionId) return "";
    return generateTransactionData("approveTx", [BigInt(transactionId)]);
  }, [transactionId, generateTransactionData]);

  const debouncedTransactionId = useDebounce(transactionId, 500);

  useEffect(() => {
    if (debouncedTransactionId) {
      loadTransactionData(debouncedTransactionId);
    } else {
      setCurrentTransaction(null);
      setError(null);
    }
  }, [debouncedTransactionId, loadTransactionData]);

  useEffect(() => {
    if (
      transactionStatus === "success" ||
      (transactionStatus === "failed" && isTransactionDialogOpen)
    ) {
      setTransactionId("");
      setCurrentTransaction(null);
      setError(null);
    }
  }, [transactionStatus, isTransactionDialogOpen]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-18 font-bold text-primary-text">Transaction ID</h3>
        <div className="relative">
          <SearchInput
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter ID"
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <Preloader size={80} />
          </div>
        )}
        {!loading && currentTransaction && debouncedTransactionId && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-18 font-bold text-primary-text">Transaction Information</h3>
              <TransactionInfoCard transaction={currentTransaction} />
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-18 font-bold text-primary-text">Data</h3>
              <div className="bg-tertiary-bg px-5 py-4 h-[150px] flex justify-between items-center rounded-3 flex-col xs:flex-row overflow-y-auto">
                <div className="flex flex-col text-tertiary-text break-all whitespace-pre-wrap h-full">
                  {generateApproveData() || "Data will be displayed here"}
                </div>
              </div>
            </div>
            {currentTransaction.status !== "approved" && (
              <GasFeeBlock
                computedGasSpending={computedGasSpending}
                computedGasSpendingETH={computedGasSpendingETH}
                gasPriceOption={gasPriceOption}
                onEditClick={() => setIsOpenedFee(true)}
              />
            )}

            {!isConnected ? (
              <Button
                variant={ButtonVariant.CONTAINED}
                fullWidth
                onClick={() => {
                  setWalletConnectOpened(true);
                }}
              >
                Connect wallet
              </Button>
            ) : (
              currentTransaction.status !== "approved" && (
                <div className="flex gap-3">
                  <Button colorScheme={ButtonColor.RED} fullWidth onClick={handleRejectTransaction}>
                    REJECT TRANSACTION
                  </Button>
                  <Button
                    variant={ButtonVariant.CONTAINED}
                    fullWidth
                    onClick={handleApproveTransaction}
                  >
                    APPROVE TRANSACTION
                  </Button>
                </div>
              )
            )}
          </div>
        )}
        {!loading && !currentTransaction && debouncedTransactionId && (
          <div className="flex flex-col justify-center items-center h-full min-h-[300px] bg-primary-bg rounded-5 gap-1 bg-empty-not-found-token bg-no-repeat bg-right-top max-md:bg-size-180">
            <span className="text-secondary-text">Transaction not found</span>
          </div>
        )}
      </div>

      <TransactionSendDialog
        isOpen={isTransactionDialogOpen}
        setIsOpen={closeDialog}
        status={transactionStatus}
        transactionId={dialogTransactionId}
        transactionHash={transactionHash}
        explorerUrl={explorerUrl}
        errorMessage={errorMessage}
      />

      <NetworkFeeConfigDialog
        isAdvanced={isAdvanced}
        setIsAdvanced={setIsAdvanced}
        estimatedGas={estimatedGas}
        setEstimatedGas={setEstimatedGas}
        gasPriceSettings={gasPriceSettings}
        gasPriceOption={gasPriceOption}
        customGasLimit={customGasLimit}
        setCustomGasLimit={setCustomGasLimit}
        setGasPriceOption={setGasPriceOption}
        setGasPriceSettings={setGasPriceSettings}
        isOpen={isOpenedFee}
        setIsOpen={setIsOpenedFee}
      />
    </div>
  );
}
