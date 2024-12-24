"use client";

import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useCallback, useState } from "react";

import { SearchInput } from "@/components/atoms/Input";
import Preloader from "@/components/atoms/Preloader";
import Svg from "@/components/atoms/Svg";
import Tooltip from "@/components/atoms/Tooltip";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import addToast from "@/other/toast";

export const MarginPositions = () => {
  const t = useTranslations("Portfolio");
  const [searchValue, setSearchValue] = useState("");

  const [marginBalance, setMarginBalance] = useState<number>(0);
  const [marginPositions, setMarginPositions] = useState<any[]>([]);

  const handleButton = useCallback(async () => {
    try {
      addToast("Margin positions page under construction", "info");
    } catch (e) {
      // addToast("Clipboard API not supported", "error");
    }
  }, []);

  const loading = false;

  const currentTableData = [] as any[];
  return (
    <>
      <div className="mt-5 flex gap-5">
        <div className="flex items-center justify-between bg-gradient-card-blue-light-fill rounded-3 px-4 md:px-5 py-2.5 md:py-3 lg:px-5 lg:py-6 w-full lg:w-[50%] relative overflow-hidden">
          <div className="flex flex-col z-20">
            <div className="flex items-center gap-1">
              <span className="text-14 lg:text-16 text-secondary-text">{t("margin_balance")}</span>
              <Tooltip iconSize={20} text="Info text" />
            </div>
            <span className="text-24 lg:text-32 font-medium">{`$ ${marginBalance > 0 ? marginBalance : "—"}`}</span>
          </div>
          <Image
            src="/images/portfolio-bars.svg"
            alt="Side Icon"
            width={"180"}
            height={"120"}
            className="absolute top-0 right-0 z-10"
          />
          {!!marginBalance && (
            <Button
              colorScheme={ButtonColor.LIGHT_GREEN}
              mobileSize={ButtonSize.MEDIUM}
              className="px-4 lg:px-6 z-20 border border-green"
            >
              {t("withdraw_button")}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-col lg:flex-row w-full justify-between gap-2 lg:gap-0">
        <h1 className="text-18 lg:text-32 font-medium">{t("margin_title")}</h1>
        <div className="flex flex-col lg:flex-row gap-3">
          <Button onClick={() => handleButton()} mobileSize={ButtonSize.MEDIUM}>
            <span className="flex items-center gap-2 w-max">
              {t("margin_title")}
              <Svg iconName="forward" />
            </span>
          </Button>

          {marginPositions.length > 0 && (
            <SearchInput
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t("margin_search_placeholder")}
              className="h-10 md:h-12 bg-primary-bg lg:w-[480px]"
            />
          )}
        </div>
      </div>
      {/*  */}

      <div className="mt-5 min-h-[340px] w-full">
        {!loading && currentTableData.length ? (
          <div className="pr-5 pl-5 grid rounded-5 overflow-hidden bg-table-gradient grid-cols-[minmax(50px,2.67fr),_minmax(87px,1.33fr),_minmax(55px,1.33fr),_minmax(50px,1.33fr),_minmax(50px,1.33fr)] pb-2 relative">
            <div className="pl-5 h-[60px] flex items-center">ID</div>
            <div className="h-[60px] flex items-center">Amount, $</div>
            <div className="h-[60px] flex items-center gap-2">Assets</div>
            <div className="pr-5 h-[60px] flex items-center justify-end">Action / Owner</div>
            {loading ? (
              <div className="flex justify-center items-center h-full min-h-[550px]">
                <Preloader type="awaiting" size={48} />
              </div>
            ) : (
              currentTableData.map((o: any, index: number) => {
                return (
                  <>
                    <div
                      className={clsx(
                        "h-[56px] flex items-center gap-2 pl-5 rounded-l-3",
                        index % 2 !== 0 && "bg-tertiary-bg",
                      )}
                    >
                      <Image src="/images/tokens/placeholder.svg" width={24} height={24} alt="" />
                      <span>{`${o.name}`}</span>
                    </div>
                    <div
                      className={clsx(
                        "h-[56px] flex items-center",
                        index % 2 !== 0 && "bg-tertiary-bg",
                      )}
                    >
                      {o.amountERC20}
                    </div>
                    <div
                      className={clsx(
                        "h-[56px] flex items-center",
                        index % 2 !== 0 && "bg-tertiary-bg",
                      )}
                    >
                      {o.amountERC223}
                    </div>
                    <div
                      className={clsx(
                        "h-[56px] flex items-center",
                        index % 2 !== 0 && "bg-tertiary-bg",
                      )}
                    >
                      {o.amountFiat}
                    </div>
                    <div
                      className={clsx(
                        "h-[56px] flex items-center justify-end pr-5 rounded-r-3",
                        index % 2 !== 0 && "bg-tertiary-bg",
                      )}
                    >
                      <Svg iconName="list" />
                    </div>
                  </>
                );
              })
            )}
          </div>
        ) : Boolean(searchValue) ? (
          <div className="flex flex-col justify-center items-center h-full min-h-[340px] bg-primary-bg rounded-5 gap-1 bg-empty-not-found-margin-position bg-no-repeat bg-right-top max-md:bg-size-180">
            <span className="text-secondary-text">{t("margins_not_found")}</span>
          </div>
        ) : (
          <>
            <div className="relative flex justify-center items-center h-full min-h-[340px] bg-primary-bg rounded-5 bg-empty-no-margin-positions bg-no-repeat bg-right-top max-md:bg-size-180">
              <div className="flex flex-col items-center">
                <span className="text-secondary-text">{t("no_margins")}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
