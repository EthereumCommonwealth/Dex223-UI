import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { isAddress } from "viem";

import {
  LiquidationMode,
  LiquidationType,
} from "@/app/[locale]/margin-trading/lending-order/create/steps/types";
import Input from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import { InputLabel } from "@/components/atoms/TextField";
import Button from "@/components/buttons/Button";
import IconButton from "@/components/buttons/IconButton";
import RadioButton from "@/components/buttons/RadioButton";

export default function LiquidationInitiatorSelect({
  values,
  setValue,
}: {
  values: LiquidationMode;
  setValue: (values: LiquidationMode) => void;
}) {
  const t = useTranslations("Margin");
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="bg-tertiary-bg rounded-3 py-4 px-5 mb-6">
      <InputLabel label={t("may_initiate_liquidation")} />
      <div className="grid grid-cols-2 gap-2 mb-4 mt-1">
        {[LiquidationType.ANYONE, LiquidationType.SPECIFIED].map((_initiator) => (
          <RadioButton
            type="button"
            key={_initiator}
            isActive={_initiator === values.type}
            onClick={() => {
              setValue({ ...values, type: _initiator });
            }}
            disabled={_initiator === LiquidationType.SPECIFIED}
          >
            {_initiator === LiquidationType.ANYONE ? t("anyone") : t("specified_addresses")}
          </RadioButton>
        ))}
      </div>

      {values.type === LiquidationType.SPECIFIED && (
        <div>
          <InputLabel
            label={t("liquidation_address")}
            tooltipText={t("liquidation_address_tooltip")}
          />
          <div className="grid grid-cols-[1fr_48px] gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="0x..."
            />
            <Button
              type="button"
              className="!px-0"
              onClick={() => {
                if (isAddress(inputValue)) {
                  setValue({
                    ...values,
                    whitelistedLiquidators: [...values.whitelistedLiquidators, inputValue],
                  });
                  setInputValue("");
                }
              }}
            >
              <Svg className="flex-shrink-0text-primary-bg" iconName="add" />
            </Button>
          </div>

          {values.whitelistedLiquidators.length > 0 && (
            <div className="mt-4 flex flex-col gap-1">
              {values.whitelistedLiquidators.map((_address) => {
                return (
                  <div
                    key={_address}
                    className="py-1 text-tertiary-text bg-quaternary-bg flex justify-between items-center rounded-2 pl-5 pr-2"
                  >
                    {_address}{" "}
                    <IconButton
                      onClick={() =>
                        setValue({
                          ...values,
                          whitelistedLiquidators: values.whitelistedLiquidators.filter(
                            (a) => a !== _address,
                          ),
                        })
                      }
                      buttonSize={24}
                      iconName="close"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
