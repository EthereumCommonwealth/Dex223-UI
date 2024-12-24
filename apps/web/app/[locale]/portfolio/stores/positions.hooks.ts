import { multicall } from "@wagmi/core";
import { useEffect, useState } from "react";
import { Address } from "viem";

import { NONFUNGIBLE_POSITION_MANAGER_ABI } from "@/config/abis/nonfungiblePositionManager";
import { config } from "@/config/wagmi/config";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { PositionInfo } from "@/hooks/usePositions";
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESS } from "@/sdk_hybrid/addresses";
import { DexChainId } from "@/sdk_hybrid/chains";

import { useActiveAddresses } from "./hooks";
import { useWalletsPosotions } from "./useWalletsPosotions";

type PositionsCount = {
  address: Address;
  positionsCount: bigint;
  tokenIdRequests: [Address, number][];
}[];
const getAmoutOfPositions = async ({
  chainId,
  addresses,
}: {
  addresses: Address[];
  chainId: DexChainId;
}) => {
  const calls = [
    ...addresses.map((address) => ({
      address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId],
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: "balanceOf",
      args: [address],
    })),
  ];

  const result = await multicall(config, {
    contracts: calls,
  });

  const positionsCount: PositionsCount = result
    .map(({ result, status }, index) => {
      const balance = status === "success" ? (result as bigint) : BigInt(0);
      const address = addresses[index];
      if (!address) return undefined as any;

      const tokenIdRequests = [] as [Address, number][];
      for (let i = 0; i < Number(balance); i++) {
        tokenIdRequests.push([address, i]);
      }

      return {
        address,
        positionsCount: balance,
        tokenIdRequests,
      };
    })
    .filter((p) => !!p);

  return {
    positionsCount,
  };
};

type TokenIds = {
  address: `0x${string}`;
  tokenIds: bigint[];
}[];

const getTokenIds = async ({
  positionsCount,
  chainId,
}: {
  positionsCount: PositionsCount;
  chainId: DexChainId;
}) => {
  if (!positionsCount?.length) return { tokenIds: [] };

  const requests = positionsCount.map(({ address, tokenIdRequests }) => {
    const calls = [
      ...tokenIdRequests.map((tokenIdArgs) => ({
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId],
        functionName: "tokenOfOwnerByIndex",
        args: tokenIdArgs,
      })),
    ];

    return multicall(config, { contracts: calls });
  });

  const results = await Promise.all(requests);

  const tokenIds: TokenIds = results.map((result, index) => {
    return {
      address: positionsCount[index].address,
      tokenIds: result
        .filter((value) => !!value.result && typeof value.result === "bigint")
        .map((value) => value.result as bigint),
    };
  });

  return { tokenIds };
};

export const getPositionInfos = async ({
  tokenIds,
  chainId,
}: {
  tokenIds: TokenIds;
  chainId: DexChainId;
}) => {
  const requests = tokenIds.map(({ tokenIds }) => {
    const calls = [
      ...tokenIds.map((tokenId) => ({
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId],
        functionName: "positions",
        args: [tokenId],
      })),
    ];

    return multicall(config, { contracts: calls });
  });

  const results = await Promise.all(requests);

  const positions = results.map((result, index) => {
    return {
      address: tokenIds[index].address,
      positions: result
        .map(({ result, status }, positionIndex) => {
          if (status !== "success") return undefined as any;
          const [
            nonce,
            operator,
            token0,
            token1,
            tier,
            tickLower,
            tickUpper,
            liquidity,
            feeGrowthInside0LastX128,
            feeGrowthInside1LastX128,
            tokensOwed0,
            tokensOwed1,
          ] = result as any;

          const positionInfo: PositionInfo = {
            token0,
            token1,
            tier,
            tickLower,
            tickUpper,
            liquidity,
            tokenId: tokenIds[index].tokenIds[positionIndex],
            feeGrowthInside0LastX128,
            feeGrowthInside1LastX128,
            nonce,
            operator,
            tokensOwed0,
            tokensOwed1,
          };

          return positionInfo;
        })
        .filter((positionInfo) => !!positionInfo),
    };
  });

  return {
    positions,
  };
};

export const useActiveWalletsPositions = () => {
  const { activeAddresses } = useActiveAddresses();
  const chainId = useCurrentChainId();
  const { positions, setAllPositions } = useWalletsPosotions();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const { positionsCount } = await getAmoutOfPositions({
          addresses: activeAddresses,
          chainId: chainId,
        });
        const { tokenIds } = await getTokenIds({
          positionsCount,
          chainId,
        });

        const { positions } = await getPositionInfos({
          tokenIds,
          chainId,
        });

        setAllPositions(positions);

        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    })();
  }, [activeAddresses, setAllPositions, chainId]);

  return { positions: positions, loading: isLoading };
};
