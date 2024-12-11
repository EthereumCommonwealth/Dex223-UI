"use client";

import clsx from "clsx";
import Image from "next/image";
import React from "react";

import Badge from "@/components/badges/Badge";
import { formatNumberKilos } from "@/functions/formatFloat";
import { Currency } from "@/sdk_hybrid/entities/currency";

export const BalancesDesktopTable = ({
  tableData,
  setTokenForPortfolio,
}: {
  tableData: any;
  setTokenForPortfolio: (currency: Currency | null) => void;
}) => {
  return (
    <div className="hidden lg:grid pr-5 pl-5 pb-5 rounded-5 overflow-hidden bg-table-gradient grid-cols-[minmax(50px,2.67fr),_minmax(87px,1.33fr),_minmax(55px,1.33fr),_minmax(50px,1.33fr)] relative">
      <div className="text-tertiary-text pl-5 h-[60px] flex items-center">Token</div>
      <div className="text-tertiary-text h-[60px] flex items-center gap-2">
        Amount <Badge color="green" text="ERC-20" />
      </div>
      <div className="text-tertiary-text h-[60px] flex items-center gap-2">
        Amount <Badge color="green" text="ERC-223" />
      </div>
      <div className="text-tertiary-text h-[60px] flex items-center">Amount, $</div>
      {tableData.map((o: any, index: number) => {
        const key = o?.token?.address0 ? o.token.address0 : `item-${index}`;

        return (
          <React.Fragment key={key}>
            <div
              className={clsx(
                "h-[56px] flex text-secondary-text items-center gap-2 pl-5 rounded-l-3",
                index % 2 !== 0 && "bg-tertiary-bg",
              )}
            >
              <div className="flex gap-2">
                <Image
                  src={o.logoURI || "/images/tokens/placeholder.svg"}
                  width={24}
                  height={24}
                  alt=""
                />
                <span>{`${o.name}`}</span>
              </div>
              <div
                className="px-2 py-1 text-16  bg-quaternary-bg rounded-2 flex justify-center items-center hocus:bg-green-bg cursor-pointer duration-200"
                onClick={() => {
                  setTokenForPortfolio(o.token);
                }}
              >
                {o.token.symbol}
              </div>
            </div>
            <div
              className={clsx("h-[56px] flex items-center", index % 2 !== 0 && "bg-tertiary-bg")}
            >
              {`${formatNumberKilos(parseFloat(o.amountERC20))} ${o.token.symbol}`}
            </div>
            <div
              className={clsx("h-[56px] flex items-center", index % 2 !== 0 && "bg-tertiary-bg")}
            >
              {`${formatNumberKilos(parseFloat(o.amountERC223))} ${o.token.symbol}`}
            </div>
            <div
              className={clsx(
                "h-[56px] flex text-secondary-text items-center",
                index % 2 !== 0 && "bg-tertiary-bg",
              )}
            >
              {o.amountFiat}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const BalancesMobileTable = ({
  tableData,
  setTokenForPortfolio,
}: {
  tableData: any;
  setTokenForPortfolio: (currency: Currency | null) => void;
}) => {
  return (
    <div className="flex lg:hidden flex-col gap-4">
      {tableData.map((o: any, index: number) => {
        const key = o?.token?.address0 ? o.token.address0 : `item-${index}`;

        return (
          <div className="flex flex-col bg-primary-bg p-4 rounded-3 gap-2" key={key}>
            <div className="flex justify-start items-start gap-1">
              <div className="flex gap-2">
                <Image
                  src={o.logoURI || "/images/tokens/placeholder.svg"}
                  width={32}
                  height={32}
                  alt=""
                />
                <div className="flex flex-col">
                  <span className="text-14">{`${o.name}`}</span>
                  <span className="text-12">{`${o.amountFiat}`}</span>
                </div>
              </div>
              <div
                className="px-2 py-[2px] text-14 text-secondary-text bg-quaternary-bg rounded-1 flex justify-center items-center"
                onClick={() => {
                  setTokenForPortfolio(o.token);
                }}
              >
                {o.token.symbol}
              </div>
            </div>
            <div className="flex justify-between">
              <div className="flex gap-1 items-center">
                <Badge color="green" text="ERC-20" />
                <span className="text-12 text-secondary-text">{o.amountERC20}</span>
              </div>
              <div className="flex gap-1 items-center">
                <Badge color="green" text="ERC-223" />
                <span className="text-12 text-secondary-text">{o.amountERC223}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
