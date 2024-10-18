import JSBI from "jsbi";
import { useCallback, useMemo, useState } from "react";
import { Address, encodeFunctionData, getAbiItem } from "viem";
import {
  useAccount,
  useBlockNumber,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useSimulateContract,
  useWalletClient,
  useWriteContract,
} from "wagmi";

import { ERC20_ABI } from "@/config/abis/erc20";
import { NONFUNGIBLE_POSITION_MANAGER_ABI } from "@/config/abis/nonfungiblePositionManager";
import { TOKEN_CONVERTER_ABI } from "@/config/abis/tokenConverter";
import { useTokens } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESS } from "@/sdk_hybrid/addresses";
import { CONVERTER_ADDRESS } from "@/sdk_hybrid/addresses";
import { DexChainId } from "@/sdk_hybrid/chains";
import { FeeAmount } from "@/sdk_hybrid/constants";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { CurrencyAmount } from "@/sdk_hybrid/entities/fractions/currencyAmount";
import { Price } from "@/sdk_hybrid/entities/fractions/price";
import { Pool } from "@/sdk_hybrid/entities/pool";
import { Position } from "@/sdk_hybrid/entities/position";
import { Token } from "@/sdk_hybrid/entities/token";
import { Standard } from "@/sdk_hybrid/standard";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

import { AllowanceStatus } from "./useAllowance";
import useCurrentChainId from "./useCurrentChainId";
import { usePool } from "./usePools";

export type PositionInfo = {
  nonce: bigint;
  operator: `0x${string}`;
  token0: `0x${string}`;
  token1: `0x${string}`;
  tier: FeeAmount;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
  tokenId: bigint | undefined;
};

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function usePositionFromTokenId(tokenId: bigint) {
  const { positions, loading } = usePositionsFromTokenIds(tokenId ? [tokenId] : undefined);

  return useMemo(() => {
    return {
      loading,
      position: positions?.[0],
    };
  }, [loading, positions]);
}
export function usePositionsFromTokenIds(tokenIds: bigint[] | undefined) {
  const chainId = useCurrentChainId();
  const positionsContracts = useMemo(() => {
    if (!tokenIds) {
      return [];
    }

    return tokenIds.map((tokenId) => {
      return {
        address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        functionName: "positions",
        args: [tokenId],
      };
    });
  }, [tokenIds, chainId]);

  const { data: positionsData, isLoading: positionsLoading } = useReadContracts({
    contracts: positionsContracts,
  });

  return useMemo(() => {
    return {
      loading: positionsLoading,
      positions: positionsData
        ?.map((pos, i) => {
          if (!pos || pos.error) {
            return undefined;
          }

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
          ] = pos.result as any;
          return {
            token0,
            token1,
            tier,
            tickLower,
            tickUpper,
            liquidity,
            tokenId: tokenIds?.[i],
          };
        })
        .filter((pos) => Boolean(pos)) as PositionInfo[],
    };
  }, [positionsData, positionsLoading, tokenIds]);
}
export default function usePositions() {
  const chainId = useCurrentChainId();
  const { address: account } = useAccount();

  const { data: balance, isLoading: balanceLoading } = useReadContract({
    address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
    abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
    functionName: "balanceOf",
    args: account && [account],
    query: {
      enabled: Boolean(account),
    },
  });

  const tokenIdsArgs = useMemo(() => {
    if (balance && account) {
      const tokenRequests = [];
      for (let i = 0; i < Number(balance); i++) {
        tokenRequests.push([account, i]);
      }
      return tokenRequests;
    }
    return [];
  }, [account, balance]);

  const tokenIdsContracts = useMemo(() => {
    return tokenIdsArgs.map((tokenId) => ({
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: "tokenOfOwnerByIndex",
      args: tokenId,
      address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
    }));
  }, [chainId, tokenIdsArgs]);

  const { data: tokenIdsData, isLoading: tokenIdsLoading } = useReadContracts({
    contracts: tokenIdsContracts,
  });

  const { positions, loading: positionsLoading } = usePositionsFromTokenIds(
    tokenIdsData
      ?.filter((value) => !!value.result && typeof value.result === "bigint")
      .map((value) => value.result as bigint),
  );

  return {
    positions,
    loading: positionsLoading || tokenIdsLoading || balanceLoading,
  };
}

