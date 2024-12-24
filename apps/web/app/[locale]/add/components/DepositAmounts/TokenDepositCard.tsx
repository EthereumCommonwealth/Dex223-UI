import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import { NumericFormat } from "react-number-format";
import { formatUnits } from "viem";
import { useAccount, useBalance } from "wagmi";

import Tooltip from "@/components/atoms/Tooltip";
import Badge from "@/components/badges/Badge";
import InputButton from "@/components/buttons/InputButton";
import { formatFloat } from "@/functions/formatFloat";
import truncateMiddle from "@/functions/truncateMiddle";
import { AllowanceStatus } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import useRevoke, { useRevokeEstimatedGas } from "@/hooks/useRevoke";
import useScopedBlockNumber from "@/hooks/useScopedBlockNumber";
import useWithdraw, { useWithdrawEstimatedGas } from "@/hooks/useWithdraw";
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESS } from "@/sdk_hybrid/addresses";
import { DexChainId } from "@/sdk_hybrid/chains";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { CurrencyAmount } from "@/sdk_hybrid/entities/fractions/currencyAmount";
import { Token } from "@/sdk_hybrid/entities/token";
import { Standard } from "@/sdk_hybrid/standard";
import { useRevokeDialogStatusStore } from "@/stores/useRevokeDialogStatusStore";
import { useRevokeStatusStore } from "@/stores/useRevokeStatusStore";

export const InputRange = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => {
  const [locValue, setValue] = useState(value);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(parseInt(event.target.value));
  };

  useEffect(() => {
    setValue(value);
  }, [value]);

  const handleMouseUp = () => {
    let newValue = locValue >= 50 ? 100 : 0;
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative h-6">
      <input
        value={locValue}
        max={100}
        step={5}
        min={0}
        onChange={handleChange}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        className={clsx(
          "w-full accent-green absolute top-2 left-0 right-0 duration-200 !bg-purple",
          locValue < 50 && "variant-purple",
        )}
        type="range"
      />
      <div
        className="pointer-events-none absolute bg-green h-2 rounded-l-1 left-0 top-2"
        style={{ width: value === 1 ? 0 : `calc(${locValue}% - ${(locValue / 100) * 20}px)` }}
      />
    </div>
  );
};

