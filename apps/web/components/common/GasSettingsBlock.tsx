import React from "react";
import { formatEther, formatGwei } from "viem";

import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import { formatFloat } from "@/functions/formatFloat";

export default function GasSettingsBlock({
  handleClick,
  formattedGasPrice,
  customGasLimit = BigInt(0),
  estimatedGas = BigInt(0),
}: {
  handleClick?: () => void;
  formattedGasPrice?: bigint;
  customGasLimit?: bigint;
  estimatedGas?: bigint;
}) {
  return (
    <div className="bg-tertiary-bg px-5 py-2 mb-5 flex justify-between items-center rounded-3 flex-col xs:flex-row">
      <div className="text-12 xs:text-14 flex items-center gap-8 justify-between xs:justify-start max-xs:w-full">
        <p className="flex flex-col text-tertiary-text">
          <span>Gas price:</span>
          <span> {formatFloat(formatGwei(formattedGasPrice || BigInt(0)))} GWEI</span>
        </p>

        <p className="flex flex-col text-tertiary-text">
          <span>Gas limit:</span>
          <span>{customGasLimit ? customGasLimit.toString() : estimatedGas?.toString()}</span>
        </p>
        <p className="flex flex-col">
          <span className="text-tertiary-text">Network fee:</span>
          <span>
            {formatFloat(
              formatEther(
                (formattedGasPrice || BigInt(0)) * (customGasLimit ? customGasLimit : estimatedGas),
                "wei",
              ),
            )}{" "}
            ETH
          </span>
        </p>
      </div>
      <div className="grid grid-cols-[auto_1fr] xs:flex xs:items-center gap-2 w-full xs:w-auto mt-2 xs:mt-0">
        <span className="flex items-center justify-center px-2 text-14 rounded-20 font-500 text-secondary-text border border-secondary-border max-xs:h-8">
          Cheaper
        </span>
        <Button
          type="button"
          colorScheme={ButtonColor.LIGHT_GREEN}
          size={ButtonSize.EXTRA_SMALL}
          onClick={handleClick}
          fullWidth={false}
          className="rounded-5 border border-secondary-border"
        >
          Edit
        </Button>
      </div>
    </div>
  );
}
