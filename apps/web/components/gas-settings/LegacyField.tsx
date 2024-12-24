import React, { ChangeEvent, useEffect, useMemo } from "react";
import { formatGwei, parseGwei } from "viem";

import { InputSize } from "@/components/atoms/Input";
import TextField from "@/components/atoms/TextField";
import ErrorsAndWarnings from "@/components/gas-settings/ErrorsAndWarnings";
import { formatFloat } from "@/functions/formatFloat";

export default function LegacyField({
  value,
  onChange,
  onBlur,
  gasPrice,
  setFieldValue,
  legacyGasPriceError,
  legacyGasPriceWarning,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: ChangeEvent<HTMLInputElement>) => void;
  gasPrice: bigint | undefined;
  setFieldValue: (value: string) => void;
  legacyGasPriceError: string | undefined;
  legacyGasPriceWarning: string | undefined;
}) {
  const legacyGasPriceErrors = useMemo(() => {
    const _errors: string[] = [];

    [legacyGasPriceError].forEach((v) => {
      if (v) {
        _errors.push(v);
      }
    });

    return _errors;
  }, [legacyGasPriceError]);

  const legacyGasPriceWarnings = useMemo(() => {
    const _warnings: string[] = [];

    [legacyGasPriceWarning].forEach((v) => {
      if (v) {
        _warnings.push(v);
      }
    });

    return _warnings;
  }, [legacyGasPriceWarning]);

  return (
    <>
      <TextField
        isNumeric
        placeholder="Gas price"
        label="Gas price"
        name="gasPrice"
        id="gasPrice"
        tooltipText="Gas price tooltip"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        helperText={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (gasPrice) {
                  setFieldValue(formatGwei(gasPrice));
                }
              }}
              className="text-green"
            >
              Current
            </button>{" "}
            {gasPrice ? formatFloat(formatGwei(gasPrice)) : "0"} Gwei
          </div>
        }
        inputSize={InputSize.DEFAULT}
      />
      <ErrorsAndWarnings errors={legacyGasPriceErrors} warnings={legacyGasPriceWarnings} />
    </>
  );
}
