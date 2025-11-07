import Skeleton from "@repo/ui/skeleton";
import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { NumericFormat } from "react-number-format";

import { ExchangeToken } from "@/app/[locale]/buy-crypto/types";
import SelectButton from "@/components/atoms/SelectButton";
import { formatFloat } from "@/functions/formatFloat";

function ceilWithDynamicPrecision(minAmount: number): number {
  if (minAmount < 0.001) {
    const exponential = minAmount.toExponential();
    const decimalPlaces = parseInt(exponential.split("e-")[1], 10) + 1;
    const factor = Math.pow(10, decimalPlaces);
    return Math.ceil(minAmount * factor) / factor;
  } else {
    return Math.ceil(minAmount * 1000) / 1000;
  }
}

export default function ExchangeTokenInput({
  handleClick,
  token,
  value,
  onInputChange,
  label,
  readOnly = false,
  minAmount,
  maxAmount,
  minAmountLoading = false,
  isLoadingAmount = false,
}: {
  handleClick: () => void;
  token: ExchangeToken | undefined;
  value: string;
  onInputChange: (value: string) => void;
  label: string;
  minAmount?: string;
  maxAmount?: string;
  minAmountLoading?: boolean;
  readOnly?: boolean;
  isLoadingAmount?: boolean;
}) {
  const t = useTranslations("Swap");

  return (
    <div className="p-3 md:p-5 bg-secondary-bg rounded-3 relative">
      <div className="flex justify-between items-center mb-3 md:mb-5 min-h-[22px]">
        <span className="text-12 md:text-14 block text-secondary-text">{label}</span>
        {((minAmount && +value < +minAmount) || (maxAmount && +value > +maxAmount)) && (
          <>
            {minAmount && +value < +minAmount && !minAmountLoading && (
              <div className="flex items-center gap-1 text-10 md:text-12">
                <button
                  className="text-green hover:text-green-hover duration-200 whitespace-nowrap"
                  onClick={() => onInputChange(minAmount)}
                >
                  Min amount
                </button>
                <span className="text-tertiary-text truncate">
                  {ceilWithDynamicPrecision(+minAmount)} {token?.symbol.toUpperCase()}
                </span>
              </div>
            )}
            {maxAmount && +value > +maxAmount && !minAmountLoading && (
              <div className="flex items-center gap-1 text-10 md:text-12">
                <button
                  className="text-green hover:text-green-hover duration-200 whitespace-nowrap"
                  onClick={() => onInputChange(maxAmount)}
                >
                  Max amount
                </button>
                <span className="text-tertiary-text truncate">
                  {ceilWithDynamicPrecision(+maxAmount)} {token?.symbol.toUpperCase()}
                </span>
              </div>
            )}
            {minAmountLoading && <Skeleton className="w-[100px] md:w-[150px] h-4" />}
          </>
        )}
      </div>

      <div className="flex items-center mb-3 md:mb-5 justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isLoadingAmount ? (
            <Skeleton className="w-[80px] md:w-[120px] h-10 md:h-12" />
          ) : (
            <NumericFormat
              allowedDecimalSeparators={[","]}
              inputMode="decimal"
              placeholder="0.0"
              className={clsx(
                "h-10 md:h-12 bg-transparent outline-0 border-0 text-24 md:text-32 w-full peer placeholder:text-tertiary-text",
                readOnly && "pointer-events-none",
              )}
              type="text"
              value={value}
              onValueChange={(values) => {
                onInputChange(values.value);
              }}
              allowNegative={false}
            />
          )}
          <div
            className={clsx(
              "duration-200 rounded-3 pointer-events-none absolute w-full h-full border top-0 left-0",
              (minAmount && +value < +minAmount) || (maxAmount && +value > +maxAmount)
                ? "shadow-red/60 border-red-light shadow"
                : "border-transparent peer-hocus:shadow peer-hocus:shadow-green/60 peer-focus:shadow peer-focus:shadow-green/60 peer-focus:border-green",
            )}
          />
        </div>
        <SelectButton
          className="flex-shrink-0"
          variant="rounded"
          onClick={handleClick}
          size="large"
        >
          {token ? (
            <span className="flex gap-1.5 md:gap-2 items-center">
              <Image
                className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8"
                src={token?.image || ""}
                alt="Ethereum"
                width={32}
                height={32}
              />
              <span className="max-w-[80px] md:max-w-[150px] overflow-ellipsis overflow-hidden whitespace-nowrap text-14 md:text-16">
                {token.name}
              </span>
            </span>
          ) : (
            <span className="whitespace-nowrap text-tertiary-text pl-2 text-14 md:text-16">
              {t("select_token")}
            </span>
          )}
        </SelectButton>
      </div>
    </div>
  );
}
