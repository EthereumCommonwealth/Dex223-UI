"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useCallback, useState } from "react";

import Container from "@/components/atoms/Container";
import { SearchInput } from "@/components/atoms/Input";
import SelectButton from "@/components/atoms/SelectButton";
import Svg from "@/components/atoms/Svg";
import TabButton from "@/components/buttons/TabButton";
import PickTokenDialog from "@/components/dialogs/PickTokenDialog";
import { useRouter } from "@/i18n/routing";
import { Currency } from "@/sdk_hybrid/entities/currency";

import PoolsTable from "./PoolsTable";

export default function PoolsPage() {
  const [isOpenedTokenPick, setIsOpenedTokenPick] = useState(false);
  const t = useTranslations("Liquidity");

  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState<Currency | null>(null);

  const [currentlyPicking, setCurrentlyPicking] = useState<"tokenA" | "tokenB">("tokenA");
  const [tokenA, setTokenA] = useState<Currency>();
  const [tokenB, setTokenB] = useState<Currency>();
  const handlePick = useCallback(
    (token?: Currency, tokenPicking?: "tokenA" | "tokenB") => {
      const currentlyPickingToken = tokenPicking || currentlyPicking;
      if (currentlyPickingToken === "tokenA") {
        if (!token) {
          setTokenA(undefined);
        } else {
          if (token === tokenB) {
            setTokenB(tokenA);
          }

          setTokenA(token);
        }
      }

      if (currentlyPickingToken === "tokenB") {
        if (!token) {
          setTokenB(undefined);
        } else {
          if (token === tokenA) {
            setTokenA(tokenB);
          }
          setTokenB(token);
        }
      }

      setIsOpenedTokenPick(false);
    },
    [currentlyPicking, setTokenA, setTokenB, tokenA, tokenB, setIsOpenedTokenPick],
  );

  return (
    <Container>
      <div className="p-4 lg:p-10 flex flex-col items-center">
        <div className="flex flex-col lg:flex-row w-full justify-between items-center mb-6 gap-2">
          <div className="w-full lg:w-[384px] grid grid-cols-2 bg-primary-bg p-1 gap-1 rounded-3">
            <TabButton inactiveBackground="bg-secondary-bg" size={48} active>
              Pools
            </TabButton>
            <TabButton
              inactiveBackground="bg-secondary-bg"
              size={48}
              active={false}
              onClick={() => router.push("/pools/positions")}
            >
              Liquidity positions
            </TabButton>
          </div>
          <div className="flex w-full lg:w-auto gap-2 items-center ml-auto">
            <SelectButton
              fullWidth
              onClick={() => {
                setCurrentlyPicking("tokenA");
                setIsOpenedTokenPick(true);
                setSelectedToken(tokenA || null);
              }}
              size="medium"
              withArrow={!tokenA}
            >
              {tokenA ? (
                <span className="flex gap-2 items-center">
                  <Image
                    className="flex-shrink-0 hidden md:block"
                    src={tokenA?.logoURI || "/images/tokens/placeholder.svg"}
                    alt="Ethereum"
                    width={24}
                    height={24}
                  />
                  <Image
                    className="flex-shrink-0 block md:hidden"
                    src={tokenA?.logoURI || "/images/tokens/placeholder.svg"}
                    alt="Ethereum"
                    width={24}
                    height={24}
                  />
                  <span className="block overflow-ellipsis whitespace-nowrap w-[84px] md:w-[141px] overflow-hidden text-left">
                    {tokenA.symbol}
                  </span>
                  <Svg
                    className="flex-shrink-0"
                    iconName="close"
                    size={20}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePick(undefined, "tokenA");
                    }}
                  />
                </span>
              ) : (
                <span className="text-tertiary-text">{t("select_token")}</span>
              )}
            </SelectButton>
            <span>—</span>
            <SelectButton
              fullWidth
              onClick={() => {
                setCurrentlyPicking("tokenB");
                setIsOpenedTokenPick(true);
                setSelectedToken(tokenB || null);
              }}
              size="medium"
              withArrow={!tokenB}
            >
              {tokenB ? (
                <span className="flex gap-2 items-center">
                  <Image
                    className="flex-shrink-0 hidden md:block"
                    src={tokenB?.logoURI || "/images/tokens/placeholder.svg"}
                    alt="Ethereum"
                    width={24}
                    height={24}
                  />
                  <Image
                    className="flex-shrink-0 block md:hidden"
                    src={tokenB?.logoURI || "/images/tokens/placeholder.svg"}
                    alt="Ethereum"
                    width={24}
                    height={24}
                  />
                  <span className="block overflow-ellipsis whitespace-nowrap w-[84px] md:w-[141px] overflow-hidden text-left">
                    {tokenB.symbol}
                  </span>
                  <Svg
                    className="flex-shrink-0"
                    iconName="close"
                    size={20}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePick(undefined, "tokenB");
                    }}
                  />
                </span>
              ) : (
                <span className="text-tertiary-text">{t("select_token")}</span>
              )}
            </SelectButton>
          </div>
          <div className="md:w-[300px] w-full">
            <SearchInput
              placeholder={t("pools_search_placeholder")}
              className="bg-primary-bg"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
            />
          </div>
        </div>
        <PoolsTable
          filter={{
            token0Address: tokenA?.wrapped.address0,
            token1Address: tokenB?.wrapped.address0,
            searchString: searchQuery,
          }}
        />
      </div>
      <PickTokenDialog
        prevToken={selectedToken}
        handlePick={handlePick}
        isOpen={isOpenedTokenPick}
        setIsOpen={setIsOpenedTokenPick}
        simpleForm={true}
      />
    </Container>
  );
}