export function usePositionFromPositionInfo(positionDetails: PositionInfo) {
  const chainId = useCurrentChainId();
  const tokens = useTokens();

  const tokenAFromLists = useMemo(() => {
    let tokenStandard: Standard | undefined = undefined;
    const token = tokens.find((t) => {
      if (t.wrapped.address0 === positionDetails?.token0) {
        tokenStandard = Standard.ERC20;
        return true;
      } else if (t.wrapped.address1 === positionDetails?.token0) {
        tokenStandard = Standard.ERC223;
        return true;
      }
    });
    if (token && tokenStandard) return { token, tokenStandard };
  }, [positionDetails?.token0, tokens]);

  const tokenBFromLists = useMemo(() => {
    let tokenStandard: Standard | undefined = undefined;
    const token = tokens.find((t) => {
      if (t.wrapped.address0 === positionDetails?.token1) {
        tokenStandard = Standard.ERC20;
        return true;
      } else if (t.wrapped.address1 === positionDetails?.token1) {
        tokenStandard = Standard.ERC223;
        return true;
      }
    });
    if (token && tokenStandard) return { token, tokenStandard };
  }, [positionDetails?.token1, tokens]);

  // TODO: now we use "Boolean(tokens.length)" but better to add init status to token lists and check it instead
  // Get token info from node only if we don't find token in our lists
  const isTokenADetailsEnabled =
    !tokenAFromLists && Boolean(positionDetails?.token0) && Boolean(tokens.length);
  const isTokenBDetailsEnabled =
    !tokenBFromLists && Boolean(positionDetails?.token1) && Boolean(tokens.length);
  const { data: tokenAInfo }: any = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: CONVERTER_ADDRESS[chainId],
        abi: TOKEN_CONVERTER_ABI,
        functionName: "predictWrapperAddress",
        args: [positionDetails?.token0 as Address, true],
      },
      {
        address: positionDetails?.token0,
        abi: ERC20_ABI,
        functionName: "decimals",
      },
      {
        address: positionDetails?.token0,
        abi: ERC20_ABI,
        functionName: "symbol",
      },
      {
        address: positionDetails?.token0,
        abi: ERC20_ABI,
        functionName: "name",
      },
    ],
    query: {
      enabled: isTokenADetailsEnabled,
    },
  });
  const { data: tokenBInfo }: any = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: CONVERTER_ADDRESS[chainId],
        abi: TOKEN_CONVERTER_ABI,
        functionName: "predictWrapperAddress",
        args: [positionDetails?.token1 as Address, true],
      },
      {
        address: positionDetails?.token1,
        abi: ERC20_ABI,
        functionName: "decimals",
      },
      {
        address: positionDetails?.token1,
        abi: ERC20_ABI,
        functionName: "symbol",
      },
      {
        address: positionDetails?.token1,
        abi: ERC20_ABI,
        functionName: "name",
      },
    ],
    query: {
      enabled: isTokenBDetailsEnabled,
    },
  });

  // Create Tokens using info from blockchain\node
  const tokenAFromNode = tokenAInfo?.length
    ? new Token(
        chainId,
        positionDetails?.token0 as Address,
        tokenAInfo?.[0] as Address,
        tokenAInfo?.[1],
        tokenAInfo?.[2],
        tokenAInfo?.[3],
        "/tokens/placeholder.svg",
      )
    : undefined;
  const tokenBFromNode = tokenBInfo?.length
    ? new Token(
        chainId,
        positionDetails?.token1 as Address,
        tokenBInfo?.[0] as Address,
        tokenBInfo?.[1],
        tokenBInfo?.[2],
        tokenBInfo?.[3],
        "/tokens/placeholder.svg",
      )
    : undefined;

  const tokenA = tokenAFromLists?.token || tokenAFromNode;
  const tokenB = tokenBFromLists?.token || tokenBFromNode;

  const pool = usePool({
    currencyA: tokenA,
    currencyB: tokenB,
    tier: positionDetails?.tier,
  });

  return useMemo(() => {
    if (pool[1] && positionDetails) {
      return new Position({
        pool: pool[1],
        tickLower: positionDetails.tickLower,
        tickUpper: positionDetails.tickUpper,
        liquidity: JSBI.BigInt(positionDetails.liquidity.toString()),
      });
    }
  }, [pool, positionDetails]);
}

const MAX_UINT128 = BigInt(2) ** BigInt(128) - BigInt(1);

