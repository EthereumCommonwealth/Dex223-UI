"use client";
import "react-loading-skeleton/dist/skeleton.css";

import Skeleton from "@repo/ui/skeleton";
import Tooltip from "@repo/ui/tooltip";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { SkeletonTheme } from "react-loading-skeleton";

import { SearchInput } from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonSize } from "@/components/buttons/Button";
import { Link } from "@/i18n/routing";

import { useActiveWalletsPositions } from "../../stores/positions.hooks";
import { WalletPositions } from "../../stores/useWalletsPosotions";
import {
  LiquidityPositionsDesktopTable,
  LiquidityPositionsMobileTable,
} from "./LiquidityPositionsTabe";

export const LiquidityPositions = ({
  addressSearch,
  setAddressSearch,
}: {
  addressSearch: string;
  setAddressSearch: (value: string) => void;
}) => {
  const t = useTranslations("Portfolio");
  const [searchValue, setSearchValue] = useState("");

  // const loading = true;
  const { loading, positions: walletsPositions } = useActiveWalletsPositions({
    searchValue: addressSearch,
    setSearchValue: setAddressSearch,
  });

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
      <div className="mt-5 grid lg:grid-cols-2 gap-5">
        <div className="flex items-center justify-between bg-gradient-card-blue-light-fill rounded-3 px-4 md:px-5 py-2.5 md:py-3 lg:px-5 lg:py-6 w-full relative overflow-hidden">
          <div className="flex flex-col ">
            {loading ? (
              <>
                <SkeletonTheme
                  baseColor="#2A3A45"
                  highlightColor="#2E2F2F"
                  borderRadius="20px"
                  enableAnimation={false}
                  // duration={5}
                >
                  <div className="flex items-center gap-1 z-10 mt-0.5">
                    <Skeleton className="w-[240px] h-4" />
                  </div>
                  <div className="flex items-center gap-1 z-10 mt-1.5 mb-1">
                    <Skeleton className="w-[140px] h-8" />
                  </div>
                </SkeletonTheme>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 z-10">
                  <span className="text-14 lg:text-16 text-secondary-text">
                    {t("provided_liq_balance")}
                  </span>
                  <Tooltip iconSize={20} text={t("liquidity_tooltip")} />
                </div>
                <span className="text-24 lg:text-32 font-medium">$ —</span>
              </>
            )}
            <Image
              src="/images/liq-pos-bar.svg"
              alt="Side Icon"
              width={"122"}
              height={"152"}
              className="absolute top-[4px] right-[30px] object-cover z-5"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-10 flex flex-col lg:flex-row w-full justify-between gap-4">
          <SkeletonTheme
            baseColor="#272727"
            highlightColor="#2E2F2F"
            borderRadius="0.5rem"
            enableAnimation={false}
            // duration={5}
          >
            <div className="mr-auto mt-2">
              <SkeletonTheme
                baseColor="#272727"
                highlightColor="#2E2F2F"
                borderRadius="20px"
                enableAnimation={false}
                // duration={5}
              >
                <Skeleton className="w-[285px] h-8" />
              </SkeletonTheme>
            </div>
            <div>
              <Skeleton className="w-full md:w-[219px] h-12" />
            </div>
            <div>
              <Skeleton className="w-full md:w-[480px] h-12" />
            </div>
          </SkeletonTheme>
        </div>
      ) : (
        <div className="mt-10 flex flex-col lg:flex-row w-full justify-between gap-2 lg:gap-0">
          <h1 className="text-18 lg:text-32 font-medium">{t("liquidity_title")}</h1>
          <div className="flex flex-col lg:flex-row gap-3">
            <Link href="/pools/positions" className="w-full lg:w-auto">
              <Button fullWidth mobileSize={ButtonSize.MEDIUM}>
                <span className="flex items-center gap-2 w-max">
                  {t("liquidity_title")}
                  <Svg iconName="forward" />
                </span>
              </Button>
            </Link>

            {currentTableData.length > 0 && (
              <SearchInput
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t("liquidity_search_placeholder")}
                className="h-10 md:h-12 bg-primary-bg lg:w-[480px]"
              />
            )}
          </div>
        </div>
      )}

      <div className="mt-5 min-h-[340px] w-full">
        {/*{loading ? (*/}
        {/*  <div className="flex justify-center items-center h-full min-h-[550px]">*/}
        {/*    <Preloader type="awaiting" size={48} />*/}
        {/*  </div>*/}
        {/*) : */}
        {!!currentTableData.length || loading ? (
          <>
            <LiquidityPositionsDesktopTable tableData={currentTableData} isLoading={loading} />
            <LiquidityPositionsMobileTable tableData={currentTableData} />
          </>
        ) : Boolean(searchValue) ? (
          <div className="flex flex-col justify-center items-center h-full min-h-[340px] bg-primary-bg rounded-5 gap-1 bg-empty-not-found-pools bg-right-top bg-no-repeat max-md:bg-size-180">
            <span className="text-secondary-text">{t("liq_not_found")}</span>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center h-full min-h-[340px] bg-primary-bg rounded-5 gap-1 bg-empty-pool bg-right-top bg-no-repeat max-md:bg-size-180">
            <span className="text-secondary-text">{t("no_liquidity_yet")}</span>
          </div>
        )}
      </div>
    </>
  );
};
