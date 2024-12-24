import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { NumericFormat } from "react-number-format";

import SelectButton from "@/components/atoms/SelectButton";
import Tooltip from "@/components/atoms/Tooltip";
import Badge from "@/components/badges/Badge";
import InputButton from "@/components/buttons/InputButton";
import { clsxMerge } from "@/functions/clsxMerge";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { Token } from "@/sdk_hybrid/entities/token";
import { Standard } from "@/sdk_hybrid/standard";

function MobileStandardOption({
  balance,
  symbol,
  standard,
  active,
  setIsActive,
  token,
}: {
  balance: string | undefined;
  symbol: string | undefined;
  standard: Standard;
  active: Standard;
  setIsActive: (isActive: Standard) => void;
  token: Token | undefined;
}) {
  const t = useTranslations("Swap");
  const isActive = useMemo(() => {
    return active === standard;
  }, [active, standard]);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsActive(standard)}
        className={clsxMerge(
          "*:z-10 pt-10 flex flex-col gap-1 px-3 pb-2.5  rounded-2 before:absolute before:rounded-3 before:w-full before:h-full before:left-0 before:top-0 before:duration-200 relative before:bg-gradient-to-r before:from-green-bg before:to-green-bg/0 hocus:cursor-pointer text-12 group",
          isActive ? "before:opacity-100" : "before:opacity-0 hocus:before:opacity-100",
          standard === Standard.ERC223 &&
            "before:rotate-180 items-end bg-gradient-to-l from-primary-bg to-secondary-bg",
          standard === Standard.ERC20 && "bg-gradient-to-r from-primary-bg to-secondary-bg",
          !token && "before:opacity-0 hocus:before:opacity-0 before:cursor-default cursor-default",
        )}
      >
        {!token ? (
          <div className="text-tertiary-text cursor-default">—</div>
        ) : (
          <span
            className={clsx(
              "flex flex-col",
              standard === active ? "text-secondary-text" : "text-tertiary-text",
              standard === Standard.ERC223 ? "items-end" : "items-start",
            )}
          >
            {t("balance")}{" "}
            <span
              className={clsx(
                "w-full table table-fixed",
                standard === active ? "text-primary-text" : "text-tertiary-text",
              )}
            >
              <span
                className={clsx(
                  "table-cell whitespace-nowrap overflow-ellipsis overflow-hidden",
                  standard === Standard.ERC223 ? "text-right" : "text-left",
                )}
              >
                {balance || "0.0"} {symbol}
              </span>
            </span>
          </span>
        )}
      </button>
    </div>
  );
}

