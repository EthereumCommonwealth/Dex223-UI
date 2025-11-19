import React from "react";
import { formatEther, formatGwei } from "viem";

import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import { formatFloat } from "@/functions/formatFloat";
import { getChainSymbol } from "@/functions/getChainSymbol";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { GasOption } from "@/stores/factories/createGasPriceStore";

interface GasSettingsBlockProps {
  gasPrice?: bigint;
  gasLimit?: bigint;
  gasPriceOption?: GasOption;
  onEditClick?: () => void;
}

const gasOptionTitle: Record<GasOption, string> = {
  [GasOption.CHEAP]: "Cheaper",
  [GasOption.FAST]: "Faster",
  [GasOption.CUSTOM]: "Custom",
};

export default function GasSettingsBlock({
  gasPrice,
  gasLimit,
  gasPriceOption = GasOption.CHEAP,
  onEditClick,
}: GasSettingsBlockProps) {
  const chainId = useCurrentChainId();
  const networkFee = gasPrice && gasLimit ? gasPrice * gasLimit : BigInt(0);

  return (
    <div className="bg-tertiary-bg px-5 py-2 mb-5 flex justify-between items-center rounded-3 flex-col xs:flex-row">
      <div className="text-12 xs:text-14 flex items-center gap-8 justify-between xs:justify-start max-xs:w-full">
        <p className="flex flex-col text-tertiary-text">
          <span>Gas price:</span>
          <span>{gasPrice ? formatFloat(formatGwei(gasPrice)) : "—"} GWEI</span>
        </p>

        <p className="flex flex-col text-tertiary-text">
          <span>Gas limit:</span>
          <span>{gasLimit ? gasLimit.toString() : "—"}</span>
        </p>
        <p className="flex flex-col">
          <span className="text-tertiary-text">Network fee:</span>
          <span>
            {gasPrice ? formatFloat(formatEther(networkFee)) : "—"} {getChainSymbol(chainId)}
          </span>
        </p>
      </div>
      <div className="grid grid-cols-[auto_1fr] xs:flex xs:items-center gap-2 w-full xs:w-auto mt-2 xs:mt-0">
        <span className="flex items-center justify-center px-2 text-14 rounded-20 font-500 text-secondary-text border border-secondary-border max-xs:h-8">
          {gasOptionTitle[gasPriceOption]}
        </span>
        {onEditClick && (
          <Button
            type="button"
            colorScheme={ButtonColor.LIGHT_GREEN}
            size={ButtonSize.EXTRA_SMALL}
            onClick={onEditClick}
            fullWidth={false}
            className="rounded-5 border border-secondary-border"
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
