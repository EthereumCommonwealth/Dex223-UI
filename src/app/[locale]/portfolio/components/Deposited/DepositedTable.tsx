"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import React from "react";
import { Address, formatUnits } from "viem";
import { useAccount } from "wagmi";

import { TableData } from "@/app/[locale]/portfolio/components/Deposited/DepositedWithdrawTable";
import ExternalTextLink from "@/components/atoms/ExternalTextLink";
import Badge from "@/components/badges/Badge";
import Button, { ButtonColor, ButtonSize, ButtonVariant } from "@/components/buttons/Button";
import { formatNumber } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";

import { WalletDeposite } from "../../stores/useWalletsDeposites";

const DepositedTokenTableItem = ({
  deposite,
  walletAddresses,
  onDetailsClick,
  onWithdrawDetailsClick,
  setIsWithdrawDetailsOpened,
  isOdd,
}: {
  deposite: WalletDeposite;
  walletAddresses: Address[];
  onDetailsClick: () => void;
  onWithdrawDetailsClick: () => void;
  setIsWithdrawDetailsOpened: (isOpened: boolean) => void;
  isOdd: boolean;
}) => {
  const chainId = useCurrentChainId();
  const { address } = useAccount();

  return (
    <>
      <div
        className={clsx(
          "h-[56px] flex justify-start items-center gap-2 pl-5 rounded-l-3",
          isOdd ? "bg-tertiary-bg" : "",
        )}
      >
        <div className="flex gap-2">
          <Image src="/images/tokens/placeholder.svg" width={24} height={24} alt="" />
          <span>{`${deposite.token.name}`}</span>
        </div>
        <div
          className="px-2 py-1 text-16 text-secondary-text bg-quaternary-bg rounded-2 flex justify-center items-center hocus:bg-green-bg cursor-pointer duration-200"
          onClick={() => {
            onDetailsClick();
          }}
        >
          {deposite.token.symbol}
        </div>
      </div>

      <div className={clsx("h-[56px] flex items-center", isOdd ? "bg-tertiary-bg" : "")}>
        {`${formatNumber(formatUnits(deposite.approved, deposite.token.decimals), 8)} ${deposite.token.symbol}`}
      </div>
      <div className={clsx("h-[56px] flex items-center", isOdd ? "bg-tertiary-bg" : "")}>
        {`${formatNumber(formatUnits(deposite.deposited, deposite.token.decimals), 8)} ${deposite.token.symbol}`}
      </div>
      <div className={clsx("h-[56px] flex items-center", isOdd ? "bg-tertiary-bg" : "")}>$ —</div>
      <div
        className={clsx(
          "h-[56px] flex pr-5 rounded-r-3 flex-col justify-center",
          isOdd ? "bg-tertiary-bg" : "",
        )}
      >
        {address === walletAddresses[0] ? ( // TODO upgrade to use more addresses
          <Button
            variant={ButtonVariant.CONTAINED}
            size={ButtonSize.MEDIUM}
            onClick={() => {
              onWithdrawDetailsClick();
              setIsWithdrawDetailsOpened(true);
            }}
          >
            Details
          </Button>
        ) : (
          <>
            <span className="text-14 text-secondary-text">Token owner</span>
            <ExternalTextLink
              text={truncateMiddle(walletAddresses[0] || "", {
                charsFromStart: 5,
                charsFromEnd: 3,
              })}
              href={getExplorerLink(ExplorerLinkType.ADDRESS, walletAddresses[0], chainId)}
            />
          </>
        )}
      </div>
    </>
  );
};

export const DesktopTable = ({
  tableData,
  setTokenForPortfolio,
  setTokenForWithdraw,
  setIsWithdrawDetailsOpened,
}: {
  tableData: TableData;
  setTokenForPortfolio: any;
  setTokenForWithdraw: any;
  setIsWithdrawDetailsOpened: (isOpened: boolean) => void;
}) => {
  let line = -1;

  return (
    <div className="hidden lg:grid pr-5 pl-5 rounded-5 overflow-hidden bg-table-gradient grid-cols-[minmax(50px,2.67fr),_minmax(60px,1.33fr),_minmax(60px,1.33fr),_minmax(50px,1.33fr),_minmax(60px,1.33fr)] pb-2 relative">
      <div className="text-secondary-text pl-5 h-[60px] flex items-center">Token</div>
      <div className="text-secondary-text h-[60px] flex items-center gap-2">
        Approved <Badge color="green" text="ERC-20" />
      </div>
      <div className="text-secondary-text h-[60px] flex items-center gap-2">
        Deposited <Badge color="green" text="ERC-223" />
      </div>
      <div className="text-secondary-text h-[60px] flex items-center">Total Amount, $</div>
      <div className="text-secondary-text pr-5 h-[60px] flex items-center">Action / Owner</div>
      {tableData.map((deposite) => {
        line++;
        return (
          <DepositedTokenTableItem
            key={`${deposite.walletAddresses[0]}_${deposite.contractAddress}_${deposite.token.address0}`}
            deposite={deposite}
            isOdd={line % 2 === 1}
            walletAddresses={deposite.walletAddresses}
            onWithdrawDetailsClick={() => {
              setTokenForWithdraw(deposite);
            }}
            onDetailsClick={() => {
              setTokenForPortfolio(deposite.token);
            }}
            setIsWithdrawDetailsOpened={setIsWithdrawDetailsOpened}
          />
        );
      })}
    </div>
  );
};

