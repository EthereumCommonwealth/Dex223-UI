import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

export interface RevenueTokenInfo {
  addressERC20: Address;
  addressERC223: Address;
  decimals: string;
  id: string;
  name: string;
  symbol: string;
}
export interface RevenueTokenItem {
  accruedInPoolsNow: string;
  accruedInPoolsNowUSD: string | null;
  claimedFromRevenueTotalERC20: string;
  claimedFromRevenueTotalERC223: string;
  deliveredToRevenueTotalERC20: string;
  deliveredToRevenueTotalERC223: string;
  inRevenueNowERC20: string;
  inRevenueNowERC223: string;
  token: RevenueTokenInfo;
  accruedNormalized: string;
  priceUSD: string | null;
  totalValueUSD: string | null;
}
export interface RevenueBalancesResponse {
  updated_at: number;
  total: number;
  limit: number;
  offset: number;
  items: RevenueTokenItem[];
}
export interface RevenuePoolItem {
  id?: Address;
  poolId: Address;
  accruedProtocolFeesToken: string;
}
export interface RevenuePoolsResponse {
  pools: RevenuePoolItem[];
}
export interface TotalRewardResponse {
  created_at: string;
  updated_at: number;
  accruedInPoolsNowUSD: string;
  totalValueUSD: string;
  status?: string;
  stakedSince?: string;
}

export function useRevenueTokens(limit: number = 50, offset: number = 0) {
  return useQuery<RevenueBalancesResponse>({
    queryKey: ["revenue-balances", limit, offset],
    queryFn: async () => {
      const response = await fetch(
        `https://api.dex223.io/v1/cache/revenue/balances?limit=${limit}&offset=${offset}`,
        {
          headers: {
            accept: "application/json",
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch revenue balances");
      }
      return response.json();
    },
    staleTime: 60000,
  });
}

export function useRevenuePools(tokenId: string) {
  return useQuery<RevenuePoolsResponse>({
    queryKey: ["revenue-pools", tokenId],
    queryFn: async () => {
      if (!tokenId) return { items: [] };
      const response = await fetch(
        `https://api.dex223.io/v1/cache/revenue/pools/summary?token_id=${tokenId}`,
        {
          headers: {
            accept: "application/json",
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch revenue pools");
      }
      return response.json();
    },
    enabled: Boolean(tokenId),
    staleTime: 60000,
  });
}

export function useTotalReward() {
  return useQuery<TotalRewardResponse>({
    queryKey: ["total-reward"],
    queryFn: async () => {
      const response = await fetch("https://api.dex223.io/v1/cache/revenue/total-reward");
      if (!response.ok) {
        throw new Error("Failed to fetch total reward");
      }
      return response.json();
    },
    staleTime: 60000,
  });
}