export function usePositionFees({
  poolAddress,
  pool,
  tokenId,
}: {
  pool?: Pool;
  tokenId?: bigint;
  poolAddress?: Address;
}): {
  fees: [bigint, bigint] | [undefined, undefined];
  handleCollectFees: () => void;
  status: AllowanceStatus;
  claimFeesHash?: string;
  resetCollectFees: () => void;
  token0Standard: Standard;
  token1Standard: Standard;
  setToken0Standard: (standard: Standard) => void;
  setToken1Standard: (standard: Standard) => void;
} {
  const [token0Standard, setToken0Standard] = useState(Standard.ERC20);
  const [token1Standard, setToken1Standard] = useState(Standard.ERC20);
  const tokensOutCode = useMemo(() => {
    // 0 >> both ERC-20
    // 1 >> 0 ERC-20, 1 ERC-223
    // 2 >> 0 ERC-223, 1 ERC-20
    // 3 >> both ERC-223
    if (token0Standard === Standard.ERC20 && token1Standard === Standard.ERC20) return 0;
    if (token0Standard === Standard.ERC20 && token1Standard === Standard.ERC223) return 1;
    if (token0Standard === Standard.ERC223 && token1Standard === Standard.ERC20) return 2;
    if (token0Standard === Standard.ERC223 && token1Standard === Standard.ERC223) return 3;
    return 0;
  }, [token0Standard, token1Standard]);

  const [status, setStatus] = useState(AllowanceStatus.INITIAL);
  const [claimFeesHash, setClaimFeesHash] = useState(undefined as undefined | string);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const { address } = useAccount();
  const chainId = useCurrentChainId();
  const { addRecentTransaction } = useRecentTransactionsStore();

  const result = useReadContract({
    address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
    abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
    functionName: "ownerOf",
    args: [tokenId!],
    query: {
      enabled: Boolean(tokenId),
    },
  });
  const recipient = result.data! || address;

  // TODO: is this result cached? wrong numbers in UI, but in metamask — ok
  const { data: collectResult } = useSimulateContract({
    address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
    abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
    functionName: "collect",
    args: [
      {
        pool: poolAddress!,
        tokenId: tokenId!,
        recipient: recipient,
        amount0Max: MAX_UINT128,
        amount1Max: MAX_UINT128,
        tokensOutCode: 0,
      },
    ],
    query: {
      enabled: Boolean(tokenId && result.data),
    },
  });

  const fees = useMemo(() => {
    if (!pool || !collectResult?.result) return [undefined, undefined] as [undefined, undefined];
    return [collectResult?.result[0], collectResult?.result[1]] as [bigint, bigint];
  }, [pool, collectResult]);

  const collectFeesParams = useMemo(() => {
    if (!pool) return undefined;
    const collectArgs = {
      pool: poolAddress!,
      tokenId: tokenId!,
      recipient: recipient,
      amount0Max: MAX_UINT128,
      amount1Max: MAX_UINT128,
      tokensOutCode,
    };
    const nativeCoinAmount = pool.token0.isNative
      ? fees[0]
      : pool.token1.isNative
        ? fees[1]
        : undefined;

    const tokenAddress = !pool.token0.isNative
      ? token0Standard === Standard.ERC20
        ? pool.token0.wrapped.address0
        : pool.token0.wrapped.address1
      : token1Standard === Standard.ERC20
        ? pool.token1.wrapped.address0
        : pool.token1.wrapped.address1;

    if (nativeCoinAmount) {
      const encodedCoolectParams = encodeFunctionData({
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        functionName: "collect" as const,
        args: [{ ...collectArgs, recipient: ZERO_ADDRESS }] as const,
      });

      const encodedUnwrapParams = encodeFunctionData({
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        functionName: "unwrapWETH9",
        args: [nativeCoinAmount, recipient],
      });
      const encodedSweepParams = encodeFunctionData({
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        functionName: "sweepToken",
        args: [tokenAddress, nativeCoinAmount, recipient],
      });

      return {
        address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId],
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        functionName: "multicall" as const,
        args: [[encodedCoolectParams, encodedUnwrapParams, encodedSweepParams]] as const,
      };
    }

    const params = {
      address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId],
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: "collect" as const,
      args: [collectArgs] as const,
    };

    return params;
  }, [pool, chainId, poolAddress, tokenId, tokensOutCode, recipient, fees]);

  const handleCollectFees = useCallback(async () => {
    setStatus(AllowanceStatus.INITIAL);
    if (
      !publicClient ||
      !walletClient ||
      !chainId ||
      !address ||
      !pool ||
      !collectResult ||
      !collectFeesParams
    ) {
      return;
    }
    setStatus(AllowanceStatus.PENDING);

    const params = collectFeesParams;

    try {
      const estimatedGas = await publicClient.estimateContractGas(params as any);

      const { request } = await publicClient.simulateContract({
        ...(params as any),
        gas: estimatedGas + BigInt(30000),
      });
      const hash = await walletClient.writeContract(request);

      setClaimFeesHash(hash);
      const transaction = await publicClient.getTransaction({
        hash,
      });

      const nonce = transaction.nonce;

      addRecentTransaction(
        {
          hash,
          nonce,
          chainId,
          gas: {
            model: GasFeeModel.EIP1559,
            gas: (estimatedGas + BigInt(30000)).toString(),
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
          },
          params: {
            ...stringifyObject(params),
            abi: [getAbiItem({ name: "collect", abi: NONFUNGIBLE_POSITION_MANAGER_ABI })],
          },
          title: {
            template: RecentTransactionTitleTemplate.COLLECT,
            symbol0: pool.token0.symbol!,
            symbol1: pool.token1.symbol!,
            amount0: CurrencyAmount.fromRawAmount(
              pool.token0,
              collectResult.result[0].toString(),
            ).toSignificant(2),
            amount1: CurrencyAmount.fromRawAmount(
              pool.token1,
              collectResult.result[1].toString(),
            ).toSignificant(2),
            logoURI0: (pool?.token0 as Token).logoURI!,
            logoURI1: (pool?.token1 as Token).logoURI!,
          },
        },
        address,
      );
      if (hash) {
        setStatus(AllowanceStatus.LOADING);
        await publicClient.waitForTransactionReceipt({ hash });
        setStatus(AllowanceStatus.SUCCESS);
        return { success: true };
      }
    } catch (error) {
      console.error(error);
      setStatus(AllowanceStatus.ERROR);
    }
  }, [
    addRecentTransaction,
    address,
    chainId,
    collectResult,
    pool,
    publicClient,
    walletClient,
    setClaimFeesHash,
    collectFeesParams,
  ]);

  const resetCollectFees = () => {
    setStatus(AllowanceStatus.INITIAL);
    setClaimFeesHash(undefined);
  };

  return {
    fees,
    handleCollectFees,
    status,
    claimFeesHash,
    resetCollectFees,
    token0Standard,
    token1Standard,
    setToken0Standard,
    setToken1Standard,
  };
}

