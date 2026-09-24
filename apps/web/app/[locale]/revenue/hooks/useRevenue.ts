"use client";

import { useCallback, useMemo, useState } from "react";
import { Address, erc20Abi, formatUnits, isAddress, parseUnits, zeroAddress } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWalletClient,
} from "wagmi";

import { estimateClaimDividends, isStakingToken } from "@/app/[locale]/revenue/lib/claimEstimate";
import { REVENUE_ABI } from "@/config/abis/revenue";
import { getRevenueAddress } from "@/config/modules";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import addToast from "@/other/toast";

export function useRevenueContract() {
  const chainId = useCurrentChainId();
  const address = getRevenueAddress(chainId);
  return { chainId, revenueAddress: address };
}

export function useRevenueReads(user?: Address) {
  const { revenueAddress } = useRevenueContract();
  const enabled = Boolean(revenueAddress);

  const meta = useReadContracts({
    contracts: revenueAddress
      ? [
          { address: revenueAddress, abi: REVENUE_ABI, functionName: "staking_token_erc20" },
          { address: revenueAddress, abi: REVENUE_ABI, functionName: "staking_token_erc223" },
          { address: revenueAddress, abi: REVENUE_ABI, functionName: "claim_delay" },
          {
            address: revenueAddress,
            abi: REVENUE_ABI,
            functionName: "assigned_avg_staking_duration",
          },
          { address: revenueAddress, abi: REVENUE_ABI, functionName: "total_staked" },
          { address: revenueAddress, abi: REVENUE_ABI, functionName: "factory" },
        ]
      : [],
    query: { enabled },
  });

  const stake20 = (meta.data?.[0]?.result as Address | undefined) ?? zeroAddress;
  const stake223 = (meta.data?.[1]?.result as Address | undefined) ?? zeroAddress;
  const claimDelay = (meta.data?.[2]?.result as bigint | undefined) ?? 0n;
  const avgDuration = (meta.data?.[3]?.result as bigint | undefined) ?? 0n;
  const totalStaked = (meta.data?.[4]?.result as bigint | undefined) ?? 0n;
  const factory = (meta.data?.[5]?.result as Address | undefined) ?? zeroAddress;

  const userReads = useReadContracts({
    contracts:
      revenueAddress && user
        ? [
            { address: revenueAddress, abi: REVENUE_ABI, functionName: "staked", args: [user] },
            {
              address: revenueAddress,
              abi: REVENUE_ABI,
              functionName: "staking_timestamp",
              args: [user],
            },
            {
              address: revenueAddress,
              abi: REVENUE_ABI,
              functionName: "erc223deposit",
              args: [user, stake223],
            },
          ]
        : [],
    query: { enabled: enabled && Boolean(user) && stake223 !== zeroAddress },
  });

  const userStaked = (userReads.data?.[0]?.result as bigint | undefined) ?? 0n;
  const stakingTimestamp = (userReads.data?.[1]?.result as bigint | undefined) ?? 0n;
  const deposit223 = (userReads.data?.[2]?.result as bigint | undefined) ?? 0n;

  const walletBalances = useReadContracts({
    contracts:
      user && stake20 !== zeroAddress
        ? [
            { address: stake20, abi: erc20Abi, functionName: "balanceOf", args: [user] },
            {
              address: stake20,
              abi: erc20Abi,
              functionName: "allowance",
              args: [user, revenueAddress!],
            },
            { address: stake20, abi: erc20Abi, functionName: "decimals" },
            { address: stake20, abi: erc20Abi, functionName: "symbol" },
          ]
        : [],
    query: { enabled: Boolean(user) && stake20 !== zeroAddress && Boolean(revenueAddress) },
  });

  return {
    revenueAddress,
    stake20,
    stake223,
    claimDelay,
    avgDuration,
    totalStaked,
    factory,
    userStaked,
    stakingTimestamp,
    deposit223,
    walletBalance20: (walletBalances.data?.[0]?.result as bigint | undefined) ?? 0n,
    allowance20: (walletBalances.data?.[1]?.result as bigint | undefined) ?? 0n,
    decimals: Number((walletBalances.data?.[2]?.result as number | undefined) ?? 18),
    symbol: (walletBalances.data?.[3]?.result as string | undefined) ?? "TOKEN",
    refetchAll: async () => {
      await Promise.all([meta.refetch(), userReads.refetch(), walletBalances.refetch()]);
    },
    isLoading: meta.isLoading || userReads.isLoading,
  };
}

