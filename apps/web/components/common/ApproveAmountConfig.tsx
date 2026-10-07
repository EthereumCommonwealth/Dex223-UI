import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import React from "react";
import { formatUnits, parseUnits } from "viem";

import { SingleAddressToken } from "@/app/[locale]/token-listing/add/hooks/useAutoListing";
import Input from "@/components/atoms/Input";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import { formatFloat } from "@/functions/formatFloat";
import { Currency } from "@/sdk_bi/entities/currency";

export default function ApproveAmountConfig({
  asset,
  isEditApproveActive,
  setEditApproveActive,
  amountToApprove,
  setAmountToApprove,
  minAmount,
}: {
  asset: Currency | SingleAddressToken;
  isEditApproveActive: boolean;
  setEditApproveActive: (value: boolean) => void;
  amountToApprove: string;
  setAmountToApprove: (value: string) => void;
  minAmount: bigint;
}) {
  const t = useTranslations("Margin");

  return (
    <div
      className={clsx(
        "bg-tertiary-bg rounded-3 flex justify-between items-center px-5 py-2 min-h-12 mt-5 gap-5 mb-5",
        parseUnits(amountToApprove, asset.decimals ?? 18) < minAmount && "pb-[26px]",
      )}
    >
      <div className="flex items-center gap-1 text-secondary-text whitespace-nowrap">
        <Tooltip iconSize={20} text={t("approve_amount_tooltip")} />
        <span className="text-14">{t("approve_amount")}</span>
      </div>
      <div className="flex items-center gap-2 flex-grow justify-end">
        {!isEditApproveActive ? (
          <span className="text-14">
            {formatFloat(amountToApprove)} {asset.symbol}
          </span>
        ) : (
          <div className="flex-grow">
            <div className="relative w-full flex-grow">
              <Input
                isError={parseUnits(amountToApprove, asset.decimals ?? 18) < minAmount}
                className="h-8 pl-3"
                value={amountToApprove}
                onChange={(e) => setAmountToApprove(e.target.value)}
                type="text"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-tertiary-text">
                {asset.symbol}
              </span>
            </div>
            {parseUnits(amountToApprove, asset.decimals ?? 18) < minAmount && (
              <span className="text-red-light absolute text-12 translate-y-0.5">
                {t("approve_must_be_higher", { amount: formatUnits(minAmount, asset.decimals) })}
              </span>
            )}
          </div>
        )}
        {!isEditApproveActive ? (
          <Button
            size={ButtonSize.EXTRA_SMALL}
            colorScheme={ButtonColor.LIGHT_GREEN}
            onClick={() => setEditApproveActive(true)}
          >
            {t("edit")}
          </Button>
        ) : (
          <Button
            disabled={parseUnits(amountToApprove, asset.decimals ?? 18) < minAmount}
            size={ButtonSize.EXTRA_SMALL}
            colorScheme={ButtonColor.LIGHT_GREEN}
            onClick={() => setEditApproveActive(false)}
          >
            {t("save")}
          </Button>
        )}
      </div>
    </div>
  );
}