function getRatio(
  lower: Price<Currency, Currency>,
  current: Price<Currency, Currency>,
  upper: Price<Currency, Currency>,
) {
  try {
    if (+current < +lower) {
      return 100;
    } else if (+current > +upper) {
      return 0;
    }

    const a = Number.parseFloat(lower.toSignificant(15));
    const b = Number.parseFloat(upper.toSignificant(15));
    const c = Number.parseFloat(current.toSignificant(15));

    const ratio = Math.floor(
      (1 / ((Math.sqrt(a * b) - Math.sqrt(b * c)) / (c - Math.sqrt(b * c)) + 1)) * 100,
    );

    if (ratio < 0 || ratio > 100) {
      throw Error("Out of range");
    }

    return ratio;
  } catch {
    return undefined;
  }
}
export function usePositionPrices({
  position,
  showFirst,
}: {
  position: Position | undefined;
  showFirst: boolean;
}) {
  const minPrice = useMemo(() => {
    if (showFirst) {
      return position?.token0PriceUpper.invert();
    }

    return position?.token0PriceLower;
  }, [position?.token0PriceLower, position?.token0PriceUpper, showFirst]);

  const maxPrice = useMemo(() => {
    if (showFirst) {
      return position?.token0PriceLower.invert();
    }

    return position?.token0PriceUpper;
  }, [position?.token0PriceLower, position?.token0PriceUpper, showFirst]);

  const currentPrice = useMemo(() => {
    if (showFirst) {
      return position?.pool.token1Price;
    }

    return position?.pool.token0Price;
  }, [position?.pool.token0Price, position?.pool.token1Price, showFirst]);

  const [minPriceString, maxPriceString, currentPriceString] = useMemo(() => {
    if (minPrice && maxPrice && currentPrice) {
      return [minPrice.toSignificant(), maxPrice.toSignificant(), currentPrice.toSignificant()];
    }

    return ["0", "0", "0"];
  }, [currentPrice, maxPrice, minPrice]);

  const ratio = useMemo(() => {
    if (minPrice && currentPrice && maxPrice) {
      return getRatio(minPrice, currentPrice, maxPrice);
    }
  }, [currentPrice, maxPrice, minPrice]);

  return {
    minPriceString,
    maxPriceString,
    currentPriceString,
    ratio,
  };
}

export function usePositionRangeStatus({ position }: { position: Position | undefined }) {
  const below =
    position?.pool && typeof position?.tickUpper === "number"
      ? position.pool.tickCurrent < position.tickLower
      : undefined;
  const above =
    position?.pool && typeof position?.tickLower === "number"
      ? position.pool.tickCurrent >= position.tickUpper
      : undefined;
  const inRange: boolean =
    typeof below === "boolean" && typeof above === "boolean" ? !below && !above : false;

  const removed = position ? JSBI.equal(position.liquidity, JSBI.BigInt(0)) : false;

  return {
    inRange,
    removed,
  };
}
