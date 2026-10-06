import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import React from "react";
import { formatEther, formatUnits } from "viem";

import {
  InactiveMarginPositionCard,
  LendingPositionCard,
} from "@/app/[locale]/margin-trading/components/MarginPositionCard";
import { InfoBlockWithBorder } from "@/app/[locale]/margin-trading/components/widgets/OrderInfoBlock";
import calculateTotalOrderBalance from "@/app/[locale]/margin-trading/lending-order/[id]/helpers/calculateTotalOrderBalance";
import { LendingOrder } from "@/app/[locale]/margin-trading/types";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor } from "@/components/buttons/Button";
import { formatFloat } from "@/functions/formatFloat";
import { Link } from "@/i18n/routing";

function LendingOrderInfoCard({
  label,
  value,
  tooltipText,
}: {
  label: string;
  value: string;
  tooltipText: string;
}) {
  return (
    <div className="flex flex-col justify-center px-5 bg-tertiary-bg rounded-3 py-2.5">
      <div className="flex items-center gap-1">
        <span className="text-14 flex items-center gap-1 text-tertiary-text">
          {label}
          <Tooltip text={tooltipText} />
        </span>
      </div>
      <div className="text-16 font-medium text-secondary-text whitespace-nowrap">{value}</div>
    </div>
  );
}

function LiquidationInfo({
  label,
  tooltipText,
  feeForLiquidator,
  feeForLender,
  symbol,
}: {
  label: string;
  tooltipText: string;
  feeForLiquidator: string;
  feeForLender: string;
  symbol: string;
}) {
  return (
    <div className="border-l-4 border-tertiary-bg rounded-1 pl-4 min-w-[185px]">
      <div className="flex items-center gap-2 whitespace-nowrap">
        {label} <Tooltip text={tooltipText} />
      </div>
      <p className="relative -top-1 flex gap-1 whitespace-nowrap items-center font-medium">
        <span className="text-secondary-text">{feeForLiquidator}</span>
        <span className="">{symbol}</span>
      </p>
    </div>
  );
}

