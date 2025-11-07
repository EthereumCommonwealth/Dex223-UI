import Preloader from "@repo/ui/preloader";
import { useCallback, useEffect, useState } from "react";

import { SearchInput } from "@/components/atoms/Input";
import { useDebounce } from "@/hooks/useDebounce";

import useMultisigContract from "../../hooks/useMultisigContract";
import useMultisigTransactions, {
  TransactionDisplayData,
} from "../../hooks/useMultisigTransactions";
import { TransactionInfoCard } from "../shared";

export default function Observe() {
  const [transactionId, setTransactionId] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDisplayData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const { loading, loadTransaction, refreshTransactions } = useMultisigTransactions();

  const { generateTransactionData } = useMultisigContract();

  const loadTransactionData = useCallback(
    async (txId: string) => {
      if (!txId) {
        setSelectedTransaction(null);
        return;
      }
      setIsLoading(true);
      try {
        const tx = await loadTransaction(txId);
        if (tx) {
          setSelectedTransaction(tx);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [loadTransaction],
  );

  const debouncedTransactionId = useDebounce(transactionId, 500);

  useEffect(() => {
    if (debouncedTransactionId) {
      loadTransactionData(debouncedTransactionId);
    } else {
      setSelectedTransaction(null);
    }
  }, [debouncedTransactionId, loadTransactionData]);

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  const generateApproveData = useCallback(() => {
    if (!transactionId) return "";
    return generateTransactionData("approveTx", [BigInt(transactionId)]);
  }, [transactionId, generateTransactionData]);

  const generateDeclineData = useCallback(() => {
    if (!transactionId) return "";
    return generateTransactionData("declineTx", [BigInt(transactionId)]);
  }, [transactionId, generateTransactionData]);

  return (
    <div className="bg-primary-bg rounded-3 p-6">
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
          {isLoading && (
            <div className="flex items-center justify-center min-h-[400px]">
              <Preloader size={80} />
            </div>
          )}
          {!isLoading && selectedTransaction && debouncedTransactionId && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-18 font-bold text-primary-text">Information</h3>
                <TransactionInfoCard transaction={selectedTransaction} />
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-18 font-bold text-primary-text">Data</h3>
                <div className="bg-tertiary-bg px-5 py-4 h-[150px] flex justify-between items-center rounded-3 flex-col xs:flex-row overflow-y-auto">
                  <div className="flex flex-col text-tertiary-text break-all whitespace-pre-wrap h-full">
                    {generateApproveData() || "Data will be displayed here"}
                  </div>
                </div>
              </div>
            </div>
          )}
          {!isLoading && !selectedTransaction && debouncedTransactionId && (
            <div className="flex flex-col justify-center items-center h-full min-h-[300px] bg-primary-bg rounded-5 gap-1 bg-empty-not-found-token bg-no-repeat bg-right-top max-md:bg-size-180">
              <span className="text-secondary-text">Transaction not found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
