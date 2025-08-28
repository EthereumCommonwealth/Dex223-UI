import React, { useState } from "react";
import { Address } from "viem";

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
  const [oracle, setOracle] = useState<LiquidationOracle>("dex223");
  return (
    <div className="mb-[34px]">
      <InputLabel label="Liquidation price source" />
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
              {labelsMap[_oracle]}
              <a
                className="text-tertiary-text hover:text-green-hover duration-200"
                href={linksMap[_oracle]}
                target="_blank"
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