const DepositedTokenMobileTableItem = ({
  deposite,
  walletAddress,
  onDetailsClick,
  onWithdrawDetailsClick,
  setIsWithdrawDetailsOpened,
}: {
  deposite: WalletDeposite;
  walletAddress: Address;
  onDetailsClick: () => void;
  onWithdrawDetailsClick: () => void;
  setIsWithdrawDetailsOpened: (isOpened: boolean) => void;
}) => {
  const chainId = useCurrentChainId();
  const { address } = useAccount();

  // @ts-ignore
  return (
    <>
      <div
        className="flex flex-col bg-primary-bg p-4 rounded-3 gap-2"
        key={deposite.token.address0}
      >
        <div className="flex justify-start items-start gap-1">
          <div className="flex gap-2">
            <Image src={"/images/tokens/placeholder.svg"} width={32} height={32} alt="" />
            <div className="flex flex-col">
              <span className="text-14">{`${deposite.token.name}`}</span>
              <span className="text-12">{"$ —"}</span>
            </div>
          </div>
          <div
            className="px-2 py-[2px] text-14 text-secondary-text bg-quaternary-bg rounded-1 flex justify-center items-center hocus:bg-green-bg cursor-pointer duration-200"
            onClick={() => {
              onDetailsClick();
            }}
          >
            {deposite.token.symbol}
          </div>
        </div>
        <div className="flex gap-1 items-center">
          <div className="flex gap-2 w-1/2">
            <Badge color="green" text="ERC-20" />
            <span className="text-12 text-secondary-text">
              {`${formatNumber(formatUnits(deposite.approved, deposite.token.decimals), 6)} ${truncateMiddle(
                deposite.token.symbol || "",
                {
                  charsFromStart: 3,
                  charsFromEnd: 3,
                },
              )}`}
            </span>
          </div>
          <div className="flex gap-2">
            <Badge color="green" text="ERC-223" />
            <span className="text-12 text-secondary-text">
              {`${formatNumber(formatUnits(deposite.deposited, deposite.token.decimals), 6)} ${truncateMiddle(
                deposite.token.symbol || "",
                {
                  charsFromStart: 3,
                  charsFromEnd: 3,
                },
              )}`}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-center mt-1">
          {address === walletAddress ? (
            <Button
              variant={ButtonVariant.CONTAINED}
              colorScheme={ButtonColor.LIGHT_GREEN}
              size={ButtonSize.MEDIUM}
              onClick={() => {
                onWithdrawDetailsClick();
                setIsWithdrawDetailsOpened(true);
              }}
            >
              Details
            </Button>
          ) : (
            <div className="flex justify-between items-center bg-tertiary-bg px-4 py-[10px] rounded-2">
              <span className="text-14 text-secondary-text">Token owner</span>
              <ExternalTextLink
                className="text-14"
                text={truncateMiddle(walletAddress || "", { charsFromStart: 5, charsFromEnd: 3 })}
                href={getExplorerLink(ExplorerLinkType.ADDRESS, walletAddress, chainId)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const MobileTable = ({
  tableData,
  setTokenForPortfolio,
  setTokenForWithdraw,
  setIsWithdrawDetailsOpened,
}: {
  tableData: TableData;
  setTokenForPortfolio: any;
  setTokenForWithdraw: any;
  setIsWithdrawDetailsOpened: (isOpened: boolean) => void;
}) => {
  return (
    <div className="flex lg:hidden flex-col gap-4">
      {tableData.map((deposite, index: number) => {
        return (
          <DepositedTokenMobileTableItem
            key={`${deposite.walletAddresses[0]}_${deposite.contractAddress}_${deposite.token.address0}`}
            deposite={deposite}
            walletAddress={deposite.walletAddresses[0]}
            onWithdrawDetailsClick={() => {
              setTokenForWithdraw(deposite);
            }}
            onDetailsClick={() => {
              setTokenForPortfolio(deposite.token);
            }}
            setIsWithdrawDetailsOpened={setIsWithdrawDetailsOpened}
          />
        );
      })}
    </div>
  );
};
