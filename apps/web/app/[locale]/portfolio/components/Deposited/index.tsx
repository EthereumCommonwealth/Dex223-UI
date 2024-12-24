"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import React from "react";

import { RevokeDialog } from "@/app/[locale]/add/components/DepositAmounts/RevokeDialog";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import { SearchInput } from "@/components/atoms/Input";
import Preloader from "@/components/atoms/Preloader";
import Tooltip from "@/components/atoms/Tooltip";
import { TokenPortfolioDialogContent } from "@/components/dialogs/TokenPortfolioDialog";
import { useRecentTransactionTracking } from "@/hooks/useRecentTransactionTracking";
import { Token } from "@/sdk_hybrid/entities/token";

import { useActiveWalletsDeposites } from "../../stores/deposites.hooks";
import { DesktopTable, MobileTable } from "./DepositedTable";
import { TableData, WithdrawDesktopTable, WithdrawMobileTable } from "./DepositedWithdrawTable";

const filterTable = ({
  searchValue,
  value: { token },
}: {
  searchValue: string;
  value: {
    token: Token;
  };
}) => {
  if (!searchValue) return true;
  if (token.address0 === searchValue) return true;
  if (token.address1 === searchValue) return true;
  if (token.name?.toLowerCase().includes(searchValue.toLowerCase())) return true;
  return !!token.symbol?.toLowerCase().includes(searchValue.toLowerCase());
};

