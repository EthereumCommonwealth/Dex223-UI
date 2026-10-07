import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React from "react";
import { NumericFormat } from "react-number-format";

import SelectButton from "@/components/atoms/SelectButton";
import Badge from "@/components/badges/Badge";
import InputButton from "@/components/buttons/InputButton";
import { clsxMerge } from "@/functions/clsxMerge";
import { formatFloat } from "@/functions/formatFloat";
import { useUSDPrice } from "@/hooks/useUSDPrice";
import { Currency } from "@/sdk_bi/entities/currency";
import { Standard } from "@/sdk_bi/standard";

/**
 * Swap-page token input from the "Swap card v2" design: a larger amount, the token as the
 * main control, and the ERC-20 / ERC-223 choice as a compact toggle. Both standards'
 * balances stay visible on one line under it, since holding a token in either standard is
 * what DEX223 is about. Same props as TokenInput minus the colour scheme (swap is green).
 */
export default function CompactTokenInput({
  handleClick,
  token,
  value,
  onInputChange,
  balance0,
  balance1,
  label,
  setStandard,
  standard,
  readOnly = false,
  isHalf = false,
  isMax = false,
  setHalf,
  setMax,
  gasERC20,
  gasERC223,
  isError,
  allowedErc223 = true,
}: {
  handleClick: () => void;
  token: Currency | undefined;
  value: string;
  onInputChange: (value: string) => void;
  balance0: string | undefined;
  balance1: string | undefined;
  label: string;
  standard: Standard;
  setStandard: (standard: Standard) => void;
  readOnly?: boolean;
  isHalf?: boolean;
  isMax?: boolean;
  setHalf?: () => void;
  setMax?: () => void;
  gasERC20?: string;
  gasERC223?: string;
  isError?: boolean;
  allowedErc223?: boolean;
}) {
  const t = useTranslations("Swap");
  const { price } = useUSDPrice(token?.wrapped.address0);

  const isToken = !token || token.isToken;
  const selectedBalance = token?.isNative || standard === Standard.ERC223 ? balance1 : balance0;

  const segments = [
    { standard: Standard.ERC20, label: "ERC-20", gas: gasERC20, disabled: !token },
    {
      standard: Standard.ERC223,
      label: "ERC-223",
      gas: gasERC223,
      disabled: !token || !allowedErc223,
    },
  ];

  return (
    <div className="px-5 pt-4 pb-3 bg-secondary-bg rounded-3 relative">
      <div className="flex justify-between items-center gap-2 h-6">
        <span className="text-14 text-secondary-text">{label}</span>
        <span className="flex items-center gap-2 text-14 text-tertiary-text">
          {token && (
            <span className="whitespace-nowrap">
              {t("balance")} {selectedBalance || "0"}
            </span>
          )}
          {setHalf && setMax && (
            <>
              <InputButton onClick={setHalf} isActive={isHalf} text="Half" />
              <InputButton onClick={setMax} isActive={isMax} text="Max" />
            </>
          )}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 mt-2">
        <NumericFormat
          allowedDecimalSeparators={[","]}
          decimalScale={token?.decimals}
          inputMode="decimal"
          placeholder="0"
          className={clsx(
            "h-12 min-w-0 bg-transparent outline-0 border-0 text-[32px] md:text-[40px] leading-[48px] font-medium w-full peer placeholder:text-tertiary-text",
            readOnly && "pointer-events-none",
          )}
          type="text"
          aria-label={label}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          value={value}
          onValueChange={(values) => onInputChange(values.value)}
          allowNegative={false}
        />
        <div
          className={clsxMerge(
            "duration-200 rounded-3 pointer-events-none absolute w-full h-full border border-transparent top-0 left-0",
            "peer-hocus:shadow peer-focus:shadow peer-hocus:shadow-green/60 peer-focus:shadow-green/60 peer-focus:border-green",
            isError &&
              "shadow shadow-red-light/60 border-red-light peer-hocus:shadow-red-light/60 peer-focus:shadow-red-light/60 peer-focus:border-red-light",
          )}
        />
        <SelectButton
          type="button"
          className="flex-shrink-0"
          variant="rounded"
          onClick={handleClick}
          size="large"
        >
          {token ? (
            <span className="flex gap-2 items-center">
              <Image
                className="flex-shrink-0 rounded-full"
                src={token.logoURI || "/images/tokens/placeholder.svg"}
                alt=""
                width={32}
                height={32}
              />
              <span className="text-18 font-medium max-w-[100px] md:max-w-[140px] overflow-ellipsis overflow-hidden whitespace-nowrap">
                {token.symbol}
              </span>
            </span>
          ) : (
            <span className="whitespace-nowrap text-tertiary-text pl-2">{t("select_token")}</span>
          )}
        </SelectButton>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2 min-h-7">
        <span className="text-14 text-tertiary-text">
          ${price ? formatFloat(price * +value) : "0"}
        </span>

        {isToken ? (
          <div
            role="radiogroup"
            aria-label={t("token_standard")}
            className="flex p-0.5 rounded-2 bg-primary-bg"
          >
            {segments.map((segment) => {
              const active = standard === segment.standard;
              return (
                <button
                  key={segment.standard}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={segment.disabled}
                  title={segment.gas && segment.gas !== "—" ? segment.gas : undefined}
                  onClick={() => setStandard(segment.standard)}
                  className={clsx(
                    "h-6 px-2.5 rounded-[6px] text-12 font-medium duration-200 disabled:cursor-not-allowed",
                    active
                      ? "bg-green-bg text-primary-text shadow-[inset_0_0_0_1px] shadow-green/60"
                      : "text-tertiary-text hocus:text-secondary-text disabled:hocus:text-tertiary-text",
                  )}
                >
                  {segment.label}
                </button>
              );
            })}
          </div>
        ) : (
          <span className="flex items-center gap-1">
            <Badge color="green" text="Native" />
            <Tooltip iconSize={16} text={t("native_currency_tooltip")} />
          </span>
        )}
      </div>

      {token && token.isToken && (
        <div className="flex justify-end gap-3 text-12 text-tertiary-text mt-1">
          <span className={clsx(standard === Standard.ERC20 && "text-secondary-text")}>
            ERC-20: {balance0 || "0"}
          </span>
          <span className={clsx(standard === Standard.ERC223 && "text-secondary-text")}>
            ERC-223: {balance1 || "0"}
          </span>
        </div>
      )}
    </div>
  );
}
