"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import React from "react";

import Container from "@/components/atoms/Container";
import Preloader from "@/components/atoms/Preloader";
import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonColor } from "@/components/buttons/Button";
import IconButton, {
  IconButtonSize,
  IconButtonVariant,
  IconSize,
} from "@/components/buttons/IconButton";
import SelectedTokensInfo from "@/components/common/SelectedTokensInfo";
import TokensPair from "@/components/common/TokensPair";
import { FEE_AMOUNT_DETAIL } from "@/config/constants/liquidityFee";
import { formatNumberKilos } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import { renderShortAddress } from "@/functions/renderAddress";
import { useTokens } from "@/hooks/useTokenLists";
import { Link, useRouter } from "@/i18n/routing";

import { usePoolData } from "../../hooks";

export default function ExplorePoolPage({
  params,
}: {
  params: {
    chainId: string;
    poolAddress: string;
  };
}) {
  const { chainId, poolAddress } = params;
  const router = useRouter();
  const t = useTranslations("Liquidity");
  const tn = useTranslations("Navigation");

  const tokens = useTokens();

  const { data, loading } = usePoolData({
    chainId,
    poolAddress,
  } as any);

  if (!data?.pool || loading)
    return (
      <Container>
        <div className="flex justify-center items-center w-full h-[70dvh]">
          <Preloader type="awaiting" size={48} />
        </div>
      </Container>
    );

  const { pool } = data;
  const tokenA = tokens.find((t) => t.wrapped.address0.toLowerCase() === pool.token0.id);
  const tokenB = tokens.find((t) => t.wrapped.address0.toLowerCase() === pool.token1.id);

  const valuePercent =
    (Number(pool.token0.totalValueLocked) * 100) /
    (Number(pool.token0.totalValueLocked) + Number(pool.token1.totalValueLocked));

  return (
    <Container>
      <div className="w-full md:w-[800px] md:mx-auto md:mt-[40px] mb-5 bg-primary-bg px-4 lg:px-10 pb-4 lg:pb-10 rounded-5">
        {/* First line:  Icons | Tokens | Badge | Link */}
        <div className="flex justify-between items-center py-1.5 -mx-3">
          <IconButton
            variant={IconButtonVariant.BACK}
            iconSize={IconSize.REGULAR}
            buttonSize={IconButtonSize.LARGE}
            onClick={() => router.push("/pools")}
          />
          <h2 className="text-18 lg:text-20 font-bold">{t("stats_title")}</h2>
          <div className="w-12"></div>
        </div>
        <div className="bg-tertiary-bg rounded-[12px] p-4 lg:p-5">
          <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
            <div className="flex gap-2 items-start lg:items-center">
              <TokensPair tokenA={pool.token0} tokenB={pool.token1} />
              <Badge
                className="mt-1 md:mt-0"
                variant={BadgeVariant.PERCENTAGE}
                percentage={`${(FEE_AMOUNT_DETAIL as any)[pool.feeTier as any].label}%`}
              />
            </div>
            <a
              target="_blank"
              href={getExplorerLink(ExplorerLinkType.ADDRESS, pool.id, chainId as any)}
              className="w-max"
            >
              <div className="flex items-center duration-200 gap-1 bg-quaternary-bg rounded-[8px] px-2 py-0.5 text-secondary-text hocus:text-primary-text hocus:bg-erc-20-bg ">
                <span className="text-14">
                  {renderShortAddress(pool.id.toUpperCase().replace("0X", "0x"))}
                </span>
                <Svg iconName="forward" size={20} />
              </div>
            </a>
          </div>

          {/* Inner line:  Pool balances */}
          <div className="flex flex-col mt-4 bg-quaternary-bg px-5 py-4 rounded-[12px] gap-3">
            <span className="font-bold text-secondary-text">{t("pool_balances_title")}</span>
            <div className="flex justify-between">
              <div className="flex gap-2 items-center">
                <span className="text-12 lg:text-16 font-bold text-primary-text">
                  {formatNumberKilos(pool.token0.totalValueLocked)}
                </span>
                <Image
                  src="/images/tokens/placeholder.svg"
                  alt="Ethereum"
                  width={24}
                  height={24}
                  className="h-[32px] w-[32px] md:h-[24px] md:w-[24px]"
                />
                <div className="flex flex-col lg:flex-row lg:gap-2">
                  <span className="text-14 lg:text-16 font-medium text-secondary-text">
                    {pool.token0?.symbol}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-12 lg:text-16 font-bold text-primary-text">
                  {formatNumberKilos(pool.token1.totalValueLocked)}
                </span>
                <Image
                  src="/images/tokens/placeholder.svg"
                  alt="Ethereum"
                  width={24}
                  height={24}
                  className="h-[32px] w-[32px] md:h-[24px] md:w-[24px]"
                />
                <div className="flex flex-col lg:flex-row lg:gap-2">
                  <span className="text-14 lg:text-16 font-medium text-secondary-text">
                    {pool.token1?.symbol}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-green h-2 w-full rounded-[20px] overflow-hidden">
              <div
                className="bg-purple h-2"
                style={{
                  width: valuePercent < 1 ? `1%` : valuePercent > 99 ? `99%` : `${valuePercent}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Buttons line:  SWAP | Add liquidity */}
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 mt-4 lg:mt-4">
          <Link href={`/swap?tokenA=${pool.token0.id}&tokenB=${pool.token1.id}`} className="w-full">
            <Button colorScheme={ButtonColor.LIGHT_GREEN} fullWidth>
              <span className="flex items-center gap-2">
                {tn("swap")}
                <Svg iconName="swap" />
              </span>
            </Button>
          </Link>
          <Link
            href={`/add?tier=3000&tokenA=${pool.token0.id}&tokenB=${pool.token1.id}`}
            className="w-full"
          >
            <Button fullWidth>
              <span className="flex items-center gap-2">
                {t("add_liquidity_title")}
                <Svg iconName="add" />
              </span>
            </Button>
          </Link>
        </div>

        {/* Last line:  TVL | 24H Volume | 24H Fees */}
        <div className="flex flex-col lg:flex-row w-full justify-between gap-2 lg:gap-3 mt-4">
          <div className="flex flex-col gap-1 bg-tertiary-bg rounded-[12px] p-4 w-full">
            <span className="text-secondary-text text-14 lg:text-16">{t("tvl_title")}</span>
            <span className="text-20 lg:text-24 font-medium">{`$${formatNumberKilos(pool.totalValueLockedUSD)}`}</span>
          </div>
          <div className="flex flex-col gap-1 bg-tertiary-bg rounded-[12px] p-4 w-full">
            <span className="text-secondary-text text-14 lg:text-16">{t("day_volume")}</span>
            <span className="text-20 lg:text-24 font-medium">{`$${formatNumberKilos(pool.poolDayData?.[0]?.volumeUSD || 0)}`}</span>
          </div>
          <div className="flex flex-col gap-1 bg-tertiary-bg rounded-[12px] p-4 w-full">
            <span className="text-secondary-text text-14 lg:text-16">{t("day_fees")}</span>
            <span className="text-20 lg:text-24 font-medium">{`$${formatNumberKilos(pool.poolDayData?.[0]?.feesUSD || 0)}`}</span>
          </div>
        </div>
      </div>
      <div className="lg:w-[800px] lg:mx-auto lg:mb-[40px] gap-5 flex flex-col">
        <SelectedTokensInfo tokenA={tokenA} tokenB={tokenB} />
      </div>
    </Container>
  );
}
