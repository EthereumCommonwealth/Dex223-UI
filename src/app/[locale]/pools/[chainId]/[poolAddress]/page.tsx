"use client";

import Image from "next/image";

import Container from "@/components/atoms/Container";
import Preloader from "@/components/atoms/Preloader";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor, ButtonVariant } from "@/components/buttons/Button";
import SelectedTokensInfo from "@/components/common/SelectedTokensInfo";
import TokensPair from "@/components/common/TokensPair";
import { FEE_AMOUNT_DETAIL } from "@/config/constants/liquidityFee";
import { formatFloat } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import { renderShortAddress } from "@/functions/renderAddress";
import { Link, useRouter } from "@/navigation";

import { usePoolData } from "../../hooks";

const formatNumber = (num: number | string): string => {
  // Convert string to number
  const number = typeof num === "string" ? parseFloat(num) : num;

  // Check if the input is a valid number
  if (isNaN(number)) {
    return number as any;
  }
  if (number >= 1000000000) {
    return (number / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
  } else if (number >= 1000000) {
    return (number / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  } else {
    return formatFloat(number);
  }
};

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

  const { data, loading, ...restData } = usePoolData({
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

  return (
    <Container>
      <div className="w-full md:w-[800px] md:mx-auto md:mt-[40px] mb-5 bg-primary-bg px-4 lg:px-10 pb-4 lg:pb-10 rounded-5">
        <div className="flex justify-between items-center py-1.5 -mx-3">
          <button
            onClick={() => router.push("/pools")}
            className="flex items-center w-12 h-12 justify-center"
          >
            <Svg iconName="back" />
          </button>
          <h2 className="text-18 lg:text-20 font-bold">Stats</h2>
          <div className="w-12"></div>
        </div>

        <div className="bg-tertiary-bg rounded-[12px] p-4 lg:p-5">
          <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
            <div className="flex gap-2 lg:items-center">
              <TokensPair tokenA={pool.token0} tokenB={pool.token1} />
              <span className="text-secondary-text bg-quaternary-bg rounded-20 px-2">
                {`${(FEE_AMOUNT_DETAIL as any)[pool.feeTier as any].label} %`}
              </span>
            </div>
            <a
              target="_blank"
              href={getExplorerLink(ExplorerLinkType.ADDRESS, pool.id, chainId as any)}
              className="w-max"
            >
              <div className="flex items-center gap-1 bg-secondary-bg rounded-[8px] px-2 py-1 text-secondary-text hover:text-primary-text focus:outline-0 focus:text-primary-text">
                <span className="text-12">{renderShortAddress(pool.id)}</span>
                <Svg iconName="forward" size={16} />
              </div>
            </a>
          </div>
          <div className="flex flex-col mt-4 bg-quaternary-bg px-5 py-4 rounded-[12px] gap-3">
            <span className="font-bold">Pool balances</span>
            <div className="flex justify-between">
              <div className="flex gap-2 items-center">
                <Image
                  src="/tokens/placeholder.svg"
                  alt="Ethereum"
                  width={24}
                  height={24}
                  className="h-[32px] w-[32px] md:h-[24px] md:w-[24px]"
                />
                <div className="flex flex-col lg:flex-row lg:gap-2">
                  <span className="text-14 lg:text-16 font-medium text-secondary-text">
                    {pool.token0?.symbol}
                  </span>
                  <span className="text-12 lg:text-16">
                    {formatNumber(pool.token0.totalValueLocked)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <Image
                  src="/tokens/placeholder.svg"
                  alt="Ethereum"
                  width={24}
                  height={24}
                  className="h-[32px] w-[32px] md:h-[24px] md:w-[24px]"
                />
                <div className="flex flex-col lg:flex-row lg:gap-2">
                  <span className="text-14 lg:text-16 font-medium text-secondary-text">
                    {pool.token1?.symbol}
                  </span>
                  <span className="text-12 lg:text-16">
                    {formatNumber(pool.token1.totalValueLocked)}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-green h-2 w-full rounded-[20px] overflow-hidden">
              <div
                className="bg-purple h-2"
                style={{
                  width: `${(Number(pool.token0.totalValueLocked) * 100) / (Number(pool.token0.totalValueLocked) + Number(pool.token1.totalValueLocked))}%`,
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 mt-2 lg:mt-4">
          <Link href={`/swap?tokenA=${pool.token0.id}&tokenB=${pool.token1.id}`} className="w-full">
            <Button colorScheme={ButtonColor.LIGHT_GREEN} fullWidth>
              <span className="flex items-center gap-2">
                Swap
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
                Add liquidity
                <Svg iconName="add" />
              </span>
            </Button>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row w-full justify-between gap-2 lg:gap-4 mt-4">
          <div className="flex flex-col gap-1 bg-tertiary-bg rounded-[12px] p-4 w-full">
            <span className="text-secondary-text text-14 lg:text-16">TVL</span>
            <span className="text-20 lg:text-24 font-medium">{`$${formatFloat(pool.totalValueLockedUSD)}`}</span>
          </div>
          <div className="flex flex-col gap-1 bg-tertiary-bg rounded-[12px] p-4 w-full">
            <span className="text-secondary-text text-14 lg:text-16">24H volume</span>
            <span className="text-20 lg:text-24 font-medium">{`$${formatFloat(pool.poolDayData?.[0]?.volumeUSD || 0)}`}</span>
          </div>
          <div className="flex flex-col gap-1 bg-tertiary-bg rounded-[12px] p-4 w-full">
            <span className="text-secondary-text text-14 lg:text-16">24H fees</span>
            <span className="text-20 lg:text-24 font-medium">{`$${formatFloat(pool.poolDayData?.[0]?.feesUSD || 0)}`}</span>
          </div>
        </div>
      </div>
      <div className="lg:w-[800px] lg:mx-auto lg:mb-[40px] gap-5 flex flex-col">
        <SelectedTokensInfo
          tokenA={{ ...pool.token0, address0: pool.token0.id, address1: pool.token0.addressERC223 }}
          tokenB={{ ...pool.token1, address0: pool.token1.id, address1: pool.token1.addressERC223 }}
        />
      </div>
    </Container>
  );
}
