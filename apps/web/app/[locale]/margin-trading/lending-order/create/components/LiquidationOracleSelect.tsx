import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { Address } from "viem";

import { InputSize } from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import { InputLabel } from "@/components/atoms/TextField";
import RadioButton from "@/components/buttons/RadioButton";
import { ZERO_ADDRESS } from "@/hooks/useCollectFees";

type LiquidationOracle = "dex223";

const labelsMap: Record<LiquidationOracle, string> = {
  dex223: "Default Dex223 Price relay",
  // uniswap: "Uniswap market",
  // link: "LINK price oracle",
};

const linksMap: Record<LiquidationOracle, string> = {
  dex223: "#",
  // uniswap: "#",
  // link: "#",
};

const oracleValuesMap: Record<LiquidationOracle, Address> = {
  dex223: ZERO_ADDRESS,
};

const oracles: LiquidationOracle[] = ["dex223"];

export default function LiquidationOracleSelect() {
  const t = useTranslations("Margin");
  const [oracle, setOracle] = useState<LiquidationOracle>("dex223");
  return (
    <div className="mb-[34px]">
      <InputLabel inputSize={InputSize.LARGE} label={t("liquidation_price_source")} />
      <div className="grid gap-2 mb-4 mt-1">
        {oracles.map((_oracle) => (
          <RadioButton
            type="button"
            key={_oracle}
            className="min-h-10 py-0 items-center bg-tertiary-bg"
            isActive={_oracle === oracle}
            onClick={() => setOracle(_oracle)}
          >
            <span className="items-center flex flex-grow justify-between">
              {_oracle === "dex223" ? t("dex223_price_relay") : labelsMap[_oracle]}
              <a
                className="text-tertiary-text hover:text-green-hover duration-200"
                href={linksMap[_oracle]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Svg iconName="forward" />
              </a>
            </span>
          </RadioButton>
        ))}
      </div>
    </div>
  );
}