function StandardOption({
  balance,
  symbol,
  standard,
  active,
  setIsActive,
  token,
  gas,
}: {
  balance: string | undefined;
  symbol: string | undefined;
  standard: Standard;
  active: Standard;
  setIsActive: (isActive: Standard) => void;
  token: Token | undefined;
  gas?: string;
}) {
  const t = useTranslations("Swap");
  const isActive = useMemo(() => {
    return active === standard;
  }, [active, standard]);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsActive(standard)}
        className={clsxMerge(
          "*:z-10 flex flex-col gap-1 px-3 py-2.5  rounded-2 before:absolute before:rounded-3 before:w-full before:h-full before:left-0 before:top-0 before:duration-200 relative before:bg-gradient-to-r before:from-green-bg before:to-green-bg/0 hocus:cursor-pointer text-12 group",
          isActive ? "before:opacity-100" : "before:opacity-0 hocus:before:opacity-100",
          standard === Standard.ERC223 &&
            "before:rotate-180 items-end bg-gradient-to-l from-primary-bg to-secondary-bg",
          standard === Standard.ERC20 && "bg-gradient-to-r from-primary-bg to-secondary-bg",
          !token &&
            "before:opacity-0 hocus:before:opacity-0 before:cursor-default cursor-default pointer-events-none",
          gas && standard === Standard.ERC20 && "rounded-b-0 before:rounded-b-0",
          gas && standard === Standard.ERC223 && "rounded-b-0 before:rounded-t-0",
        )}
      >
        <div className="flex items-center gap-1 cursor-default">
          <span
            className={clsxMerge(
              "text-12 text-secondary-text",
              (!token || standard !== active) && "text-tertiary-text",
            )}
          >
            {t("standard")}
          </span>
          <Badge size="small" color="green" text={standard} />

          <Tooltip
            iconSize={16}
            text={standard === Standard.ERC20 ? t("erc20_tooltip") : t("erc223_tooltip")}
          />
        </div>
        {!token ? (
          <div className="text-tertiary-text cursor-default">—</div>
        ) : (
          <span
            className={clsx(
              "w-[calc(100%-55px)] table table-fixed",
              standard === active ? "text-secondary-text" : "text-tertiary-text",
            )}
          >
            <span
              className={clsx(
                "table-cell whitespace-nowrap overflow-ellipsis overflow-hidden",
                standard === active ? "text-primary-text" : "text-tertiary-text",
                standard === Standard.ERC223 ? "text-right" : "text-left",
              )}
            >
              <span className={standard === active ? "text-secondary-text" : "text-tertiary-text"}>
                {t("balance")}
              </span>{" "}
              {balance || "0.0"} {symbol}
            </span>
          </span>
        )}
      </button>
      {gas && (
        <div
          className={clsx(
            "py-1 px-3 text-12 bg-swap-gas-gradient flex items-center text-tertiary-text w-fit",
            standard === Standard.ERC20 &&
              "bg-gradient-to-r from-primary-bg to-secondary-bg rounded-bl-2",
            standard === Standard.ERC223 &&
              "bg-gradient-to-l from-primary-bg to-secondary-bg rounded-br-2 justify-end ml-auto",
          )}
        >
          {gas}
        </div>
      )}
    </div>
  );
}
export default function TokenInput({
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
}) {
  const t = useTranslations("Swap");

  return (
    <div className="p-5 bg-secondary-bg rounded-3 relative">
      <div className="flex justify-between items-center mb-5 h-[22px]">
        <span className="text-14 block text-secondary-text">{label}</span>
        {setMax && setHalf && (
          <div className="flex items-center gap-2">
            <InputButton onClick={setHalf} isActive={isHalf} text="Half" />
            <InputButton onClick={setMax} isActive={isMax} text="Max" />
          </div>
        )}
      </div>

      <div className="flex items-center mb-5 justify-between">
        <div>
          <NumericFormat
            allowedDecimalSeparators={[","]}
            decimalScale={token?.decimals}
            inputMode="decimal"
            placeholder="0.0"
            className={clsx(
              "h-12 bg-transparent outline-0 border-0 text-32 w-full peer placeholder:text-tertiary-text",
              readOnly && "pointer-events-none",
            )}
            type="text"
            value={value}
            onValueChange={(values) => {
              onInputChange(values.value);
            }}
            allowNegative={false}
          />
          <span className="text-12 block -mt-1 text-tertiary-text">$0.00</span>
          <div className="duration-200 rounded-3 pointer-events-none absolute w-full h-full border border-transparent peer-hocus:shadow peer-hocus:shadow-green/60 peer-focus:shadow peer-focus:shadow-green/60 peer-focus:border-green top-0 left-0" />
        </div>
        <SelectButton
          className="flex-shrink-0"
          variant="rounded"
          onClick={handleClick}
          size="large"
        >
          {token ? (
            <span className="flex gap-2 items-center">
              <Image
                className="flex-shrink-0"
                src={token?.logoURI || ""}
                alt="Ethereum"
                width={32}
                height={32}
              />
              <span className="max-w-[100px] md:max-w-[150px] overflow-ellipsis overflow-hidden whitespace-nowrap">
                {token.symbol}
              </span>
            </span>
          ) : (
            <span className="whitespace-nowrap text-tertiary-text pl-2">{t("select_token")}</span>
          )}
        </SelectButton>
      </div>

      {(!token || (token && token.isToken)) && (
        <>
          <div className="md:hidden pb-2 relative grid grid-cols-2">
            <MobileStandardOption
              token={token}
              setIsActive={setStandard}
              active={standard}
              standard={Standard.ERC20}
              symbol={token?.symbol}
              balance={balance0}
            />
            <div
              className={clsxMerge(
                "mx-auto z-10 text-10 w-[calc(100%-24px)] left-1/2 -translate-x-1/2 h-[32px] absolute top-1 rounded-20 border-green border p-1 flex gap-1 items-center",
                !token && "border-secondary-border",
              )}
            >
              {[Standard.ERC20, Standard.ERC223].map((st) => {
                return (
                  <button
                    key={st}
                    className={clsxMerge(
                      "h-6 rounded-3 duration-200 px-2 min-w-[58px] w-full text-10 text-secondary-text",
                      standard === st
                        ? "bg-green text-black shadow shadow-green/60"
                        : "hocus:bg-green-bg hocus:text-primary-text",
                      !token && st === Standard.ERC20 && "bg-primary-bg shadow-none",
                      !token && "text-tertiary-text pointer-events-none",
                    )}
                    onClick={() => setStandard(st)}
                  >
                    Standard {st}
                  </button>
                );
              })}
            </div>

            <MobileStandardOption
              token={token}
              setIsActive={setStandard}
              active={standard}
              standard={Standard.ERC223}
              symbol={token?.symbol}
              balance={balance1}
            />
          </div>
          <div className="hidden md:grid md:grid-cols-2 gap-1 md:gap-3 relative">
            <StandardOption
              token={token}
              setIsActive={setStandard}
              active={standard}
              standard={Standard.ERC20}
              symbol={token?.symbol}
              balance={balance0}
              gas={gasERC20}
            />
            <div
              className={clsxMerge(
                "relative mx-auto md:absolute md:left-1/2 md:top-[14px] md:-translate-x-1/2 z-10 text-10 h-[32px] rounded-20 border-green border p-1 flex gap-1 items-center",
                !token && "border-secondary-border",
              )}
            >
              {[Standard.ERC20, Standard.ERC223].map((st) => {
                return (
                  <button
                    key={st}
                    className={clsxMerge(
                      "h-6 rounded-3 duration-200 px-2 min-w-[58px] text-secondary-text",
                      standard === st
                        ? "bg-green text-black shadow shadow-green/60"
                        : "hocus:bg-green-bg hocus:text-primary-text",
                      !token && st === Standard.ERC20 && "bg-primary-bg shadow-none",
                      !token && "text-tertiary-text pointer-events-none",
                    )}
                    onClick={() => setStandard(st)}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
            <StandardOption
              token={token}
              setIsActive={setStandard}
              active={standard}
              standard={Standard.ERC223}
              symbol={token?.symbol}
              balance={balance1}
              gas={gasERC223}
            />
          </div>
        </>
      )}
      {token && token.isNative && (
        <div className="flex flex-col">
          <div
            className={clsxMerge(
              "*:z-10 flex flex-col gap-1 px-3 py-2.5  rounded-2 before:absolute before:rounded-3 before:w-full before:h-full before:left-0 before:top-0 before:duration-200 relative before:bg-gradient-to-r before:from-green-bg before:to-green-bg/0 hocus:cursor-pointer text-12 group",
              standard === Standard.ERC223 &&
                "before:rotate-180 items-end bg-gradient-to-l from-primary-bg to-secondary-bg",
              standard === Standard.ERC20 && "bg-gradient-to-r from-primary-bg to-secondary-bg",
              !token &&
                "before:opacity-0 hocus:before:opacity-0 before:cursor-default cursor-default",
            )}
          >
            <div className="flex items-center gap-1 cursor-default">
              <Badge color="green" text="Native" />
              <Tooltip iconSize={16} text="Native token tooltip" />
            </div>

            <span className={clsx("block text-primary-text")}>
              {t("balance")}{" "}
              <span className="whitespace-nowrap">
                {balance1 || "0.0"} {token.symbol}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
