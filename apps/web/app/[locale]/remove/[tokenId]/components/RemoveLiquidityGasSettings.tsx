import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import { formatEther, formatGwei } from "viem";

import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import NetworkFeeConfigDialog from "@/components/dialogs/NetworkFeeConfigDialog";
import { formatFloat } from "@/functions/formatFloat";
import { getChainSymbol } from "@/functions/getChainSymbol";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { GasOption, GasSettings } from "@/stores/factories/createGasPriceStore";

const gasOptionTitle: Record<GasOption, any> = {
  [GasOption.CHEAP]: "cheap",
  [GasOption.FAST]: "fast",
  [GasOption.CUSTOM]: "custom",
};

export const RemoveLiquidityGasSettings = ({
  gasPriceOption,
  gasPriceSettings,
  setGasPriceOption,
  setGasPriceSettings,
  estimatedGas,
  customGasLimit,
  setEstimatedGas,
  setCustomGasLimit,
  isAdvanced,
  setIsAdvanced,
  gasPrice,
}: {
  gasPriceOption: GasOption;
  gasPriceSettings: GasSettings;
  setGasPriceOption: (gasOption: GasOption) => void;
  setGasPriceSettings: (gasSettings: GasSettings) => void;
  estimatedGas: bigint;
  customGasLimit: bigint | undefined;
  setEstimatedGas: (estimatedGas: bigint) => void;
  setCustomGasLimit: (customGas: bigint | undefined) => void;
  isAdvanced: boolean;
  setIsAdvanced: (isAdvanced: boolean) => void;
  gasPrice: bigint | undefined;
}) => {
  const chainId = useCurrentChainId();
  const t = useTranslations("GasSettings");
  const isMobile = useMediaQuery({ query: "(max-width: 640px)" });

  const [isOpenedFee, setIsOpenedFee] = useState(false);
  const gasToUse = customGasLimit || estimatedGas;

  return (
    <div className="flex flex-col md:flex-row items-center px-5 pt-2 pb-4 md:pb-2 bg-tertiary-bg rounded-3 mb-2 md:mb-5">
      {/* First row container with custom 66.67% width */}
      <div className="flex w-full md:w-2/3-custom gap-2 md:gap-6 justify-between md:justify-start">
        <div className="flex flex-col">
          <div className="text-tertiary-text flex items-center gap-1 text-12 md:text-14">
            {t("gas_price")}
          </div>
          <span className="text-tertiary-text text-12 md:text-16">
            {gasPrice ? formatFloat(formatGwei(gasPrice)) : ""} GWEI
          </span>
        </div>
        <div className="flex flex-col">
          <div className="text-tertiary-text text-12 md:text-14">{t("gas_limit")}</div>
          <span className="text-tertiary-text text-12 md:text-16">{gasToUse.toString()}</span>
        </div>
        <div className="flex flex-col">
          <div className="text-tertiary-text text-12 md:text-14">{t("network_fee")}</div>
          <span className="text-12 md:text-16">{`${gasPrice ? formatFloat(formatEther(gasPrice * gasToUse)) : ""} ${getChainSymbol(chainId)}`}</span>
        </div>
      </div>

      {/* Second row container with custom 33.33% width */}
      <div className="flex w-full md:w-1/3-custom items-center gap-2 mt-2 md:mt-0">
        <span className="flex items-center justify-center font-medium md:px-2 px-4 md:text-12 text-14 h-8 md:h-6 rounded-20 text-secondary-text border border-secondary-border">
          {t(gasOptionTitle[gasPriceOption])}
        </span>
        <Button
          className="w-full md:w-auto h-8 md:h-auto rounded-20 font-medium"
          colorScheme={ButtonColor.LIGHT_GREEN}
          size={isMobile ? ButtonSize.SMALL : ButtonSize.EXTRA_SMALL}
          onClick={() => setIsOpenedFee(true)}
        >
          {t("edit")}
        </Button>
      </div>

      <NetworkFeeConfigDialog
        isAdvanced={isAdvanced}
        setIsAdvanced={setIsAdvanced}
        estimatedGas={estimatedGas}
        setEstimatedGas={setEstimatedGas}
        gasPriceSettings={gasPriceSettings}
        gasPriceOption={gasPriceOption}
        customGasLimit={customGasLimit}
        setCustomGasLimit={setCustomGasLimit}
        setGasPriceOption={setGasPriceOption}
        setGasPriceSettings={setGasPriceSettings}
        isOpen={isOpenedFee}
        setIsOpen={setIsOpenedFee}
      />
    </div>
  );
};