function InputTotalAmount({
  currency,
  value,
  onChange,
  isDisabled,
  tokenStandardRatio = 0,
  isMax = false,
  token0Balance,
  token1Balance,
  currentDeposit = BigInt(0),
}: {
  currency?: Currency;
  value: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
  tokenStandardRatio: number;
  isMax: boolean;
  token0Balance: any;
  token1Balance: any;
  currentDeposit: bigint;
}) {
  const totalBalance = currency?.isNative
    ? token0Balance?.value || BigInt(0)
    : (token0Balance?.value || BigInt(0)) + (token1Balance?.value || BigInt(0));

  const maxBalance = currency?.isNative
    ? token0Balance?.value || BigInt(0)
    : (token0Balance?.value || BigInt(0)) * BigInt((100 - tokenStandardRatio) / 100) +
      ((token1Balance?.value || BigInt(0)) + currentDeposit) * BigInt(tokenStandardRatio / 100);

  const maxHandler = () => {
    if (currency) {
      onChange(formatFloat(formatUnits(maxBalance, currency.decimals)));
    }
  };

  const [isFocused, setIsFocused] = useState(false);

  const t = useTranslations("Liquidity");

  const currencySymbolShort = truncateMiddle(currency?.symbol || "", {
    charsFromStart: 20,
    charsFromEnd: 0,
  });
  const currencySymbolShortX2 = truncateMiddle(currency?.symbol || "", {
    charsFromStart: 14,
    charsFromEnd: 0,
  });

  return (
    <div
      className={clsx(
        "bg-secondary-bg p-4 lg:p-5 pb-3 lg:pb-4 rounded-3 border hocus:shadow hocus:shadow-green/60",
        isFocused ? "border border-green shadow shadow-green/60" : "border-transparent",
      )}
    >
      <div className="mb-1 flex justify-between items-center">
        <NumericFormat
          allowedDecimalSeparators={[","]}
          decimalScale={currency?.decimals}
          inputMode="decimal"
          placeholder="0"
          className={clsx(
            "placeholder:text-tertiary-text bg-transparent outline-0 border-0 text-20 w-full peer",
          )}
          type="text"
          value={value}
          onValueChange={(values) => {
            onChange(values.value);
          }}
          allowNegative={false}
          disabled={isDisabled}
          onFocus={() => setIsFocused(true)} // Set focus state when NumericFormat is focused
          onBlur={() => setIsFocused(false)} // Remove focus state when NumericFormat loses focus
        />
        <div className="justify-end bg-secondary-bg rounded-5 py-1 pl-1 flex items-center gap-2 ">
          {currency ? (
            <div
              className={`rounded-5 gap-2 p-1 flex flex-row items-center flex-nowrap ${isDisabled ? "bg-tertiary-bg" : "bg-primary-bg"}`}
            >
              <Image
                src={currency?.logoURI || "/images/tokens/placeholder.svg"}
                alt=""
                width={24}
                height={24}
              />
              <span className="text-nowrap pr-7">{currencySymbolShortX2}</span>
            </div>
          ) : (
            <div
              className={`rounded-5 gap-2 p-1 flex flex-row items-center flex-nowrap ${isDisabled ? "bg-tertiary-bg" : "bg-primary-bg"}`}
            >
              <Image src={"/images/tokens/placeholder.svg"} alt="" width={24} height={24} />
              <span className="text-nowrap pr-7">{t("select_token")}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-secondary-text text-12 lg:text-14">—</span>
        <div className="flex gap-1 items-baseline">
          <span className="text-12 text-tertiary-text md:text-tertiary-text md:text-14">
            {currency
              ? t("balance", {
                  balance: formatFloat(formatUnits(totalBalance, currency.decimals)),
                  symbol: currencySymbolShort,
                })
              : "—"}
          </span>
          {currency && <InputButton onClick={maxHandler} isActive={isMax} text={t("max_title")} />}
        </div>
      </div>
    </div>
  );
}

// TODO: change standard inputs for native currency, 16.09.2024
function InputStandardAmount({
  standard,
  value,
  currency,
  currentAllowance,
  isDisabled,
  onChange,
  setTokenStandardRatio,
  tokenBalance,
}: {
  standard: Standard;
  value?: number | string;
  currency?: Currency;
  currentAllowance: bigint; // currentAllowance or currentDeposit
  isDisabled?: boolean;
  onChange: (value: string) => void;
  setTokenStandardRatio: (value: number) => void;
  tokenBalance: any;
}) {
  const t = useTranslations("Liquidity");
  const tSwap = useTranslations("Swap");
  // const { address } = useAccount();
  // const { data: blockNumber } = useBlockNumber({ watch: true });
  // const { data: tokenBalance, refetch: refetchBalance } = useBalance({
  //   address: currency ? address : undefined,
  //   token: currency ? getTokenAddressForStandard(currency, standard) : undefined,
  // });
  //
  // useEffect(() => {
  //   refetchBalance();
  // }, [blockNumber, refetchBalance]);

  const chainId = useCurrentChainId();
  useRevokeEstimatedGas({
    token: currency,
    contractAddress: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
  });

  useWithdrawEstimatedGas({
    token: currency,
    contractAddress: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
  });

  const currencySymbolShort = truncateMiddle(currency?.symbol || "", {
    charsFromStart: 15,
    charsFromEnd: 0,
  });

  const { setIsOpenedRevokeDialog, setDialogParams } = useRevokeDialogStatusStore();
  const { status, setStatus } = useRevokeStatusStore();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-1 lg:gap-2">
        <span className="text-secondary-text">{t("standard")}</span>
        <Badge color={standard === Standard.ERC20 ? "purple" : "green"} text={standard} />
        <Tooltip
          iconSize={20}
          text={standard === Standard.ERC20 ? tSwap("erc20_tooltip") : tSwap("erc223_tooltip")}
        />
      </div>
      <div
        className={clsx(
          "bg-secondary-bg px-4 lg:px-5 pt-2 lg:pt-3 pb-3 lg:pb-4 w-full rounded-2 border hocus:shadow hocus:shadow-green/60",
          isFocused ? "border border-green shadow shadow-green/60" : "border-transparent",
        )}
      >
        <div className="mb-1 flex justify-between items-center">
          <NumericFormat
            allowedDecimalSeparators={[","]}
            decimalScale={currency?.decimals}
            inputMode="decimal"
            placeholder="0"
            className={clsx(
              "placeholder:text-tertiary-text bg-transparent outline-0 border-0 text-16 w-full peer",
            )}
            type="text"
            value={value === "0" ? "" : value}
            onValueChange={(values) => {
              onChange(values.value);
            }}
            allowNegative={false}
            disabled={isDisabled}
            onFocus={() => {
              setTokenStandardRatio(standard === Standard.ERC20 ? 0 : 100);
              setIsFocused(true);
            }} // Set focus state when NumericFormat is focused
            onBlur={() => setIsFocused(false)} // Remove focus state when NumericFormat loses focus
          />
        </div>
        <div className="flex justify-end items-center text-10 lg:text-12 text-tertiary-text">
          <span>
            {currency
              ? t("balance", {
                  balance: formatFloat(
                    formatUnits(tokenBalance?.value || BigInt(0), currency.decimals),
                  ),
                  symbol: currencySymbolShort,
                })
              : "—"}
          </span>
        </div>
      </div>
      <div className={clsx("flex justify-between items-center h-4")}>
        {currentAllowance > 0 ? (
          <>
            {currency && (
              <div className="flex items-center gap-1">
                <Tooltip
                  iconSize={16}
                  text={
                    standard === Standard.ERC20 ? t("approved_tooltip") : t("deposited_tooltip")
                  }
                />
                <span className="text-12 text-tertiary-text">
                  {standard === Standard.ERC20
                    ? t("approved", {
                        approved: formatFloat(
                          formatUnits(currentAllowance || BigInt(0), currency.decimals),
                        ),
                        symbol: currencySymbolShort,
                      })
                    : t("deposited", {
                        deposited: formatFloat(
                          formatUnits(currentAllowance || BigInt(0), currency.decimals),
                        ),
                        symbol: currencySymbolShort,
                      })}
                </span>
              </div>
            )}
            {!!currentAllowance ? (
              <span
                className={`text-12 px-2 pt-[2px] pb-[2px] pl-4 pr-4 rounded-3 h-min border duration-200 ${
                  [AllowanceStatus.PENDING, AllowanceStatus.LOADING].includes(status)
                    ? "bg-gray-400 border-secondary-border text-gray-500 cursor-not-allowed" // Disabled styles
                    : "bg-green-bg border-transparent text-secondary-text cursor-pointer hocus:border-green hocus:bg-green-bg-hover hocus:text-primary-text"
                }`}
                onClick={() => {
                  if (![AllowanceStatus.PENDING, AllowanceStatus.LOADING].includes(status)) {
                    setStatus(AllowanceStatus.INITIAL);
                    setDialogParams(
                      currency as Token,
                      NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
                      standard,
                    );
                    setIsOpenedRevokeDialog(true);
                  }
                }}
              >
                {standard === Standard.ERC20 ? t("revoke") : t("withdraw")}
              </span>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function TokenDepositCard({
  currency,
  value,
  formattedValue,
  onChange,
  isDisabled,
  isOutOfRange,
  tokenStandardRatio,
  setTokenStandardRatio,
  // gasPrice,
}: {
  currency?: Currency;
  value: CurrencyAmount<Currency> | undefined;
  formattedValue: string;
  onChange: (value: string) => void;
  isDisabled: boolean;
  isOutOfRange: boolean;
  // tokenStandardRatio: 0 | 100;
  tokenStandardRatio: number;
  // setTokenStandardRatio: (ratio: 0 | 100) => void;
  setTokenStandardRatio: (ratio: number) => void;
  // gasPrice?: bigint;
}) {
  const t = useTranslations("Liquidity");

  const currencySymbolShort = truncateMiddle(currency?.symbol || "", {
    charsFromStart: 25,
    charsFromEnd: 0,
  });

  const { address } = useAccount();

  const { data: blockNumber } = useScopedBlockNumber({ watch: true });
  const { data: token0Balance, refetch: refetchBalance0 } = useBalance({
    address: currency ? address : undefined,
    token: currency && !currency.isNative ? currency.address0 : undefined,
    query: {
      enabled: Boolean(currency),
    },
  });
  const { data: token1Balance, refetch: refetchBalance1 } = useBalance({
    address: currency ? address : undefined,
    token: currency && !currency.isNative ? currency.address1 : undefined,
    query: {
      enabled: Boolean(currency),
    },
  });

  useEffect(() => {
    refetchBalance0();
    refetchBalance1();
  }, [blockNumber, refetchBalance0, refetchBalance1]);

  const chainId = useCurrentChainId();
  const valueBigInt = value ? BigInt(value.quotient.toString()) : BigInt(0);

  const ERC223Value = (valueBigInt * BigInt(tokenStandardRatio)) / BigInt(100);
  const ERC20Value = valueBigInt - ERC223Value;

  const { currentAllowance: currentAllowance } = useRevoke({
    token: currency,
    contractAddress: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
  });

  const { currentDeposit: currentDeposit } = useWithdraw({
    token: currency,
    contractAddress: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
  });

  const isMax: boolean = useMemo(() => {
    return tokenStandardRatio === 0
      ? formattedValue !== "0" &&
          formatFloat(formatUnits(token0Balance?.value || BigInt(0), currency?.decimals || 18)) ===
            formattedValue
      : formattedValue !== "0" &&
          formatFloat(
            formatUnits(
              (token1Balance?.value || BigInt(0)) + currentDeposit,
              currency?.decimals || 18,
            ),
          ) === formattedValue;
  }, [
    currency?.decimals,
    currentDeposit,
    formattedValue,
    token0Balance?.value,
    token1Balance?.value,
    tokenStandardRatio,
  ]);

  if (isOutOfRange) {
    return (
      <div className="flex justify-center items-center rounded-3 bg-tertiary-bg p-5 min-h-[320px]">
        <span className="text-center text-secondary-text">{t("out_of_range")}</span>
      </div>
    );
  }
  // if (!currency) return;

  return (
    <div
      className={`rounded-3 bg-tertiary-bg px-4 py-3 lg:p-5 ${
        isDisabled ? "pointer-events-none " : ""
      }`}
    >
      <div className={`flex items-center gap-2 mb-3`}>
        <Image
          width={24}
          height={24}
          src={currency?.logoURI || "/images/tokens/placeholder.svg"}
          alt=""
        />
        <h3 className={`text-16 font-bold text-secondary-text text-nowrap`}>
          {currency
            ? t("token_deposit_amounts", { symbol: currencySymbolShort })
            : t("select_token")}
        </h3>
      </div>
      <div className="flex flex-col gap-4 lg:gap-5">
        <InputTotalAmount
          currency={currency}
          value={formattedValue}
          onChange={onChange}
          isDisabled={isDisabled}
          tokenStandardRatio={tokenStandardRatio}
          isMax={isMax}
          token0Balance={token0Balance}
          token1Balance={token1Balance}
          currentDeposit={currentDeposit}
        />
        {currency?.isNative && currency ? null : (
          <>
            <InputRange value={tokenStandardRatio} onChange={setTokenStandardRatio} />
            <div className="flex flex-col md:flex-row justify-between gap-4 w-full">
              <InputStandardAmount
                standard={Standard.ERC20}
                value={formatUnits(ERC20Value, currency?.decimals || 18)}
                currentAllowance={currentAllowance || BigInt(0)}
                isDisabled={isDisabled}
                onChange={onChange}
                currency={currency}
                setTokenStandardRatio={setTokenStandardRatio}
                tokenBalance={token0Balance}
              />
              <InputStandardAmount
                standard={Standard.ERC223}
                value={formatUnits(ERC223Value, currency?.decimals || 18)}
                currency={currency}
                isDisabled={isDisabled}
                onChange={onChange}
                setTokenStandardRatio={setTokenStandardRatio}
                currentAllowance={currentDeposit || BigInt(0)}
                tokenBalance={token1Balance}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
