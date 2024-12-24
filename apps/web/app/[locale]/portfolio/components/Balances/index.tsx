"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { formatUnits } from "viem";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import { SearchInput } from "@/components/atoms/Input";
import Preloader from "@/components/atoms/Preloader";
import Tooltip from "@/components/atoms/Tooltip";
import { TokenPortfolioDialogContent } from "@/components/dialogs/TokenPortfolioDialog";
import { formatFloat } from "@/functions/formatFloat";
import usePositions from "@/hooks/usePositions";
import { Currency } from "@/sdk_hybrid/entities/currency";

import { useActiveWalletBalances } from "../../stores/balances.hooks";
import { BalancesDesktopTable, BalancesMobileTable } from "./BalancesTable";

const filterTable = ({
  searchValue,
  value: { token },
}: {
  searchValue: string;
  value: {
    token: Currency;
    amountERC20: bigint;
    amountERC223: bigint;
    amountFiat: string;
  };
}) => {
  if (!searchValue) return true;
  if (token.wrapped.address0 === searchValue) return true;
  if (token.wrapped.address1 === searchValue) return true;
  if (token.name?.toLowerCase().includes(searchValue.toLowerCase())) return true;
  return !!token.symbol?.toLowerCase().includes(searchValue.toLowerCase());
};

export const Balances = () => {
  const t = useTranslations("Portfolio");
  const [searchValue, setSearchValue] = useState("");
  const [tokenForPortfolio, setTokenForPortfolio] = useState<Currency | null>(null);
  const isTokenInfoOpened = Boolean(tokenForPortfolio);
  const handleClosTokenInfo = () => {
    setTokenForPortfolio(null);
  };

  const loading = false;

  const { positions } = usePositions();
  const { tokenBalances, activeAddresses } = useActiveWalletBalances();

  const currentTableData = tokenBalances
    .filter((value) => filterTable({ searchValue, value }))
    .map(({ token, amountERC20, amountERC223, amountFiat }) => ({
      logoURI: token.logoURI,
      name: token.wrapped.name,
      amountERC20: `${formatFloat(formatUnits(amountERC20 || BigInt(0), token.decimals))} ${token.symbol}`,
      amountERC223: `${formatFloat(formatUnits(amountERC223 || BigInt(0), token.decimals))} ${token.symbol}`,
      amountFiat: amountFiat,
      token,
    })) as any[];

  return (
    <>
      <div className="mt-5 flex flex-col lg:flex-row gap-5">
        {/* Wallet balance info box */}
        <div className="flex flex-col bg-gradient-card-green-light-fill rounded-3 px-4 md:px-5 py-2.5 md:py-6 w-full relative overflow-hidden">
          <div className="flex items-center gap-1 mb-auto">
            <span className="text-14 lg:text-16 text-secondary-text">{t("wallet_balance")}</span>
            <Tooltip iconSize={20} text="Info text" />
          </div>

          <span className="text-24 lg:text-32 font-medium">$ —</span>

          <Image
            src="/images/logo-short.svg"
            alt="Side Icon"
            width={"180"}
            height={"120"}
            className="absolute top-[-32px] right-0 object-cover opacity-10"
          />
        </div>

        {/*TODO: Extract card to separate component. 01.10.2024*/}
        <div className="relative flex flex-col bg-gradient-card-blue-light-fill  rounded-3 px-4 md:px-5 py-2.5 md:py-6 w-full overflow-hidden">
          <div className="flex items-center gap-1 z-10">
            <span className="text-14 lg:text-16 text-secondary-text">{t("margin_balance")}</span>
            <Tooltip iconSize={20} text="Info text" />
          </div>
          <span className="text-24 lg:text-32 font-medium">$ —</span>
          <Image
            src="/images/portfolio-bars.svg"
            alt="Side Icon"
            width={"180"}
            height={"120"}
            className="absolute top-0 right-0 object-cover z-0"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col lg:flex-row gap-5">
        <div className="flex flex-col bg-primary-bg rounded-3 px-5 py-6 w-full">
          <div className="flex items-center gap-1">
            <span className="text-14 lg:text-16 text-secondary-text">{t("liquidity_balance")}</span>
            <Tooltip iconSize={20} text="Info text" />
          </div>
          <span className="text-18 lg:text-24 font-medium">$ —</span>
          <span className="px-2 py-[2px] border border-secondary-border text-tertiary-text text-14 rounded-1 w-max">
            {`${positions?.length ? positions.length : "—"} ${t("liquidity_positions_suffix")}`}
          </span>
        </div>
        <div className="flex flex-col bg-primary-bg rounded-3 px-5 py-6 w-full">
          <div className="flex items-center gap-1">
            <span className="text-14 lg:text-16 text-secondary-text">{t("lending_balance")}</span>
            <Tooltip iconSize={20} text="Info text" />
          </div>
          <span className="text-18 lg:text-24 font-medium">$ —</span>
          <span className="px-2 py-[2px] border border-secondary-border text-tertiary-text text-14 rounded-1 w-max">
            — lending orders
          </span>
        </div>
        <div className="flex flex-col bg-primary-bg rounded-3 px-5 py-6 w-full">
          <div className="flex items-center gap-1">
            <span className="text-14 lg:text-16 text-secondary-text">
              {t("deposited_contract")}
            </span>
            <Tooltip iconSize={20} text="Info text" />
          </div>
          <span className="text-18 lg:text-24 font-medium">$ —</span>
          <span className="px-2 py-[2px] border border-secondary-border text-tertiary-text text-14 rounded-1 w-max">
            {`${currentTableData?.length ? currentTableData.length : "—"} ${t("tokens_suffix")}`}
          </span>
        </div>
      </div>

      <div className="mt-10 flex flex-col lg:flex-row w-full justify-between gap-2 lg:gap-0">
        <h1 className="text-18 lg:text-32 font-medium">{t("balances_title")}</h1>
        <div className="flex gap-3">
          <SearchInput
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t("balances_search_placeholder")}
            className="h-10 md:h-12 bg-primary-bg lg:w-[480px]"
          />
        </div>
      </div>
      {/*  */}

      <div className="mt-5 min-h-[340px] w-full">
        {!loading && activeAddresses.length && currentTableData.length ? (
          <>
            <BalancesDesktopTable
              tableData={currentTableData}
              setTokenForPortfolio={setTokenForPortfolio}
            />
            <BalancesMobileTable
              tableData={currentTableData}
              setTokenForPortfolio={setTokenForPortfolio}
            />
          </>
        ) : Boolean(searchValue) ? (
          <div className="flex flex-col justify-center items-center h-full min-h-[340px] bg-primary-bg rounded-5 gap-1 bg-empty-not-found-token bg-no-repeat bg-right-top max-md:bg-size-180">
            <span className="text-secondary-text">{t("token_not_found")}</span>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center h-full min-h-[340px] bg-primary-bg rounded-5 gap-1 bg-empty-list bg-no-repeat bg-right-top max-md:bg-size-180">
            <span className="text-secondary-text">{t("no_assets")}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-full min-h-[550px]">
            <Preloader type="awaiting" size={48} />
          </div>
        ) : null}
      </div>

      <DrawerDialog isOpen={isTokenInfoOpened} setIsOpen={handleClosTokenInfo}>
        <DialogHeader onClose={handleClosTokenInfo} title={tokenForPortfolio?.name || "Unknown"} />
        {tokenForPortfolio ? (
          <TokenPortfolioDialogContent token={tokenForPortfolio.wrapped} />
        ) : null}
      </DrawerDialog>
    </>
  );
};
