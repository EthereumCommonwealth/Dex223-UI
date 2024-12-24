import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import IconButton, { IconButtonVariant } from "@/components/buttons/IconButton";
import { Currency } from "@/sdk_hybrid/entities/currency";

import { NumericalInput } from "./NumericalInput";

interface Props {
  title: string;
  value: string;
  onUserInput: (typedValue: string) => void;
  decrement: () => string;
  increment: () => string;
  prependSymbol?: string;
  maxDecimals?: number;
  tokenA?: Currency | undefined;
  tokenB?: Currency | undefined;
  noLiquidity?: boolean;
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
}: Props) {
  const t = useTranslations("Liquidity");

  //  for focus state, styled components doesnt let you select input parent container
  // const [active, setActive] = useState(false);

  // let user type value and only update parent value on blur
  const [localValue, setLocalValue] = useState("");
  const [useLocalValue, setUseLocalValue] = useState(false);

  // animation if parent value updates local value
  // const [pulsing, setPulsing] = useState<boolean>(false);

  // const handleOnFocus = () => {
  //   setUseLocalValue(true);
  //   setActive(true);
  // };

  // const handleOnBlur = useCallback(() => {
  //   setUseLocalValue(false);
  //   setActive(false);
  //   onUserInput(localValue); // trigger update on parent value
  // }, [localValue, onUserInput]);

  // for button clicks
  const handleDecrement = useCallback(() => {
    setUseLocalValue(false);
    onUserInput(decrement());
  }, [decrement, onUserInput]);

  const handleIncrement = useCallback(() => {
    setUseLocalValue(false);
    onUserInput(increment());
  }, [increment, onUserInput]);

  useEffect(() => {
    if (localValue !== value && !useLocalValue) {
      setTimeout(() => {
        setLocalValue(value); // reset local value to match parent
        // setPulsing(true); // trigger animation
        setTimeout(function () {
          // setPulsing(false);
        }, 1800);
      }, 0);
    }
  }, [localValue, useLocalValue, value]);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={clsx(
        "bg-secondary-bg rounded-3 p-5 flex justify-between items-center border hocus:shadow hocus:shadow-green/60",
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
          onFocus={() => setIsFocused(true)} // Set focus state when NumericFormat is focused
          onBlur={() => setIsFocused(false)} // Remove focus state when NumericFormat loses focus
        />
        <span className="text-12 text-tertiary-text">
          {tokenA && tokenB
            ? t("price_per", {
                symbol0: tokenB.symbol,
                symbol1: tokenA.symbol,
              })
            : ""}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <IconButton
          variant={IconButtonVariant.CONTROL}
          iconName="add"
          onClick={handleIncrement}
          // className="rounded-2 bg-primary-bg hocus:bg-green-bg duration-200 "
          disabled={noLiquidity}
        />
        <IconButton
          variant={IconButtonVariant.CONTROL}
          iconName="minus"
          onClick={handleDecrement}
          // className="rounded-2 bg-primary-bg hocus:bg-green-bg duration-200 "
          disabled={noLiquidity}
        />
      </div>
    </div>
  );
}
