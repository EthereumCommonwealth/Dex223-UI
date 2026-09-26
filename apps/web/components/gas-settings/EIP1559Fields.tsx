import { useTranslations } from "next-intl";
import React, { ChangeEvent, FocusEvent, ReactNode, useMemo } from "react";
import { formatGwei } from "viem";

import { InputSize } from "@/components/atoms/Input";
import TextField from "@/components/atoms/TextField";
import ErrorsAndWarnings from "@/components/gas-settings/ErrorsAndWarnings";
import { ThemeColors } from "@/config/theme/colors";
import { formatFloat } from "@/functions/formatFloat";
import { useColorScheme } from "@/lib/color-scheme";

export default function EIP1559Fields({
  maxFeePerGas,
  maxPriorityFeePerGas,
  handleChange,
  handleBlur,
  currentMaxFeePerGas,
  setMaxFeePerGasValue,
  setMaxPriorityFeePerGasValue,
  currentMaxPriorityFeePerGas,
  maxFeePerGasError,
  maxFeePerGasWarning,
  maxPriorityFeePerGasError,
  maxPriorityFeePerGasWarning,
  helperButtonText,
}: {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  setMaxFeePerGasValue: (value: string) => void;
  setMaxPriorityFeePerGasValue: (value: string) => void;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: FocusEvent<HTMLInputElement>) => void;
  currentMaxFeePerGas: bigint | undefined;
  currentMaxPriorityFeePerGas: bigint | undefined;
  maxFeePerGasError: string | undefined;
  maxFeePerGasWarning: string | undefined;
  maxPriorityFeePerGasError: string | undefined;
  maxPriorityFeePerGasWarning: string | undefined;
  helperButtonText?: ReactNode;
}) {
  const t = useTranslations("GasSettings");
  const currentLabel = helperButtonText ?? t("current");
  const colorScheme = useColorScheme();
  const gasPriceErrors = useMemo(() => {
    const _errors: string[] = [];

    [maxPriorityFeePerGasError, maxFeePerGasError].forEach((v) => {
      if (v) {
        _errors.push(v);
      }
    });

    return _errors;
  }, [maxFeePerGasError, maxPriorityFeePerGasError]);

  const gasPriceWarnings = useMemo(() => {
    const _warnings: string[] = [];

    [maxPriorityFeePerGasWarning, maxFeePerGasWarning].forEach((v) => {
      if (v) {
        _warnings.push(v);
      }
    });

    return _warnings;
  }, [maxFeePerGasWarning, maxPriorityFeePerGasWarning]);

  return (
    <>
      <div className="grid gap-3 grid-cols-2">
        <TextField
          colorScheme={colorScheme}
          isNumeric
          isError={!!maxFeePerGasError}
          isWarning={!!maxFeePerGasWarning}
          placeholder={t("max_fee")}
          label={t("max_fee")}
          name="maxFeePerGas"
          id="maxFeePerGas"
          tooltipText={t("max_fee_tooltip")}
          value={maxFeePerGas}
          onChange={(e) => {
            handleChange(e);
          }}
          onBlur={(e) => {
            handleBlur(e);
          }}
          helperText={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (currentMaxFeePerGas) {
                    setMaxFeePerGasValue(formatGwei(currentMaxFeePerGas));
                  }

                  // setUnsavedMaxFeePerGas( || BigInt(0));
                }}
                className={
                  {
                    [ThemeColors.GREEN]: "text-green duration-200 hocus:text-green-hover",
                    [ThemeColors.PURPLE]: "text-purple duration-200 hocus:text-purple-hover",
                  }[colorScheme]
                }
              >
                {currentLabel}
              </button>{" "}
              {currentMaxFeePerGas ? formatFloat(formatGwei(currentMaxFeePerGas)) : "0"} Gwei
            </div>
          }
          inputSize={InputSize.DEFAULT}
        />

        <TextField
          colorScheme={colorScheme}
          isNumeric
          isError={!!maxPriorityFeePerGasError}
          isWarning={!!maxPriorityFeePerGasWarning}
          placeholder={t("priority_fee")}
          label={t("priority_fee")}
          name="maxPriorityFeePerGas"
          id="maxPriorityFeePerGas"
          tooltipText={t("priority_fee_tooltip")}
          value={maxPriorityFeePerGas}
          onChange={(e) => {
            handleChange(e);
          }}
          onBlur={(e) => {
            handleBlur(e);
          }}
          helperText={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (currentMaxPriorityFeePerGas) {
                    setMaxPriorityFeePerGasValue(formatGwei(currentMaxPriorityFeePerGas));
                  }
                }}
                className={
                  {
                    [ThemeColors.GREEN]: "text-green duration-200 hocus:text-green-hover",
                    [ThemeColors.PURPLE]: "text-purple duration-200 hocus:text-purple-hover",
                  }[colorScheme]
                }
              >
                {currentLabel}
              </button>{" "}
              {currentMaxPriorityFeePerGas
                ? formatFloat(formatGwei(currentMaxPriorityFeePerGas))
                : "0"}{" "}
              Gwei
            </div>
          }
          inputSize={InputSize.DEFAULT}
        />
      </div>

      <ErrorsAndWarnings errors={gasPriceErrors} warnings={gasPriceWarnings} />
    </>
  );
}
