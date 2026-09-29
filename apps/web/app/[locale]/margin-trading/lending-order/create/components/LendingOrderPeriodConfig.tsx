import Alert from "@repo/ui/alert";
import { useTranslations } from "next-intl";
import React from "react";

import {
  LendingOrderPeriod,
  LendingOrderPeriodErrors,
  LendingOrderPeriodType,
  PerpetualPeriodType,
} from "@/app/[locale]/margin-trading/lending-order/create/steps/types";
import DateTimePicker from "@/components/atoms/DateTimePicker";
import { InputSize } from "@/components/atoms/Input";
import TextField, { InputLabel } from "@/components/atoms/TextField";
import RadioButton from "@/components/buttons/RadioButton";
import Tab from "@/components/tabs/Tab";
import Tabs from "@/components/tabs/Tabs";

export default function LendingOrderPeriodConfig({
  values,
  setValues,
  errors,
}: {
  values: LendingOrderPeriod;
  setValues: (values: LendingOrderPeriod) => void;
  errors?: LendingOrderPeriodErrors;
}) {
  const t = useTranslations("Margin");
  return (
    <div className="bg-tertiary-bg rounded-3 py-4 px-5 mb-4">
      <InputLabel inputSize={InputSize.LARGE} label={t("period_type")} />
      <div className="grid grid-cols-2 gap-2 mb-4 mt-1">
        {[LendingOrderPeriodType.FIXED, LendingOrderPeriodType.PERPETUAL].map((_period) => (
          <RadioButton
            type="button"
            key={_period}
            isActive={_period === values.type}
            onClick={() => {
              setValues({ ...values, type: _period });
            }}
            disabled={_period === LendingOrderPeriodType.PERPETUAL}
          >
            {_period === LendingOrderPeriodType.FIXED ? t("fixed_period") : t("perpetual_period")}
          </RadioButton>
        ))}
      </div>
      {values.type === LendingOrderPeriodType.FIXED && (
        <div className="flex flex-col gap-1.5">
          <DateTimePicker
            label={t("order_deadline")}
            tooltipText={t("order_deadline_tooltip")}
            placeholder="DD.MM.YYYY hh:mm:ss aa"
            value={values.lendingOrderDeadline}
            onChange={(e) =>
              setValues({
                ...values,
                lendingOrderDeadline: e.target.value,
              })
            }
            error={errors?.lendingOrderDeadline}
          />
          <TextField
            internalText={t("days")}
            label={t("margin_positions_duration")}
            placeholder={"0"}
            tooltipText={t("position_duration_tooltip")}
            value={values.positionDuration}
            onChange={(e) =>
              setValues({
                ...values,
                positionDuration: e.target.value,
              })
            }
            error={errors?.positionDuration}
          />
        </div>
      )}
      {values.type === LendingOrderPeriodType.PERPETUAL && (
        <div className="w-full">
          <Tabs
            activeTab={values.borrowingPeriod.type}
            setActiveTab={(value: PerpetualPeriodType) =>
              setValues({
                ...values,
                borrowingPeriod: { ...values.borrowingPeriod, type: value },
              })
            }
            fullWidth
            colorScheme={"secondary"}
          >
            <Tab title={t("days")}>
              <div className="mt-4">
                <TextField
                  isNumeric
                  decimalScale={0}
                  label={t("borrowing_period")}
                  tooltipText={t("borrowing_period_tooltip")}
                  placeholder="0"
                  internalText={t("days")}
                  value={values.borrowingPeriod.borrowingPeriodInDays}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      borrowingPeriod: {
                        ...values.borrowingPeriod,
                        borrowingPeriodInDays: e.target.value,
                      },
                    })
                  }
                  error={errors?.borrowingPeriod?.borrowingPeriodInDays}
                />
              </div>
            </Tab>
            <Tab title={t("minutes")}>
              <div className="mt-4">
                <TextField
                  isNumeric
                  decimalScale={0}
                  label={t("borrowing_period")}
                  tooltipText={t("borrowing_period_tooltip")}
                  placeholder="0"
                  internalText={t("seconds")}
                  helperText={t("seconds_in_day")}
                  value={values.borrowingPeriod.borrowingPeriodInMinutes}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      borrowingPeriod: {
                        ...values.borrowingPeriod,
                        borrowingPeriodInMinutes: e.target.value,
                      },
                    })
                  }
                  error={errors?.borrowingPeriod?.borrowingPeriodInMinutes}
                />
              </div>
            </Tab>
          </Tabs>
          <div className="mt-4">
            <Alert text={t("borrower_countdown")} type="info" />
          </div>
        </div>
      )}
    </div>
  );
}
