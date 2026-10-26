import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import React, { ReactNode } from "react";

type MarginPositionCardBg =
  | "assets"
  | "borrowed"
  | "collateral"
  | "currency"
  | "deadline"
  | "frozen"
  | "initiate_liquidation"
  | "leverage"
  | "liquidation"
  | "liquidation_cost"
  | "liquidation_date"
  | "liquidation_fee"
  | "liquidation_price_source"
  | "ltv"
  | "margin_positions_duration"
  | "margin_trading"
  | "margin_trading_outline"
  | "margin_trading_outline_mobile"
  | "mpd"
  | "percentage"
  | "profit"
  | "reward"
  | "tokens_allowed_for_trading"
  | "closed";

export type PositionInfoCardProps = {
  title: string;
  tooltipText: string;
  value: string | ReactNode;
  bg?: MarginPositionCardBg;
};

const bgMap: Record<MarginPositionCardBg, string> = {
  assets: "bg-[url(/images/card-bg/assets.svg)]",
  borrowed: "bg-[url(/images/card-bg/borrowed.svg)]",
  collateral: "bg-[url(/images/card-bg/collateral.svg)]",
  currency: "bg-[url(/images/card-bg/currency.svg)]",
  deadline: "bg-[url(/images/card-bg/deadline.svg)]",
  frozen: "bg-[url(/images/card-bg/frozen.svg)]",
  initiate_liquidation: "bg-[url(/images/card-bg/initiate_liquidation.svg)]",
  leverage: "bg-[url(/images/card-bg/leverage.svg)]",
  liquidation: "bg-[url(/images/card-bg/liquidation.svg)]",
  liquidation_cost: "bg-[url(/images/card-bg/liquidation_cost.svg)]",
  liquidation_date: "bg-[url(/images/card-bg/liquidation_date.svg)]",
  liquidation_fee: "bg-[url(/images/card-bg/liquidation_fee.svg)]",
  liquidation_price_source: "bg-[url(/images/card-bg/liquidation_price_source.svg)]",
  ltv: "bg-[url(/images/card-bg/ltv.svg)]",
  margin_positions_duration: "bg-[url(/images/card-bg/margin_positions_duration.svg)]",
  margin_trading: "bg-[url(/images/card-bg/margin_trading.svg)]",
  margin_trading_outline: "bg-[url(/images/card-bg/margin_trading_outline.svg)]",
  margin_trading_outline_mobile: "bg-[url(/images/card-bg/margin_trading_outline_mobile.svg)]",
  mpd: "bg-[url(/images/card-bg/mpd.svg)]",
  percentage: "bg-[url(/images/card-bg/percentage.svg)]",
  profit: "bg-[url(/images/card-bg/profit.svg)]",
  reward: "bg-[url(/images/card-bg/reward.svg)]",
  tokens_allowed_for_trading: "bg-[url(/images/card-bg/tokens_allowed_for_trading.svg)]",
  closed: "bg-[url(/images/card-bg/closed.svg)]",
};

export function OrderInfoCard({ title, tooltipText, value, bg }: PositionInfoCardProps) {
  return (
    <div
      className={clsx(
        "flex flex-col justify-center px-5 bg-tertiary-bg rounded-3 py-3 bg-right-top bg-no-repeat bg-[length:120px_80px]",
        bg && bgMap[bg],
      )}
    >
      <div className="flex items-center gap-1">
        <span className="flex items-center gap-1 text-tertiary-text">
          {title}
          <Tooltip text={tooltipText} />
        </span>
      </div>
      <div className="relative flex gap-1 font-medium text-20 text-secondary-text">{value}</div>
    </div>
  );
}

export function OrderInfoBlock({
  title,
  cards,
}: {
  title: string;
  cards: Array<PositionInfoCardProps>;
}) {
  return (
    <div>
      <h3 className="text-20 font-medium mb-3 text-secondary-text">{title}</h3>
      <div
        className={clsx(
          "grid gap-3",
          cards.length === 2 && "sm:grid-cols-2",
          cards.length >= 3 && "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {cards.map((card, index) => (
          <OrderInfoCard {...card} key={index} />
        ))}
      </div>
    </div>
  );
}

export function InfoBlockWithBorder({
  title,
  tooltipText,
  value,
}: {
  title: string;
  tooltipText: string;
  value: ReactNode;
}) {
  return (
    <div className="border-l-4 border-tertiary-bg rounded-1 pl-4 min-w-[185px]">
      <div className="flex items-center gap-2 text-14 text-tertiary-text whitespace-nowrap">
        {title} <Tooltip text={tooltipText} />
      </div>
      <p className="relative flex gap-1 items-center font-medium text-secondary-text">
        <span className="">{value}</span>
      </p>
    </div>
  );
}

export function SimpleInfoBlock({
  title,
  tooltipText,
  value,
}: {
  title: string;
  tooltipText: string;
  value: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col justify-center pl-5 pr-4 bg-tertiary-bg rounded-3 py-3 bg-right-top bg-no-repeat bg-[length:120px_80px]",
      )}
    >
      <div className="flex items-center gap-1">
        <span className="flex items-center gap-1 text-14 text-tertiary-text">
          {title}
          <Tooltip iconSize={20} text={tooltipText} />
        </span>
      </div>
      <div className="relative flex gap-1 font-medium text-16 text-secondary-text">{value}</div>
    </div>
  );
}