export const Deposited = () => {
  useRecentTransactionTracking();
  const t = useTranslations("Portfolio");
  const [searchValue, setSearchValue] = useState("");
  const [tokenForPortfolio, setTokenForPortfolio] = useState<Token | null>(null);
  const [tokenForWithdraw, setTokenForWithdraw] = useState<Token | null>(null);
  const isTokenInfoOpened = Boolean(tokenForPortfolio);

  const handleCloseTokenInfo = () => {
    setTokenForPortfolio(null);
  };
  const [isWithdrawDetailsOpened, setIsWithdrawDetailsOpened] = useState(false);
  const { isLoading, deposites } = useActiveWalletsDeposites();

  const currentTableData: TableData = [];

  for (const walletDeposites of deposites) {
    for (const deposite of walletDeposites.deposites) {
      const existingRecord = currentTableData.find(
        (record) => record.token.address0 === deposite.token.address0,
      );

      if (existingRecord) {
        // If a record with the same contractAddress exists, update it
        existingRecord.deposited += deposite.deposited;
        existingRecord.approved += deposite.approved;
        if (!existingRecord.walletAddresses.includes(walletDeposites.address)) {
          existingRecord.walletAddresses.push(walletDeposites.address);
        }
      } else {
        // If no existing record, create a new one
        if (
          filterTable({
            searchValue,
            value: { token: deposite.token },
          })
        ) {
          currentTableData.push({
            contractAddress: deposite.contractAddress,
            walletAddresses: [walletDeposites.address],
            token: deposite.token,
            deposited: deposite.deposited,
            approved: deposite.approved,
          });
        }
      }
    }
  }

  return (
    <>
      <div className="mt-5 flex flex-col lg:flex-row gap-5">
        <div className="flex items-center justify-between bg-gradient-card-blue-light-fill rounded-3 px-4 md:px-5 md:py-3 lg:px-5 py-2.5  lg:py-6 w-full lg:w-[50%] relative overflow-hidden">
          <div className="flex flex-col ">
            <div className="flex items-center gap-1 z-10">
              <span className="text-14 lg:text-16 text-secondary-text">Approved</span>
              <Tooltip iconSize={20} text="Info text" />
            </div>
            <span className="text-24 lg:text-32 font-medium">$ —</span>
            <Image
              src="/images/approved-bar.svg"
              alt="Side Icon"
              width={"134"}
              height={"134"}
              className="absolute top-[17px] right-[23px] object-cover z-5"
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-gradient-card-blue-light-fill rounded-3 px-4 py-2.5  md:py-3 lg:px-5 lg:py-6 w-full lg:w-[50%] relative overflow-hidden">
          <div className="flex flex-col ">
            <div className="flex items-center gap-1 z-10">
              <span className="text-14 lg:text-16 text-secondary-text">Deposited to contract</span>
              <Tooltip iconSize={20} text="Info text" />
            </div>
            <span className="text-24 lg:text-32 font-medium">$ —</span>
            <Image
              src="/images/deposited-bar.svg"
              alt="Side Icon"
              width={"62"}
              height={"171"}
              className="absolute top-[20px] right-[40px] object-cover z-5"
            />
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col lg:flex-row w-full justify-between gap-2 lg:gap-0">
        <h1 className="text-18 lg:text-32 font-medium">{t("deposited_title")}</h1>
        {(currentTableData.length > 0 || searchValue.length > 0) && (
          <div className="flex flex-col lg:flex-row gap-3">
            <SearchInput
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t("balances_search_placeholder")}
              className="bg-primary-bg lg:w-[480px] max-h-10 md:max-h-12"
            />
          </div>
        )}
      </div>
      {/*  */}
      <div className="mt-5 min-h-[340px] w-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-full min-h-[550px]">
            <Preloader type="awaiting" size={48} />
          </div>
        ) : currentTableData.length ? (
          <>
            <DesktopTable
              tableData={currentTableData}
              setTokenForPortfolio={setTokenForPortfolio}
              setTokenForWithdraw={setTokenForWithdraw}
              setIsWithdrawDetailsOpened={setIsWithdrawDetailsOpened}
            />
            <MobileTable
              tableData={currentTableData}
              setTokenForPortfolio={setTokenForPortfolio}
              setTokenForWithdraw={setTokenForWithdraw}
              setIsWithdrawDetailsOpened={setIsWithdrawDetailsOpened}
            />
          </>
        ) : Boolean(searchValue) ? (
          <div className="flex flex-col justify-center items-center h-full min-h-[340px] bg-primary-bg rounded-5 gap-1 bg-empty-not-found-token bg-right-top bg-no-repeat max-md:bg-size-180">
            <span className="text-secondary-text">{t("deposited_not_found")}</span>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center h-full min-h-[340px] bg-primary-bg rounded-5 gap-1 bg-empty-deposited-tokens bg-right-top bg-no-repeat max-md:bg-size-180">
            <span className="text-secondary-text">{t("no_deposited_yet")}</span>
          </div>
        )}
        <DrawerDialog isOpen={isWithdrawDetailsOpened} setIsOpen={setIsWithdrawDetailsOpened}>
          <DialogHeader
            onClose={() => {
              setIsWithdrawDetailsOpened(false);
            }}
            title="Details"
          />
          <div className="px-4 lg:px-10 lg:pb-10 pb-4">
            <WithdrawDesktopTable
              setIsWithdrawDetailsOpened={setIsWithdrawDetailsOpened}
              tableData={currentTableData}
              tokenForWithdraw={tokenForWithdraw}
              setTokenForPortfolio={setTokenForPortfolio}
            />
            <WithdrawMobileTable
              setIsWithdrawDetailsOpened={setIsWithdrawDetailsOpened}
              tableData={currentTableData}
              tokenForWithdraw={tokenForWithdraw}
              setTokenForPortfolio={setTokenForPortfolio}
            />
          </div>
        </DrawerDialog>

        <RevokeDialog />

        <DrawerDialog isOpen={isTokenInfoOpened} setIsOpen={handleCloseTokenInfo}>
          <DialogHeader
            onClose={handleCloseTokenInfo}
            title={tokenForPortfolio?.name || "Unknown"}
          />
          {tokenForPortfolio ? <TokenPortfolioDialogContent token={tokenForPortfolio} /> : null}
        </DrawerDialog>
      </div>
    </>
  );
};