export default function LendingOrderCard({
  order,
  setOrderToDeposit,
  setOrderToWithdraw,
  setOrderToClose,
  setOrderToOpen,
}: {
  order: LendingOrder;
  setOrderToDeposit: (order: LendingOrder) => void;
  setOrderToWithdraw: (order: LendingOrder) => void;
  setOrderToClose: (order: LendingOrder) => void;
  setOrderToOpen: (order: LendingOrder) => void;
}) {
  const t = useTranslations("Margin");

  return (
    <>
      <div className="border-4 border-green-bg rounded-5 pt-3 px-5 pb-5 bg-primary-bg">
        <div className="flex justify-between mb-3 min-h-10 items-center">
          <Link
            className="flex items-center gap-2"
            href={`/margin-trading/lending-order/${order.id}`}
          >
            {t("view_lending_order_details")}
            <Svg iconName="next" />
          </Link>
          {order.alive ? (
            <span className="text-green flex items-center gap-3 ">
              <div className="min-w-[115px] text-green flex items-center gap-2 justify-end">
                {t("status_active")}
                <span className="block w-2 h-2 rounded-2 bg-green" />
              </div>
            </span>
          ) : (
            <span className="text-tertiary-text flex items-center gap-3 ">
              <div className="min-w-[115px] flex items-center gap-2 justify-end">
                {t("status_closed")}
                <Svg iconName="closed" />
              </div>
            </span>
          )}
        </div>
        <div className="grid grid-cols-[5fr_5fr] gap-3">
          <div className="grid grid-cols-[auto_min-content] gap-3">
            <div
              className={clsx(
                "z-10 relative  before:w-[calc(100%_+_2px)] before:h-[calc(100%_+_2px)] before:-top-px before:-left-px before:rounded-3 before:absolute",
                "before:bg-gradient-card-green-dark-border",
              )}
            >
              <div
                style={{
                  backgroundImage:
                    "url('/images/lending-balance-bg.svg'), linear-gradient(90deg, #1F2020 0%, #3C4B4A 100%)",
                }}
                className="p-5 rounded-3 bg-right-top bg-no-repeat relative"
              >
                <p className="text-20 font-medium">{t("balance")}</p>
                <span className="text-14 flex items-center gap-1 text-secondary-text">
                  {t("available_total")}
                  <Tooltip text={t("available_total_tooltip")} />
                </span>
                <p className="text-20">
                  {formatFloat(formatUnits(order.balance, order.baseAsset.decimals))} /{" "}
                  {formatFloat(
                    formatUnits(calculateTotalOrderBalance(order), order.baseAsset.decimals),
                  )}{" "}
                  <span className="text-secondary-text">{order.baseAsset.symbol}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <LendingOrderInfoCard
                label={t("deadline")}
                tooltipText={t("order_deadline_tooltip")}
                value={`${new Date(order.deadline * 1000)
                  .toLocaleDateString("en-GB")
                  .split("/")
                  .join(".")} ${new Date(order.deadline * 1000).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}`}
              />

              <InfoBlockWithBorder
                value={`${order.liquidationRewardAmount.formatted} / ${0} ${order.liquidationRewardAsset.symbol}`}
                title={t("fee_liquidator_lender")}
                tooltipText={t("fee_liquidator_lender_tooltip")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <LendingOrderInfoCard
                label={t("duration")}
                tooltipText={t("position_duration_tooltip")}
                value={t("duration_days", { count: order.positionDuration / 24 / 60 / 60 })}
              />
              <LendingOrderInfoCard
                label={t("max_leverage")}
                tooltipText={t("leverage_order_tooltip")}
                value={`${order.leverage}x`}
              />
              <LendingOrderInfoCard
                label={t("interest_rate")}
                tooltipText={t("interest_rate_tooltip")}
                value={t("percent_per_month", { rate: order.interestRate / 100 })}
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {order.alive ? (
                <Button
                  onClick={() => setOrderToClose(order)}
                  colorScheme={ButtonColor.LIGHT_GREEN}
                >
                  {t("close")}
                </Button>
              ) : (
                <Button onClick={() => setOrderToOpen(order)} colorScheme={ButtonColor.LIGHT_GREEN}>
                  {t("open")}
                </Button>
              )}

              <Button
                onClick={() => setOrderToDeposit(order)}
                colorScheme={ButtonColor.LIGHT_GREEN}
              >
                {t("deposit")}
              </Button>
              <Button
                onClick={() => setOrderToWithdraw(order)}
                colorScheme={ButtonColor.LIGHT_GREEN}
              >
                {t("withdraw")}
              </Button>
              <Link
                className="w-full block"
                href={`/margin-trading/lending-order/${order.id}/edit`}
              >
                <Button fullWidth colorScheme={ButtonColor.LIGHT_GREEN}>
                  {t("edit")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-5 grid-cols-[80px_1fr]">
        {!!order.positions?.length &&
          order.positions.map((position, index) => (
            <React.Fragment key={position.id}>
              <div
                className={clsx(
                  "relative -top-[68px]",
                  index !== order.positions!.length - 1 &&
                    "before:w-1 before:absolute before:bg-green-bg before:left-0 before:h-full before:top-[68px]",
                )}
              >
                <svg
                  width="80"
                  height="112"
                  viewBox="0 0 80 112"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M80 100L60 88.453V111.547L80 100ZM0 0V92H4V0H0ZM10 102H62V98H10V102ZM0 92C0 97.5229 4.47715 102 10 102V98C6.68629 98 4 95.3137 4 92H0Z"
                    fill="#3C4C4A"
                  />
                </svg>
              </div>
              {position.isLiquidated || position.isClosed ? (
                <InactiveMarginPositionCard key={position.id} position={{ ...position, order }} />
              ) : (
                <LendingPositionCard position={{ ...position, order }} />
              )}
            </React.Fragment>
          ))}
      </div>
    </>
  );
}
