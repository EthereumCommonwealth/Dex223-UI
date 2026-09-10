import { useCallback, useEffect, useMemo, useState } from "react";
import { Address, formatUnits, Hash } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWalletClient,
} from "wagmi";

import { ERC20_ABI } from "@/config/abis/erc20";
import { revenueABI } from "@/config/abis/revenue";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { Token } from "@/sdk_bi/entities/token";
import { useRecentTransactionsStore } from "@/stores/useRecentTransactionsStore";
import {
  RecentTransactionTitleTemplate,
  stringifyObject,
} from "@/stores/useRecentTransactionsStore";

import { useRevenueTokens } from "./useRevenueTokens";

// Contract addresses on Sepolia testnet
// 0x4e38fB6f9243d2aC91C490230375FeDE1E0aD7F2
// export const REVENUE_CONTRACT_ADDRESS = "0x4e38fB6f9243d2aC91C490230375FeDE1E0aD7F2" as Address;
const REVENUE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_REVENUE_CONTRACT_ADDRESS as Address;
export const RED_ERC20_ADDRESS = "0x1DEf777468F76ed1E74fC87bD32334d3Ccb520d0" as Address;
export const RED_ERC223_ADDRESS = "0x0a67Cc4D3Ac29a133a597b5Bef3fe9A6028ACad2" as Address;

export enum TokenType {
  ERC20 = "ERC-20",
  ERC223 = "ERC-223",
}

export interface ClaimableReward {
  token: Token;
  amount: bigint;
  amountFormatted: string;
  amountUSD?: string;
}

type CustomGasSettings =
  | {
      maxPriorityFeePerGas: bigint | undefined;
      maxFeePerGas: bigint | undefined;
      gasPrice?: undefined;
    }
  | {
      gasPrice: bigint | undefined;
      maxPriorityFeePerGas?: undefined;
      maxFeePerGas?: undefined;
    }
  | undefined;

export interface RevenueContractConfig {
  contractAddress?: Address;
  searchAddress?: Address;
}

