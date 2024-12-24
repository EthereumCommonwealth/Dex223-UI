import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { NumericFormat } from "react-number-format";
import { useMediaQuery } from "react-responsive";
import { formatEther, formatUnits, parseUnits } from "viem";

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
  const t = useTranslations("Liquidity");
  const isMobile = useMediaQuery({ query: "(max-width: 640px)" });

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
        <div
          className={clsxMerge(
            "flex justify-between items-start",
            status === AddLiquidityApproveStatus.PENDING && "flex-col md:flex-row md:mb-0 pb-2",
          )}
        >
          <div className="flex gap-2 py-2 items-center flex-wrap">
            <span className="flex-wrap items-center gap-1 text-secondary-text">
              {`${standard === Standard.ERC20 ? "Approve" : "Deposit"} for ${token.symbol}`}
              <Badge
                color="green"
                text={standard}
                className="inline-block ml-2 relative -top-0.5"
              />
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {localValueBigInt !== amount &&
              !disabled &&
              ![
                AddLiquidityApproveStatus.PENDING,
                AddLiquidityApproveStatus.LOADING,
                AddLiquidityApproveStatus.SUCCESS,
              ].includes(status) && (
                <div
                  className="flex gap-2 text-secondary-text text-12 mt-2.5 md:mt-2 md:text-16 font-medium cursor-pointer hocus:text-green-hover duration-200"
                  onClick={() => {
                    updateValue(formatUnits(amount, token.decimals));
                  }}
                >
                  <span className="mt-0.5 md:mt-0">{t("set_default")}</span>
                  <Svg iconName="reset" size={isMobile ? 20 : 24} />
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
              <span className="flex gap-2 mt-2 flex-nowrap">
                <Preloader type="linear" />
                <span className="text-secondary-text text-14 text-nowrap">
                  Proceed in your wallet
                </span>
              </span>
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
            "flex justify-between px-5 py-3 -mb-1 rounded-3 mt-2 border border-transparent",
            isError
              ? "border border-red-light hocus:border-red-light hocus:shadow hocus:shadow-red-light-shadow/60"
              : " ",
            disabled ? "border-secondary-border bg-primary-bg" : "bg-secondary-bg",
          )}
        >
          <NumericFormat
            allowedDecimalSeparators={[","]}
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
          <span className="text-12 text-red-light">
            {t("must_be_at_least", {
              val: `${formatUnits(amount, token.decimals)} ${token.symbol}`,
            })}
          </span>
        ) : (
          <div className="h-6"></div>
        )}

        <div className="flex justify-between bg-tertiary-bg px-5 py-3 rounded-3 mb-4 mt-1">
          <div className="flex gap-1">
            <span className="text-16 text-secondary-text">{tSwap("network_fee")}:</span>
            <span>{`${gasPrice && estimatedGas ? formatFloat(formatEther(gasPrice * estimatedGas)) : ""} ${chainSymbol}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
