import Tooltip from "@repo/ui/tooltip";
import { useMediaQuery } from "react-responsive";

import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import { networks } from "@/config/networks";
import { formatFloat } from "@/functions/formatFloat";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useNativeCurrency } from "@/hooks/useNativeCurrency";
import { useUSDPrice } from "@/hooks/useUSDPrice";
import { wrappedTokens } from "@/sdk_bi/entities/weth9";
import { GasOption } from "@/stores/factories/createGasPriceStore";

interface GasFeeBlockProps {
  computedGasSpending?: string;
  computedGasSpendingETH?: string;
  gasPriceOption: GasOption;
  onEditClick: () => void;
}

const gasOptionTitle: Record<GasOption, string> = {
  [GasOption.CHEAP]: "cheap",
  [GasOption.FAST]: "fast",
  [GasOption.CUSTOM]: "custom",
};

export default function GasFeeBlock({
  computedGasSpending,
  computedGasSpendingETH,
  gasPriceOption,
  onEditClick,
}: GasFeeBlockProps) {
  const chainId = useCurrentChainId();
  const nativeCurrency = useNativeCurrency();
  const { price } = useUSDPrice(wrappedTokens[chainId]?.address0);
  const _isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  return (
    <div className="border-t border-secondary-border">
      <div
        className="rounded-3 py-3.5 flex justify-between duration-200 px-5 bg-tertiary-bg my-5 md:items-center flex-wrap"
        role="button"
      >
        {computedGasSpending ? (
          <>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1">
                <Tooltip
                  iconSize={_isMobile ? 16 : 24}
                  text={`Network fee for ${networks.find((n) => n.chainId === chainId)?.name}`}
                />
                <div className="text-secondary-text text-12 md:text-14 flex items-center ">
                  Network fee
                </div>
                <span className="mr-1 text-12 md:hidden">
                  {price && computedGasSpendingETH
                    ? `$${formatFloat(+computedGasSpendingETH * price)}`
                    : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 max-sm:hidden">
                <span className="text-secondary-text text-12 md:text-14 ">
                  {computedGasSpendingETH} {nativeCurrency.symbol}
                </span>
                <span className="block h-4 w-px bg-primary-border" />
                <span className="text-tertiary-text mr-1 text-12 md:text-14 ">
                  {computedGasSpending} GWEI
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-between md:justify-end">
              <span className="mr-1 text-14 max-md:hidden">
                {price && computedGasSpendingETH
                  ? `$${formatFloat(+computedGasSpendingETH * price)}`
                  : ""}
              </span>
              <span className="flex items-center justify-center px-2 text-12 md:text-14 h-5 rounded-20 font-500 text-tertiary-text border border-secondary-border">
                {gasOptionTitle[gasPriceOption]}
              </span>
              <Button
                type="button"
                size={ButtonSize.EXTRA_SMALL}
                colorScheme={ButtonColor.LIGHT_GREEN}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick();
                }}
              >
                Edit
              </Button>
            </div>

            <div className="flex items-center gap-2 sm:hidden w-full mt-0.5">
              <span className="text-secondary-text text-12 md:text-14 ">
                {computedGasSpendingETH} {nativeCurrency.symbol}
              </span>
              <span className="block h-4 w-px bg-primary-border" />
              <span className="text-tertiary-text mr-1 text-12 md:text-14 ">
                {computedGasSpending} GWEI
              </span>
            </div>
          </>
        ) : (
          <span className="text-secondary-text text-14 flex items-center min-h-[26px]">
            Fetching gas price...
          </span>
        )}
      </div>
    </div>
  );
}
