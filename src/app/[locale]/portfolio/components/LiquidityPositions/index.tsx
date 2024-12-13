"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";

import { SearchInput } from "@/components/atoms/Input";
import Preloader from "@/components/atoms/Preloader";
import Svg from "@/components/atoms/Svg";
import Tooltip from "@/components/atoms/Tooltip";
import Button from "@/components/buttons/Button";
import { Link } from "@/i18n/routing";

import { useActiveWalletsPositions } from "../../stores/positions.hooks";
import { WalletPositions } from "../../stores/useWalletsPosotions";
import {
  LiquidityPositionsDesktopTable,
  LiquidityPositionsMobileTable,
} from "./LiquidityPositionsTabe";

export const LiquidityPositions = () => {
  const t = useTranslations("Portfolio");
  const [searchValue, setSearchValue] = useState("");

  const { loading, positions: walletsPositions } = useActiveWalletsPositions();

  const currentTableData: WalletPositions[] = searchValue
    ? walletsPositions
        .map((value) => {
          const positions = value.positions.filter(({ tokenId }) => {
            if (!tokenId) return false;
            return tokenId?.toString() === searchValue;
          });
          if (!positions.length) return undefined as any;
          return {
            ...value,
            positions,
          };
        })
        .filter((value) => !!value)
    : walletsPositions;

  return (
    <>
      <div className="mt-5 flex gap-5">
        <div className="flex items-center justify-between bg-gradient-card-blue-light-fill rounded-3 px-4 py-3 lg:px-5 lg:py-6 w-full lg:w-[50%] relative overflow-hidden">
          <div className="flex flex-col ">
            <div className="flex items-center gap-1">
              <span className="text-14 lg:text-16">Provided liquidity balance</span>
              <Tooltip iconSize={20} text="Info text" />
            </div>
            <span className="text-24 lg:text-32 font-medium">$ —</span>
            <img
              src="/images/liq-pos-bar.svg"
              alt="Side Icon"
              width={"122"}
              height={"152"}
              className="absolute top-[4px] right-[30px] object-cover"
            />
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col lg:flex-row w-full justify-between gap-2 lg:gap-0">
        <h1 className="text-18 lg:text-32 font-medium">{t("liquidity_title")}</h1>
        <div className="flex flex-col lg:flex-row gap-3">
          <Link href="/pools/positions" className="w-full lg:w-auto">
            <Button fullWidth>
              <span className="flex items-center gap-2 w-max">
                Liquidity positions
                <Svg iconName="forward" />
              </span>
            </Button>
          </Link>

          <SearchInput
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t("liquidity_search_placeholder")}
            className="bg-primary-bg lg:w-[480px]"
          />
        </div>
      </div>

      <div className="mt-5 min-h-[640px] mb-5 w-full">
        {loading ? (
          <div className="flex justify-center items-center h-full min-h-[550px]">
            <Preloader type="awaiting" size={48} />
          </div>
        ) : currentTableData.length ? (
          <>
            <LiquidityPositionsDesktopTable tableData={currentTableData} />
            <LiquidityPositionsMobileTable tableData={currentTableData} />
          </>
        ) : Boolean(searchValue) ? (
          <div className="flex flex-col justify-center items-center h-full min-h-[340px] bg-primary-bg rounded-5 gap-1 bg-empty-not-found-pools bg-right-top bg-no-repeat max-md:bg-size-180">
            <span className="text-secondary-text">Positions not found</span>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center h-full min-h-[340px] bg-primary-bg rounded-5 gap-1 bg-empty-pool bg-right-top bg-no-repeat max-md:bg-size-180">
            <span className="text-secondary-text">No liquidity positions yet</span>
          </div>
        )}
      </div>
    </>
  );
};