export function usePendingClaim(token: Address | undefined, user?: Address) {
  const {
    revenueAddress,
    stake20,
    stake223,
    userStaked,
    totalStaked,
    avgDuration,
    stakingTimestamp,
  } = useRevenueReads(user);
  const publicClient = usePublicClient();

  const lastClaim = useReadContract({
    address: revenueAddress,
    abi: REVENUE_ABI,
    functionName: "last_claim",
    args: user && token ? [user, token] : undefined,
    query: { enabled: Boolean(revenueAddress && user && token) },
  });

  const balance = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: revenueAddress ? [revenueAddress] : undefined,
    query: { enabled: Boolean(token && revenueAddress) },
  });

  return useMemo(() => {
    if (!token || !revenueAddress || isStakingToken(token, stake20, stake223)) {
      return { dividends: 0n, periods: 0n, nextPeriodAt: null as bigint | null, blocked: true };
    }
    const lastClaimTs =
      (lastClaim.data as bigint | undefined) ?? (stakingTimestamp > 0n ? stakingTimestamp : 0n);
    const nowTs = BigInt(Math.floor(Date.now() / 1000));
    const estimate = estimateClaimDividends({
      selfBalance: (balance.data as bigint | undefined) ?? 0n,
      userStaked,
      totalStaked,
      lastClaimTs: lastClaimTs === 0n ? stakingTimestamp : lastClaimTs,
      nowTs,
      avgDuration,
    });
    return { ...estimate, blocked: false, publicClient };
  }, [
    token,
    revenueAddress,
    stake20,
    stake223,
    lastClaim.data,
    balance.data,
    userStaked,
    totalStaked,
    stakingTimestamp,
    avgDuration,
    publicClient,
  ]);
}

export function useRevenueActions() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { revenueAddress, stake20, refetchAll, decimals } = useRevenueReads(address);
  const [pending, setPending] = useState<string | null>(null);

  const run = useCallback(
    async (label: string, write: () => Promise<`0x${string}`>) => {
      if (!walletClient || !publicClient || !address) {
        addToast("Connect a wallet first", "error");
        return;
      }
      if (!revenueAddress) {
        addToast("Revenue is not deployed on this network yet", "error");
        return;
      }
      try {
        setPending(label);
        const hash = await write();
        await publicClient.waitForTransactionReceipt({ hash });
        addToast(`${label} confirmed`, "success");
        await refetchAll();
      } catch (e: any) {
        console.error(e);
        addToast(e?.shortMessage || e?.message || `${label} failed`, "error");
      } finally {
        setPending(null);
      }
    },
    [walletClient, publicClient, address, revenueAddress, refetchAll],
  );

  const approveAndStake20 = useCallback(
    async (amountHuman: string) => {
      if (!walletClient || !revenueAddress || !address) return;
      const amount = parseUnits(amountHuman || "0", decimals);
      if (amount <= 0n) {
        addToast("Enter an amount greater than zero", "error");
        return;
      }
      await run("Approve", async () =>
        walletClient.writeContract({
          address: stake20,
          abi: erc20Abi,
          functionName: "approve",
          args: [revenueAddress, amount],
          account: address,
          chain: walletClient.chain,
        }),
      );
      await run("Stake", async () =>
        walletClient.writeContract({
          address: revenueAddress,
          abi: REVENUE_ABI,
          functionName: "stake",
          args: [stake20, amount],
          account: address,
          chain: walletClient.chain,
        }),
      );
    },
    [walletClient, revenueAddress, address, decimals, run, stake20],
  );

  const withdraw = useCallback(
    async (amountHuman: string, token: Address) => {
      if (!walletClient || !revenueAddress || !address) return;
      const amount = parseUnits(amountHuman || "0", decimals);
      if (amount <= 0n) {
        addToast("Enter an amount greater than zero", "error");
        return;
      }
      await run("Withdraw", async () =>
        walletClient.writeContract({
          address: revenueAddress,
          abi: REVENUE_ABI,
          functionName: "withdraw",
          args: [token, amount],
          account: address,
          chain: walletClient.chain,
        }),
      );
    },
    [walletClient, revenueAddress, address, decimals, run],
  );

  const claim = useCallback(
    async (tokens: Address[]) => {
      if (!walletClient || !revenueAddress || !address) return;
      const filtered = tokens.filter((t) => isAddress(t));
      if (!filtered.length) {
        addToast("Add at least one reward token address", "error");
        return;
      }
      await run("Claim", async () =>
        walletClient.writeContract({
          address: revenueAddress,
          abi: REVENUE_ABI,
          functionName: "claim",
          args: [filtered],
          account: address,
          chain: walletClient.chain,
        }),
      );
    },
    [walletClient, revenueAddress, address, run],
  );

  const withdrawDeposit = useCallback(
    async (token: Address) => {
      if (!walletClient || !revenueAddress || !address) return;
      await run("Recover deposit", async () =>
        walletClient.writeContract({
          address: revenueAddress,
          abi: REVENUE_ABI,
          functionName: "withdrawDeposit",
          args: [token],
          account: address,
          chain: walletClient.chain,
        }),
      );
    },
    [walletClient, revenueAddress, address, run],
  );

  return { pending, approveAndStake20, withdraw, claim, withdrawDeposit, formatUnits };
}
