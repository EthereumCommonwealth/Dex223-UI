import clsx from "clsx";
import { useMemo } from "react";

import TokenDepositCard from "@/app/[locale]/add/components/DepositAmounts/TokenDepositCard";
import {
  Field,
  useLiquidityAmountsStore,
} from "@/app/[locale]/add/stores/useAddLiquidityAmountsStore";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { CurrencyAmount } from "@/sdk_hybrid/entities/fractions/currencyAmount";

import { AddLiquidityGasSettings } from "./AddLiquidityGasSettings";

export const DepositAmounts = ({
  parsedAmounts,
  currencies,
  depositADisabled,
  depositBDisabled,
  isFormDisabled,
}: {
  parsedAmounts: { [field in Field]: CurrencyAmount<Currency> | undefined };
  currencies: {
    CURRENCY_A: Currency | undefined;
    CURRENCY_B: Currency | undefined;
  };
  depositADisabled: boolean;
  depositBDisabled: boolean;
  isFormDisabled: boolean;
}) => {
  const {
    typedValue,
    independentField,
    dependentField,
    setTypedValue,
    tokenAStandardRatio,
    tokenBStandardRatio,
    setTokenAStandardRatio,
    setTokenBStandardRatio,
  } = useLiquidityAmountsStore();

  // const gasPrice = useAddLiquidityGasPrice();

  // get formatted amounts
  const formattedAmounts = useMemo(() => {
    return {
      [independentField]: typedValue,
      [dependentField]: parsedAmounts[dependentField]?.toSignificant() ?? "",
    };
  }, [dependentField, independentField, parsedAmounts, typedValue]);

  return (
    <div className={clsx("flex flex-col gap-4 md:gap-5", isFormDisabled && "opacity-20")}>
      <TokenDepositCard
        value={parsedAmounts[Field.CURRENCY_A]}
        formattedValue={formattedAmounts[Field.CURRENCY_A]}
        onChange={(value) => setTypedValue({ field: Field.CURRENCY_A, typedValue: value })}
        currency={currencies[Field.CURRENCY_A]}
        isDisabled={isFormDisabled}
        isOutOfRange={depositADisabled}
        tokenStandardRatio={tokenAStandardRatio}
        setTokenStandardRatio={setTokenAStandardRatio}
        // gasPrice={gasPrice}
      />
      <AddLiquidityGasSettings isFormDisabled={isFormDisabled} />
      <TokenDepositCard
        value={parsedAmounts[Field.CURRENCY_B]}
        formattedValue={formattedAmounts[Field.CURRENCY_B]}
        onChange={(value) => setTypedValue({ field: Field.CURRENCY_B, typedValue: value })}
        currency={currencies[Field.CURRENCY_B]}
        isDisabled={isFormDisabled}
        isOutOfRange={depositBDisabled}
        tokenStandardRatio={tokenBStandardRatio}
        setTokenStandardRatio={setTokenBStandardRatio}
        // gasPrice={gasPrice}
      />
    </div>
  );
};
