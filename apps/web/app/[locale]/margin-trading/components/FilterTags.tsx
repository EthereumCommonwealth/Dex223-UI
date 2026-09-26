import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  defaultBorrowMarketFilterValues,
  useBorrowMarketFilterStore,
} from "@/app/[locale]/margin-trading/stores/useBorrowMarketFilterStore";
import Svg from "@/components/atoms/Svg";

export default function FilterTags() {
  const t = useTranslations("Margin");
  const {
    leverage,
    setLeverage,
    orderCurrencyLimit,
    setOrderCurrencyLimit,
    minLoanAmount,
    setMinLoanAmount,
    setMinPositionDuration,
    minPositionDuration,
    setMaxPositionDuration,
    maxPositionDuration,
    minOrderBalance,
    setMinOrderBalance,
    maxInterestRatePerMonth,
    setMaxInterestRatePerMonth,
    setLiquidationPriceSource,
    liquidationPriceSource,
  } = useBorrowMarketFilterStore();

  const filters = useMemo(() => {
    const filtersArray = [
      {
        key: "minOrderBalance",
        value: minOrderBalance,
        defaultValue: defaultBorrowMarketFilterValues.minOrderBalance,
        onReset: () => setMinOrderBalance(defaultBorrowMarketFilterValues.minOrderBalance),
        label: t("min_order_balance"),
      },
      {
        key: "minLoanAmount",
        value: minLoanAmount,
        defaultValue: defaultBorrowMarketFilterValues.minLoanAmount,
        onReset: () => setMinLoanAmount(defaultBorrowMarketFilterValues.minLoanAmount),
        label: t("min_loan_amount"),
      },
      {
        key: "leverage",
        value: leverage,
        formattedValue: `${leverage}x`,
        defaultValue: defaultBorrowMarketFilterValues.leverage,
        onReset: () => setLeverage(defaultBorrowMarketFilterValues.leverage),
        label: t("max_leverage"),
      },
      {
        key: "maxInterestRatePerMonth",
        value: maxInterestRatePerMonth,
        formattedValue: `${maxInterestRatePerMonth}%`,
        defaultValue: defaultBorrowMarketFilterValues.maxInterestRatePerMonth,
        onReset: () =>
          setMaxInterestRatePerMonth(defaultBorrowMarketFilterValues.maxInterestRatePerMonth),
        label: t("max_interest_per_month"),
      },
      {
        key: "orderCurrencyLimit",
        value: orderCurrencyLimit,
        defaultValue: defaultBorrowMarketFilterValues.orderCurrencyLimit,
        onReset: () => setOrderCurrencyLimit(defaultBorrowMarketFilterValues.orderCurrencyLimit),
        label: t("order_currency_limit"),
      },

      // …add more filters here as needed
    ];

    if (
      !!maxPositionDuration &&
      !minPositionDuration &&
      maxPositionDuration !== defaultBorrowMarketFilterValues.maxPositionDuration
    ) {
      filtersArray.push({
        key: "maxPositionDuration",
        value: maxPositionDuration,
        formattedValue: t("duration_days", { count: maxPositionDuration }),
        defaultValue: defaultBorrowMarketFilterValues.maxPositionDuration,
        onReset: () => setMaxPositionDuration(defaultBorrowMarketFilterValues.maxPositionDuration),
        label: t("max_position_duration"),
      });
    }

    if (
      !maxPositionDuration &&
      !!minPositionDuration &&
      minPositionDuration !== defaultBorrowMarketFilterValues.minPositionDuration
    ) {
      filtersArray.push({
        key: "minPositionDuration",
        value: minPositionDuration,
        formattedValue: t("duration_days", { count: minPositionDuration }),
        defaultValue: defaultBorrowMarketFilterValues.minPositionDuration,
        onReset: () => setMinPositionDuration(defaultBorrowMarketFilterValues.minPositionDuration),
        label: t("min_position_duration"),
      });
    }

    if (
      !!maxPositionDuration &&
      !!minPositionDuration &&
      minPositionDuration !== defaultBorrowMarketFilterValues.minPositionDuration &&
      maxPositionDuration !== defaultBorrowMarketFilterValues.maxPositionDuration
    ) {
      filtersArray.push({
        key: "minPositionDuration",
        value: minPositionDuration + maxPositionDuration,
        formattedValue: t("duration_days_range", {
          min: minPositionDuration,
          max: maxPositionDuration,
        }),
        defaultValue:
          defaultBorrowMarketFilterValues.minPositionDuration +
          defaultBorrowMarketFilterValues.maxPositionDuration,
        onReset: () => {
          setMaxPositionDuration(defaultBorrowMarketFilterValues.maxPositionDuration);
          setMinPositionDuration(defaultBorrowMarketFilterValues.minPositionDuration);
        },
        label: t("position_duration"),
      });
    }

    return filtersArray;
  }, [
    leverage,
    maxInterestRatePerMonth,
    maxPositionDuration,
    minLoanAmount,
    minOrderBalance,
    minPositionDuration,
    orderCurrencyLimit,
    setLeverage,
    setMaxInterestRatePerMonth,
    setMaxPositionDuration,
    setMinLoanAmount,
    setMinOrderBalance,
    setMinPositionDuration,
    setOrderCurrencyLimit,
    t,
  ]);

  const isFiltersActive = useMemo(() => {
    return filters.some(({ value, defaultValue }) => value !== defaultValue);
  }, [filters]);

  return (
    <div className={clsx("flex items-center flex-wrap gap-3", isFiltersActive && "mb-4")}>
      {filters.map(({ key, value, defaultValue, onReset, label, formattedValue }) =>
        value !== defaultValue ? (
          <button
            key={key}
            onClick={onReset}
            className="text-tertiary-text group hocus:text-secondary-text hocus:bg-green-bg duration-200 flex items-center py-1 gap-1 pl-3 pr-2 rounded-2 bg-primary-bg"
          >
            {label}: {formattedValue || value}
            <Svg
              className="text-secondary-text duration-200 group-hocus:text-primary-text"
              iconName="close"
            />
          </button>
        ) : null,
      )}
    </div>
  );
}
