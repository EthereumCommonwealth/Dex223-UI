import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import IconButton, { IconButtonVariant } from "@/components/buttons/IconButton";
import { Currency } from "@/sdk_bi/entities/currency";

import { NumericalInput } from "./NumericalInput";

interface Props {
  title: string;
  value: string;
  onUserInput: (typedValue: string) => void;
  decrement: () => void;
  increment: () => void;
  prependSymbol?: string;
  maxDecimals?: number;
  tokenA?: Currency | undefined;
  tokenB?: Currency | undefined;
  noLiquidity?: boolean;
  handleBlur: (value: string) => void;
}
export default function PriceRangeInput({
  title,
  value,
  onUserInput,
  decrement,
  increment,
  prependSymbol,
  maxDecimals,
  tokenA,
  tokenB,
  noLiquidity,
  handleBlur,
}: Props) {
  const t = useTranslations("Liquidity");

  //  for focus state, styled components doesnt let you select input parent container
  // const [active, setActive] = useState(false);

  // let user type value and only update parent value on blur
  const [localValue, setLocalValue] = useState("");
  const [useLocalValue, setUseLocalValue] = useState(false);

  // animation if parent value updates local value
  // const [pulsing, setPulsing] = useState<boolean>(false);

  const [isFocused, setIsFocused] = useState(false);

  const handleOnFocus = () => {
    setIsFocused(true);
    setUseLocalValue(true);
  };

  const handleOnBlur = useCallback(() => {
    setIsFocused(false);
    setUseLocalValue(false);
    handleBlur(localValue); // trigger update on parent value
  }, [handleBlur, localValue]);

  useEffect(() => {
    if (localValue !== value && !useLocalValue) {
      setLocalValue(value); // reset local value to match parent
    }
  }, [localValue, useLocalValue, value]);

  return (
    <div
      className={clsx(
        "bg-secondary-bg rounded-3 p-5 flex justify-between items-center border hocus:shadow hocus:shadow-green/60 duration-200",
        isFocused ? "border border-green shadow shadow-green/60" : "border-transparent",
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-12 text-secondary-text">{title}</span>
        <NumericalInput
          value={localValue}
          onUserInput={(value) => {
            setLocalValue(value);
          }}
          prependSymbol={prependSymbol}
          maxDecimals={maxDecimals}
          onFocus={handleOnFocus} // Set focus state when NumericFormat is focused
          onBlur={handleOnBlur} // Remove focus state when NumericFormat loses focus
        />
        <span className="text-12 text-tertiary-text">
          {tokenA && tokenB
            ? t("price_per", {
                symbol0: tokenB.symbol, // quote
                symbol1: tokenA.symbol, // base
              })
            : ""}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <IconButton
          variant={IconButtonVariant.CONTROL}
          iconName="add"
          onClick={increment}
          // disabled={noLiquidity}
        />
        <IconButton
          variant={IconButtonVariant.CONTROL}
          iconName="minus"
          onClick={decrement}
          // disabled={noLiquidity}
        />
      </div>
    </div>
  );
}