export default function useRevenueContract({
  contractAddress = REVENUE_CONTRACT_ADDRESS,
  searchAddress,
}: RevenueContractConfig = {}) {
  const { address: connectedAddress, chainId: walletChainId } = useAccount();
  const targetAddress = searchAddress || connectedAddress;
  const chainId = useCurrentChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { addRecentTransaction } = useRecentTransactionsStore();

  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const { data: revenueTokensData } = useRevenueTokens();

  // Check if user is on the correct network
  const isCorrectNetwork = walletChainId === chainId;

  const [rewardTokens, setRewardTokens] = useState<Token[]>([]);

  useEffect(() => {
    if (revenueTokensData?.items) {
      const tokens = revenueTokensData.items.map(
        (item) =>
          new Token(
            chainId,
            item.token.addressERC20,
            item.token.addressERC223,
            parseInt(item.token.decimals),
            item.token.symbol,
            item.token.name,
            "/images/tokens/placeholder.svg",
          ),
      );
      setRewardTokens(tokens);
    }
  }, [revenueTokensData, chainId]);

  const {
    data: userStaked,
    refetch: refetchUserStaked,
    isLoading: isLoadingUserStaked,
  } = useReadContract({
    abi: revenueABI,
    address: contractAddress,
    functionName: "staked",
    args: targetAddress ? [targetAddress] : undefined,
    chainId: chainId,
    query: {
      enabled: Boolean(targetAddress && contractAddress),
    },
  });

  const {
    data: userContribution,
    refetch: refetchUserContribution,
    isLoading: isLoadingUserContribution,
  } = useReadContract({
    abi: revenueABI,
    address: contractAddress,
    functionName: "contribution",
    args: targetAddress ? [targetAddress] : undefined,
    chainId: chainId,
    query: {
      enabled: Boolean(targetAddress && contractAddress),
    },
  });

  const { data: userContributionValue, refetch: refetchUserContributionValue } = useReadContract({
    abi: revenueABI,
    address: contractAddress,
    functionName: "getContributionValue",
    args: targetAddress ? [targetAddress] : undefined,
    chainId: chainId,
    query: {
      enabled: Boolean(targetAddress && contractAddress),
    },
  });

  const { data: userLastUpdate, refetch: refetchUserLastUpdate } = useReadContract({
    abi: revenueABI,
    address: contractAddress,
    functionName: "lastUpdate",
    args: targetAddress ? [targetAddress] : undefined,
    chainId: chainId,
    query: {
      enabled: Boolean(targetAddress && contractAddress),
    },
  });

  const { data: userStakingTimestamp, refetch: refetchUserStakingTimestamp } = useReadContract({
    abi: revenueABI,
    address: contractAddress,
    functionName: "staking_timestamp",
    args: targetAddress ? [targetAddress] : undefined,
    chainId: chainId,
    query: {
      enabled: Boolean(targetAddress && contractAddress),
    },
  });

  const { data: claimDelay, refetch: refetchClaimDelay } = useReadContract({
    abi: revenueABI,
    address: contractAddress,
    functionName: "claim_delay",
    chainId: chainId,
    query: {
      enabled: Boolean(contractAddress),
    },
  });

  const { data: redErc20Balance } = useReadContract({
    abi: ERC20_ABI,
    address: RED_ERC20_ADDRESS,
    functionName: "balanceOf",
    args: targetAddress ? [targetAddress] : undefined,
    chainId: chainId,
    query: {
      enabled: Boolean(targetAddress),
    },
  });

  const { data: redErc223Balance } = useReadContract({
    abi: ERC20_ABI,
    address: RED_ERC223_ADDRESS,
    functionName: "balanceOf",
    args: targetAddress ? [targetAddress] : undefined,
    chainId: chainId,
    query: {
      enabled: Boolean(targetAddress),
    },
  });

  const { data: redTotalSupply } = useReadContract({
    abi: ERC20_ABI,
    address: RED_ERC20_ADDRESS,
    functionName: "totalSupply",
    chainId: chainId,
    query: {
      enabled: Boolean(RED_ERC20_ADDRESS),
    },
  });

  // Read token balances in revenue contract
  const tokenBalanceContracts = rewardTokens.map((token) => ({
    abi: ERC20_ABI,
    address: token.address0,
    functionName: "balanceOf" as const,
    args: [contractAddress],
    chainId: chainId,
  }));

  const { data: tokenBalances, refetch: refetchTokenBalances } = useReadContracts({
    contracts: tokenBalanceContracts,
    query: {
      enabled: rewardTokens.length > 0,
    },
  });

  const spentContributionContracts = rewardTokens.map((token) => ({
    abi: revenueABI,
    address: contractAddress,
    functionName: "spentContribution" as const,
    args: targetAddress ? [targetAddress, token.address0] : undefined,
    chainId: chainId,
  }));

  const { data: spentContributions, refetch: refetchSpentContributions } = useReadContracts({
    contracts: spentContributionContracts as any,
    query: {
      enabled: Boolean(targetAddress && rewardTokens.length > 0),
    },
  });

  const spentTotalContributionContracts = rewardTokens.map((token) => ({
    abi: revenueABI,
    address: contractAddress,
    functionName: "spentTotalContribution" as const,
    args: [token.address0],
    chainId: chainId,
  }));

  const { data: spentTotalContributions, refetch: refetchSpentTotalContributions } =
    useReadContracts({
      contracts: spentTotalContributionContracts as any,
      query: {
        enabled: rewardTokens.length > 0,
      },
    });

  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const canUnstake = useMemo(() => {
    if (!userStakingTimestamp || !claimDelay)
      return { canUnstake: false, timeRemaining: 0, unlockTime: 0 };

    const unlockTime = Number(userStakingTimestamp) + Number(claimDelay);
    const canUnstakeNow = currentTime >= unlockTime;
    const timeRemaining = Math.max(0, unlockTime - currentTime);

    return { canUnstake: canUnstakeNow, timeRemaining, unlockTime };
  }, [userStakingTimestamp, claimDelay, currentTime]);

  const hasStaked = useMemo(() => {
    return Boolean(userStaked && typeof userStaked === "bigint" && userStaked > 0n);
  }, [userStaked]);

  const hasContribution = useMemo(() => {
    return Boolean(
      userContribution && typeof userContribution === "bigint" && userContribution > 0n,
    );
  }, [userContribution]);

  const formatCountdown = useCallback((seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d : ${hours}h : ${minutes}m : ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h : ${minutes}m : ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m : ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }, []);

  const unstakeCountdown = useMemo(() => {
    if (!hasStaked || !userStakingTimestamp || !claimDelay) return null;
    const unlockTime = Number(userStakingTimestamp) + Number(claimDelay);
    const remaining = Math.max(0, unlockTime - currentTime);
    if (remaining <= 0) return null;
    return formatCountdown(remaining);
  }, [hasStaked, userStakingTimestamp, claimDelay, currentTime, formatCountdown]);

  const claimableRewards = useMemo<ClaimableReward[]>(() => {
    if (
      !userContributionValue ||
      !tokenBalances ||
      !spentContributions ||
      !spentTotalContributions
    ) {
      return [];
    }

    return rewardTokens.map((token, index) => {
      const balance = tokenBalances[index]?.result as bigint | undefined;
      const spentContribution = spentContributions[index]?.result as bigint | undefined;
      const spentTotal = spentTotalContributions[index]?.result as bigint | undefined;

      if (!balance || !spentContribution || !spentTotal || balance === 0n) {
        return {
          token,
          amount: 0n,
          amountFormatted: "0",
        };
      }

      const unpaidUserContribution = (userContributionValue as bigint) - spentContribution;
      const tokenUnpaidContribution = (userContributionValue as bigint) - spentTotal;

      if (tokenUnpaidContribution === 0n || unpaidUserContribution === 0n) {
        return {
          token,
          amount: 0n,
          amountFormatted: "0",
        };
      }

      const claimable = (balance * unpaidUserContribution) / tokenUnpaidContribution;
      const formatted = (Number(claimable) / Math.pow(10, token.decimals)).toFixed(6);

      return {
        token,
        amount: claimable,
        amountFormatted: formatted,
      };
    });
  }, [
    userContributionValue,
    tokenBalances,
    spentContributions,
    spentTotalContributions,
    rewardTokens,
  ]);

  // Calculate staking percentage
  const stakingPercentage = useMemo(() => {
    if (!userStaked || !redTotalSupply || redTotalSupply === 0n) {
      return 0;
    }
    return (Number(userStaked) / Number(redTotalSupply)) * 100;
  }, [userStaked, redTotalSupply]);

  // The raw ratio is tiny against total supply, and rendering the float directly
  // produced user-visible exponential notation such as "8.811078189098033e-21%".
  const stakingPercentageFormatted = useMemo(() => {
    if (!stakingPercentage || !Number.isFinite(stakingPercentage)) return "0";
    if (stakingPercentage > 0 && stakingPercentage < 0.01) return "<0.01";
    return stakingPercentage.toFixed(2);
  }, [stakingPercentage]);

  const refetchUserData = useCallback(() => {
    refetchUserStaked();
    refetchUserContribution();
    refetchUserContributionValue();
    refetchUserLastUpdate();
    refetchUserStakingTimestamp();
    refetchClaimDelay();
    refetchTokenBalances();
    refetchSpentContributions();
    refetchSpentTotalContributions();
  }, [
    refetchUserStaked,
    refetchUserContribution,
    refetchUserContributionValue,
    refetchUserLastUpdate,
    refetchUserStakingTimestamp,
    refetchClaimDelay,
    refetchTokenBalances,
    refetchSpentContributions,
    refetchSpentTotalContributions,
  ]);

  const executeTransaction = useCallback(
    async ({
      functionName,
      args,
      abi,
      address: targetContract,
      customGasLimit,
      gasSettings,
      onHashReceive,
      onReceiptReceive,
      transactionTitle,
    }: {
      functionName: string;
      args?: any[];
      abi?: any;
      address?: Address;
      customGasLimit?: bigint;
      gasSettings?: CustomGasSettings;
      onHashReceive?: (hash: Hash) => void;
      onReceiptReceive?: (receipt: any) => void;
      transactionTitle?: any;
    }) => {
      if (!publicClient || !walletClient || !connectedAddress) {
        throw new Error("Wallet not connected");
      }

      setIsTransactionPending(true);

      const params = {
        abi: abi || revenueABI,
        address: targetContract || contractAddress,
        functionName,
        args: args || [],
      };

      console.log("executeTransaction params:", params);
      console.log("Function:", functionName, "Args:", args);

      try {
        const estimatedGas = await publicClient.estimateContractGas({
          account: connectedAddress,
          ...params,
        } as any);

        const gasToUse = customGasLimit || estimatedGas + BigInt(30000);

        let request;
        try {
          const { request: simulatedRequest } = await publicClient.simulateContract({
            ...params,
            account: connectedAddress,
            ...gasSettings,
            gas: gasToUse,
          } as any);
          request = simulatedRequest;
        } catch (e) {
          request = {
            ...params,
            ...gasSettings,
            gas: gasToUse,
            account: undefined,
          } as any;
        }

        const hash = await walletClient.writeContract({
          ...request,
          account: undefined,
        });

        onHashReceive?.(hash);

        if (transactionTitle && connectedAddress) {
          const transaction = await getTransactionWithRetries({
            hash,
            publicClient,
          });

          if (transaction) {
            const nonce = transaction.nonce;
            addRecentTransaction(
              {
                hash,
                nonce,
                chainId: publicClient.chain?.id || chainId,
                gas: {
                  ...stringifyObject({ ...gasSettings }),
                  gas: gasToUse.toString(),
                },
                params: {
                  ...stringifyObject(params),
                },
                title: transactionTitle,
              },
              connectedAddress,
            );
          }
        }

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        onReceiptReceive?.(receipt);

        setIsTransactionPending(false);
        return { hash, receipt };
      } catch (error: any) {
        console.error("Transaction execution error:", error);
        setIsTransactionPending(false);
        throw error;
      }
    },
    [publicClient, walletClient, connectedAddress, chainId, addRecentTransaction, contractAddress],
  );

  const approve = useCallback(
    async (amount: bigint, gasSettings?: CustomGasSettings, customGasLimit?: bigint) => {
      return executeTransaction({
        functionName: "approve",
        args: [contractAddress, amount],
        abi: ERC20_ABI,
        address: RED_ERC20_ADDRESS,
        gasSettings,
        customGasLimit,
        transactionTitle: {
          template: RecentTransactionTitleTemplate.APPROVE,
          symbol: "D223",
          amount: formatUnits(amount, 18),
          logoURI: "/images/tokens/red.svg",
        },
      });
    },
    [executeTransaction, contractAddress],
  );

  const stake = useCallback(
    async (amount: bigint, gasSettings?: CustomGasSettings, customGasLimit?: bigint) => {
      return executeTransaction({
        functionName: "stake",
        args: [RED_ERC20_ADDRESS, amount],
        gasSettings,
        customGasLimit,
        transactionTitle: {
          template: RecentTransactionTitleTemplate.DEPOSIT,
          symbol: "D223",
          amount: formatUnits(amount, 18),
          logoURI: "/images/tokens/red.svg",
        },
      });
    },
    [executeTransaction],
  );

  const stakeERC223 = useCallback(
    async (amount: bigint, gasSettings?: CustomGasSettings, customGasLimit?: bigint) => {
      return executeTransaction({
        functionName: "transfer",
        args: [contractAddress, amount],
        abi: ERC20_ABI,
        address: RED_ERC223_ADDRESS,
        gasSettings,
        customGasLimit,
        transactionTitle: {
          template: RecentTransactionTitleTemplate.DEPOSIT,
          symbol: "D223",
          amount: formatUnits(amount, 18),
          logoURI: "/images/tokens/red.svg",
        },
      });
    },
    [executeTransaction, contractAddress],
  );

  const unstake = useCallback(
    async (
      tokenAddress: Address,
      amount: bigint,
      gasSettings?: CustomGasSettings,
      customGasLimit?: bigint,
    ) => {
      return executeTransaction({
        functionName: "withdraw",
        args: [tokenAddress, amount],
        gasSettings,
        customGasLimit,
        transactionTitle: {
          template: RecentTransactionTitleTemplate.WITHDRAW,
          symbol: "D223",
          amount: formatUnits(amount, 18),
          logoURI: "/images/tokens/red.svg",
        },
      });
    },
    [executeTransaction],
  );

  const delivery = useCallback(
    async (poolAddresses: Address[], gasSettings?: CustomGasSettings, customGasLimit?: bigint) => {
      return executeTransaction({
        functionName: "delivery",
        args: [poolAddresses],
        gasSettings,
        customGasLimit,
      });
    },
    [executeTransaction],
  );

  const claim = useCallback(
    async (tokenAddresses: Address[], gasSettings?: CustomGasSettings, customGasLimit?: bigint) => {
      return executeTransaction({
        functionName: "claim",
        args: [tokenAddresses],
        gasSettings,
        customGasLimit,
        transactionTitle: {
          template: RecentTransactionTitleTemplate.COLLECT,
          symbol: "REWARDS",
          amount: tokenAddresses.length.toString(),
          logoURI: "/images/tokens/placeholder.svg",
        },
      });
    },
    [executeTransaction],
  );

  return {
    contractAddress,
    chainId,
    requiredChainId: chainId,
    isCorrectNetwork: walletChainId === chainId,
    userStaked,
    userContribution,
    userContributionValue,
    userLastUpdate,
    userStakingTimestamp,
    claimDelay,
    redErc20Balance,
    redErc223Balance,
    redTotalSupply,
    canUnstake: canUnstake.canUnstake,
    timeRemaining: canUnstake.timeRemaining,
    unlockTime: canUnstake.unlockTime,
    hasStaked,
    hasContribution,
    stakingPercentage,
    stakingPercentageFormatted,
    unstakeCountdown,
    claimableRewards,
    setRewardTokens,
    formatCountdown,
    approve,
    stake,
    stakeERC223,
    unstake,
    delivery,
    claim,
    refetchUserData,
    isLoadingUserData: isLoadingUserStaked || isLoadingUserContribution,
    isTransactionPending,
  };
}
