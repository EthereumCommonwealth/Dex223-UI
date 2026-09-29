import Checkbox from "@repo/ui/checkbox";
import clsx from "clsx";
import { Formik } from "formik";
import { useTranslations } from "next-intl";
import React, { PropsWithChildren } from "react";

import { useBorrowMarketFilterStore } from "@/app/[locale]/margin-trading/stores/useBorrowMarketFilterStore";
import Drawer from "@/components/atoms/Drawer";
import Input from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import { InputLabel } from "@/components/atoms/TextField";
import Button, { ButtonColor } from "@/components/buttons/Button";
import IconButton, { IconButtonVariant } from "@/components/buttons/IconButton";

function ButtonRow({ children }: PropsWithChildren) {
  return <div className="auto-cols-fr grid gap-3 grid-flow-col">{children}</div>;
}

function ExternalIconLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="w-10 h-10 flex items-center justify-center"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Svg iconName="forward" />
    </a>
  );
}

function CheckboxExternalLink({ checked, handleChange, id, label, disabled }: any) {
  return (
    <div
      className={clsx(
        "bg-tertiary-bg rounded-2 flex justify-between pr-3 pl-2 items-center",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <Checkbox checked={checked} handleChange={handleChange} id={id} label={label} />
      <ExternalIconLink href={"#"} />
    </div>
  );
}

export default function BorrowMarketFilter({
  isDrawerOpened,
  setDrawerOpened,
}: {
  isDrawerOpened: boolean;
  setDrawerOpened: (isDrawerOpened: boolean) => void;
}) {
  const {
    leverage,
    maxPositionDuration,
    minPositionDuration,
    setMaxPositionDuration,
    setMinPositionDuration,
    minOrderBalance,
    minLoanAmount,
    setMinLoanAmount,
    setMinOrderBalance,
    orderCurrencyLimit,
    setOrderCurrencyLimit,
    maxInterestRatePerMonth,
    setMaxInterestRatePerMonth,
    liquidationPriceSource,
    setLiquidationPriceSource,
    setLeverage,
  } = useBorrowMarketFilterStore();
  const t = useTranslations("Margin");

  return (
    <Drawer isOpen={isDrawerOpened} setIsOpen={setDrawerOpened} placement="left">
      <div className="w-[432px] pr-6 pl-10 pt-4">
        <div className="flex justify-between">
          <h3 className="text-20 font-bold">{t("filter")}</h3>
          <IconButton
            variant={IconButtonVariant.CLOSE}
            handleClose={() => setDrawerOpened(false)}
          />
        </div>
        <Formik
          initialValues={{
            leverage,
            maxPositionDuration,
            minPositionDuration,
            minOrderBalance,
            minLoanAmount,
            maxInterestRatePerMonth,
            liquidationPriceSource,
            orderCurrencyLimit,
          }}
          onSubmit={(values, formikHelpers) => {
            setLeverage(values.leverage);
            setOrderCurrencyLimit(values.orderCurrencyLimit);
            setMaxInterestRatePerMonth(values.maxInterestRatePerMonth);
            setMinPositionDuration(values.minPositionDuration);
            setMaxPositionDuration(values.maxPositionDuration);

            setMinOrderBalance(values.minOrderBalance);
            setMinLoanAmount(values.minLoanAmount);

            setDrawerOpened(false);
          }}
        >
          {({ values, handleSubmit, setFieldValue }) => {
            return (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <InputLabel label={t("min_order_balance")} tooltipText={t("period_tooltip")} />
                  <Input
                    value={values.minOrderBalance}
                    onChange={(e) => setFieldValue("minOrderBalance", e.target.value)}
                    placeholder={t("min_order_balance")}
                  />
                </div>
                <div className="mb-4">
                  <InputLabel label={t("min_loan_amount")} tooltipText={t("period_tooltip")} />
                  <Input
                    value={values.minLoanAmount}
                    onChange={(e) => setFieldValue("minLoanAmount", e.target.value)}
                    placeholder={t("min_loan_amount")}
                  />
                </div>
                <div className="mb-6">
                  <InputLabel label={t("max_leverage_short")} tooltipText={t("leverage_tooltip")} />
                  <Input
                    value={values.leverage}
                    onChange={(e) => setFieldValue("leverage", e.target.value)}
                    className="mb-3"
                    placeholder={t("max_leverage_short")}
                  />
                </div>
                <div className="mb-4">
                  <InputLabel label={t("duration_days_label")} tooltipText={t("period_tooltip")} />
                  <div className="grid grid-cols-[1fr_12px_1fr] gap-2">
                    <Input
                      value={values.minPositionDuration}
                      onChange={(e) => setFieldValue("minPositionDuration", e.target.value)}
                      placeholder={t("from")}
                    />
                    <div className="h-full flex items-center">—</div>
                    <Input
                      value={values.maxPositionDuration}
                      onChange={(e) => setFieldValue("maxPositionDuration", e.target.value)}
                      placeholder={t("to")}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <InputLabel
                    label={t("max_interest_per_month")}
                    tooltipText={t("interest_tooltip")}
                  />
                  <Input
                    value={values.maxInterestRatePerMonth}
                    onChange={(e) => setFieldValue("maxInterestRatePerMonth", e.target.value)}
                    placeholder={t("interest_rate")}
                  />
                </div>
                <div className="mb-4">
                  <InputLabel
                    label={t("order_currency_limit")}
                    tooltipText={t("currency_limit_tooltip")}
                  />
                  <Input
                    value={values.orderCurrencyLimit}
                    onChange={(e) => setFieldValue("orderCurrencyLimit", e.target.value)}
                    placeholder={t("order_currency_limit")}
                  />
                </div>

                <div className="mb-8">
                  <InputLabel
                    label={t("liquidation_price_source")}
                    tooltipText={t("liquidation_price_tooltip")}
                  />
                  <div className="flex flex-col gap-3">
                    <CheckboxExternalLink
                      disabled
                      checked={true}
                      handleChange={() => {}}
                      id="liqu_src_1"
                      label={t("dex223_market")}
                    />
                  </div>
                </div>
                <ButtonRow>
                  <Button colorScheme={ButtonColor.LIGHT_GREEN}>{t("cancel")}</Button>
                  <Button>{t("apply")}</Button>
                </ButtonRow>
              </form>
            );
          }}
        </Formik>
      </div>
    </Drawer>
  );
}
