"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

import { clsxMerge } from "@/functions/clsxMerge";

import { DEMO_TARGET, demoHighlight, useDemoNumber } from "./DemoUi";

export const DEMO_TOKEN_LOGOS: Record<string, string> = {
  USDT: "/images/tokens/USDT.svg",
  D223: "/images/tokens/DEX.svg",
  ETH: "/images/tokens/ETH.svg",
  DEMO: "/images/tokens/placeholder.svg",
};

export function DemoTokenLogo({ symbol, size = 24 }: { symbol: string; size?: number }) {
  return (
    <Image
      src={DEMO_TOKEN_LOGOS[symbol] ?? DEMO_TOKEN_LOGOS.DEMO}
      alt=""
      width={size}
      height={size}
      className="rounded-full flex-shrink-0"
    />
  );
}

type Standard = "ERC-20" | "ERC-223";

// Copy of the swap form's token input: amount, token pill and the two standard cards with
// balances. Only the amount (when editable) and the highlighted standard respond to clicks.
export default function DemoTokenBox({
  label,
  amount,
  onAmountChange,
  usd,
  symbol,
  balances,
  selected,
  highlightStandard,
  onPickStandard,
  pulse,
  error,
  purple,
  footer,
}: {
  label: string;
  amount: string;
  onAmountChange?: (value: string) => void;
  usd: string;
  symbol: string;
  balances: Record<Standard, number>;
  selected?: Standard;
  highlightStandard?: Standard;
  onPickStandard?: (standard: Standard) => void;
  pulse?: boolean;
  error?: boolean;
  purple?: boolean;
  footer?: ReactNode;
}) {
  const t = useTranslations("Demo");
  const format = useDemoNumber();

  return (
    <div
      className={clsxMerge(
        "bg-secondary-bg rounded-3 p-4 md:p-5 flex flex-col gap-3",
        error && "ring-1 ring-inset ring-red-light",
      )}
    >
      <span className="text-14 text-secondary-text">{label}</span>
      <div className="flex items-center justify-between gap-3">
        {onAmountChange ? (
          <input
            data-demo-free=""
            inputMode="decimal"
            aria-label={label}
            value={amount}
            onChange={(e) => onAmountChange(e.target.value.replace(/[^\d.,]/g, ""))}
            className="bg-transparent outline-none text-24 md:text-32 font-bold w-full min-w-0"
          />
        ) : (
          <span className="text-24 md:text-32 font-bold truncate">{amount}</span>
        )}
        <span className="flex items-center gap-2 rounded-full bg-primary-bg px-3 py-1.5 flex-shrink-0">
          <DemoTokenLogo symbol={symbol} />
          <span className="font-medium">{symbol}</span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-14 text-secondary-text">{usd}</span>
        {onAmountChange && (
          <button
            type="button"
            data-demo-free=""
            onClick={() => onAmountChange(String(balances[selected ?? "ERC-20"]))}
            className="text-12 rounded-full bg-tertiary-bg px-2 py-0.5 text-secondary-text hocus:text-primary-text"
          >
            {t("max")}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["ERC-20", "ERC-223"] as Standard[]).map((standard) => {
          const isTarget = highlightStandard === standard;
          const isSelected = selected === standard;
          return (
            <button
              key={standard}
              type="button"
              {...(isTarget ? DEMO_TARGET : {})}
              onClick={isTarget ? () => onPickStandard?.(standard) : undefined}
              aria-pressed={isSelected}
              className={clsxMerge(
                "text-left rounded-2 px-3 py-2 border duration-200",
                isSelected
                  ? purple
                    ? "bg-purple-bg border-purple"
                    : "bg-green-bg border-green"
                  : "bg-primary-bg border-transparent",
                demoHighlight(isTarget, purple),
                isTarget && pulse && "animate-pulse",
              )}
            >
              <span className="block text-14 font-medium">{standard}</span>
              <span className="block text-12 text-secondary-text">
                {t("balance", { amount: format(balances[standard], 4) })}
              </span>
            </button>
          );
        })}
      </div>
      {footer}
    </div>
  );
}
