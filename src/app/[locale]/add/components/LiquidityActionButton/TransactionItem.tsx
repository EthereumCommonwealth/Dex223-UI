import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { NumericFormat } from "react-number-format";
import { formatEther, formatGwei, formatUnits, parseUnits } from "viem";

import Preloader from "@/components/atoms/Preloader";
import Svg from "@/components/atoms/Svg";
import Badge from "@/components/badges/Badge";
import IconButton from "@/components/buttons/IconButton";
import { clsxMerge } from "@/functions/clsxMerge";
import { formatFloat } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { Standard } from "@/sdk_hybrid/standard";

import { ApproveTransaction } from "../../hooks/useLiquidityApprove";
import { AddLiquidityApproveStatus } from "../../stores/useAddLiquidityStatusStore";

export const TransactionItem = ({
  transaction,
  standard,
  gasPrice,
  chainSymbol,
  index,
  itemsCount,
  isError,
  setFieldError,
  setCustomAmount,
  disabled = false,
}: {
  transaction?: ApproveTransaction;
  gasPrice: any;
  chainSymbol: string;
  standard: Standard;
  index: number;
  itemsCount: number;
  isError: boolean;
  setFieldError: (isError: boolean) => void;
  setCustomAmount: (amount: bigint) => void;
  disabled?: boolean;
}) => {
  const tSwap = useTranslations("Swap");
  const chainId = useCurrentChainId();
  const [localValue, setLocalValue] = useState(
    formatUnits(transaction?.amount || BigInt(0), transaction?.token.decimals || 18),
  );
  const localValueBigInt = useMemo(() => {
    if (!transaction) return BigInt(0);
    return parseUnits(localValue, transaction.token.decimals);
  }, [localValue, transaction]);

  const updateValue = (value: string) => {
    if (!transaction?.token) return;
    setLocalValue(value);
    const valueBigInt = parseUnits(value, transaction.token.decimals);
    setCustomAmount(valueBigInt);

    if (transaction.amount) {
      setFieldError(valueBigInt < transaction.amount);
    }
  };
  if (!transaction) return null;

  const { token, amount, estimatedGas, isAllowed, status, hash } = transaction;

  return (
    <div className="flex gap-2">
      <div className="flex flex-col items-center">
        <div className="flex justify-center items-center rounded-full min-h-10 min-w-10 w-10 h-10 bg-green-bg">
          {index + 1}
        </div>
        {index + 1 < itemsCount ? (
          <div className="w-[2px] bg-green-bg h-full my-2 rounded-3"></div>
        ) : null}
      </div>
      <div className="w-full">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 py-2 items-center">
            <span>{`${standard === Standard.ERC20 ? "Approve" : "Deposit"} for ${token.symbol}`}</span>
            <Badge color="green" text={standard} />
          </div>

          <div className="flex items-center gap-2 justify-end">
            {localValueBigInt !== amount &&
              ![
                AddLiquidityApproveStatus.PENDING,
                AddLiquidityApproveStatus.LOADING,
                AddLiquidityApproveStatus.SUCCESS,
              ].includes(status) && (
                <div
                  className="flex gap-2 text-green cursor-pointer"
                  onClick={() => {
                    updateValue(formatUnits(amount, token.decimals));
                  }}
                >
                  <span>Set Default</span>
                  <Svg iconName="reset" />
                </div>
              )}

            {hash && (
              <a
                target="_blank"
                href={getExplorerLink(ExplorerLinkType.TRANSACTION, hash, chainId)}
              >
                <IconButton iconName="forward" />
              </a>
            )}

            {status === AddLiquidityApproveStatus.PENDING && (
              <>
                <Preloader type="linear" />
                <span className="text-secondary-text text-14">Proceed in your wallet</span>
              </>
            )}
            {status === AddLiquidityApproveStatus.LOADING ? (
              <Preloader size={20} />
            ) : (
              (isAllowed || status === AddLiquidityApproveStatus.SUCCESS) && (
                <Svg className="text-green" iconName="done" size={20} />
              )
            )}
          </div>
        </div>
        <div
          className={clsxMerge(
            "flex justify-between px-5 py-3 rounded-3 mt-2 border border-transparent",
            isError ? "border-red" : "",
            disabled ? "border-secondary-border bg-primary-bg" : "bg-secondary-bg",
          )}
        >
          <NumericFormat
            decimalScale={token?.decimals}
            inputMode="decimal"
            placeholder="0.0"
            className={clsx("bg-transparent text-primary-text outline-0 border-0 w-full peer")}
            type="text"
            value={localValue}
            onValueChange={(values) => {
              updateValue(values.value);
            }}
            allowNegative={false}
            disabled={disabled}
          />
          <span className="text-secondary-text min-w-max">{`Amount ${token.symbol}`}</span>
        </div>
        {isError ? (
          <span className="text-12 mt-2 text-red">{`Must be at least ${formatUnits(amount, token.decimals)} ${token.symbol}`}</span>
        ) : null}

        <div className="flex justify-between bg-tertiary-bg px-5 py-3 rounded-3 mb-4 mt-6">
          <div className="flex gap-1">
            <span className="text-16 text-secondary-text">{tSwap("network_fee")}:</span>
            <span>{`${gasPrice && estimatedGas ? formatFloat(formatEther(gasPrice * estimatedGas)) : ""} ${chainSymbol}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
