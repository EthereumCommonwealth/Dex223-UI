import React, { ChangeEvent, useEffect, useMemo } from "react";

import { InputSize } from "@/components/atoms/Input";
import TextField from "@/components/atoms/TextField";
import ErrorsAndWarnings from "@/components/gas-settings/ErrorsAndWarnings";

export default function GasLimitField({
  value,
  setFieldValue,
  onChange,
  onBlur,
  estimatedGas,
  gasLimitError,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: ChangeEvent<HTMLInputElement>) => void;
  setFieldValue: (value: string) => void;
  estimatedGas: bigint;
  gasLimitError: string | undefined;
}) {
  const gasLimitErrors = useMemo(() => {
    const _errors: string[] = [];

    [gasLimitError].forEach((v) => {
      if (v) {
        _errors.push(v);
      }
    });

    return _errors;
  }, [gasLimitError]);

  return (
    <>
      <TextField
        isNumeric
        decimalScale={0}
        placeholder="Gas limit"
        label="Gas limit"
        name="gasLimit"
        id="gasLimit"
        tooltipText="gasLimit is a measure of actions that a contract can perform in your transaction. Setting gasLimit to a low value may result in your transaction not being able to perform the necessary actions (i.e. purchase tokens) and fail. We don't recommend changing this unless you absolutely know what you're doing."
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        isError={!!gasLimitError}
        helperText={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                setFieldValue(estimatedGas ? estimatedGas.toString() : "100000");
              }}
              className="text-green"
            >
              Estimated
            </button>{" "}
            {estimatedGas ? estimatedGas?.toString() : 100000} Gwei
          </div>
        }
        inputSize={InputSize.DEFAULT}
      />
      <ErrorsAndWarnings errors={gasLimitErrors} />
    </>
  );
}
