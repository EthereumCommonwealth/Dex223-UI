import { TransactionDisplayData } from "../../hooks/useMultisigTransactions";

interface TransactionInfoCardProps {
  transaction: TransactionDisplayData;
}

export default function TransactionInfoCard({ transaction }: TransactionInfoCardProps) {
  return (
    <div className="bg-tertiary-bg rounded-3 p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-14 text-secondary-text">Type</span>
        <span className="text-14 text-primary-text font-medium">{transaction.type}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-14 text-secondary-text">Amount</span>
        <span className="text-14 text-primary-text font-medium">
          {transaction?.amount && transaction?.amount !== "Unknown"
            ? `${transaction.amount} ${transaction.symbol}`
            : "0"}{" "}
        </span>
      </div>
      <div className="flex justify-between items-start">
        <span className="text-14 text-secondary-text">To</span>
        <span className="text-12 text-primary-text font-mono text-right max-w-[200px] break-all">
          {transaction.to}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-14 text-secondary-text">Current votes</span>
        <span className="text-14 text-primary-text font-medium">
          {transaction.numberOfVotes} / {transaction.requiredVotes}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-14 text-secondary-text">Status</span>
        <span
          className={`text-12 px-3 py-1 rounded-2 font-medium ${
            transaction.status === "executed"
              ? "bg-green text-black"
              : transaction.status === "approved"
                ? "bg-blue text-white"
                : transaction.status === "declined"
                  ? "bg-red text-white"
                  : "bg-yellow text-black"
          }`}
        >
          {transaction.status.toUpperCase()}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-14 text-secondary-text">Deadline</span>
        <span className="text-14 text-primary-text font-medium">{transaction.deadline}</span>
      </div>
    </div>
  );
}
