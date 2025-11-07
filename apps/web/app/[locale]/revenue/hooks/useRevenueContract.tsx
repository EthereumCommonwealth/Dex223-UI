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

// Contract addresses on Sepolia testnet
export const REVENUE_CONTRACT_ADDRESS = "0x4e38fB6f9243d2aC91C490230375FeDE1E0aD7F2" as Address;
export const RED_ERC20_ADDRESS = "0x1DEf777468F76ed1E74fC87bD32334d3Ccb520d0" as Address;
export const RED_ERC223_ADDRESS = "0x0a67Cc4D3Ac29a133a597b5Bef3fe9A6028ACad2" as Address;
export const BLU_ADDRESS = "0x3E0fc36a6EE84a34F8F985c66e94c845df46f6D9" as Address;
export const FOO_ADDRESS = "0x2a5A93fA091Fca3ECb4ad792Ff0C72aF3dD39556" as Address;

export const RED_BLU_POOL = "0x0BE7bb0927Bb3cBD4075EE20BC46F44B57dC43b3" as Address;
export const RED_FOO_POOL = "0x82e9131d84428d98E098cFAE153aa7FD579e438C" as Address;

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
  const [lastError, setLastError] = useState<string | null>(null);

  // Check if user is on the correct network
  const isCorrectNetwork = walletChainId === chainId;

  const [rewardTokens, setRewardTokens] = useState<Token[]>([
    new Token(
      chainId,
      RED_ERC20_ADDRESS,
      RED_ERC223_ADDRESS,
      18,
      "RED",
      "Red Token",
      "/images/tokens/red.svg",
    ),
    new Token(
      chainId,
      BLU_ADDRESS,
      BLU_ADDRESS,
      18,
      "BLU",
      "Blue Token",
      "/images/tokens/blue.svg",
    ),
    new Token(chainId, FOO_ADDRESS, FOO_ADDRESS, 18, "FOO", "Foo Token", "/images/tokens/foo.svg"),
  ]);

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

  const {
    data: redErc20Balance,
    refetch: refetchRedErc20Balance,
    isError: isErc20Error,
    error: erc20Error,
  } = useReadContract({
    abi: ERC20_ABI,
    address: RED_ERC20_ADDRESS,
    functionName: "balanceOf",
    args: targetAddress ? [targetAddress] : undefined,
    chainId: chainId,
    query: {
      enabled: Boolean(targetAddress),
    },
  });

  const {
    data: redErc223Balance,
    refetch: refetchRedErc223Balance,
    isError: isErc223Error,
    error: erc223Error,
  } = useReadContract({
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

  const canUnstake = useMemo(() => {
    if (!userStakingTimestamp || !claimDelay)
      return { canUnstake: false, timeRemaining: 0, unlockTime: 0 };

    const currentTime = Math.floor(Date.now() / 1000);
    const unlockTime = Number(userStakingTimestamp) + Number(claimDelay);
    const canUnstakeNow = currentTime >= unlockTime;
    const timeRemaining = Math.max(0, unlockTime - currentTime);

    return { canUnstake: canUnstakeNow, timeRemaining, unlockTime };
  }, [userStakingTimestamp, claimDelay]);

  const hasStaked = useMemo(() => {
    return Boolean(userStaked && typeof userStaked === "bigint" && userStaked > 0n);
  }, [userStaked]);

  const hasContribution = useMemo(() => {
    return Boolean(
      userContribution && typeof userContribution === "bigint" && userContribution > 0n,
    );
  }, [userContribution]);

  const formatTimeRemaining = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }, []);

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

  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const unstakeCountdown = useMemo(() => {
    if (!userStakingTimestamp || !claimDelay) return null;
    const unlockTime = Number(userStakingTimestamp) + Number(claimDelay);
    const remaining = Math.max(0, unlockTime - currentTime);
    return formatCountdown(remaining);
  }, [userStakingTimestamp, claimDelay, currentTime, formatCountdown]);

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

  const totalRewardUSD = useMemo(() => {
    return claimableRewards.reduce((sum, reward) => {
      return sum;
    }, 0);
  }, [claimableRewards]);

  // Calculate staking percentage
  const stakingPercentage = useMemo(() => {
    if (
      !userStaked ||
      typeof userStaked !== "bigint" ||
      !redTotalSupply ||
      typeof redTotalSupply !== "bigint" ||
      redTotalSupply === 0n
    )
      return "0";
    const scaledPercentage = (userStaked * BigInt(10 ** 7)) / redTotalSupply;

    const wholePercentage = scaledPercentage / BigInt(100000);
    const decimalPart = scaledPercentage % BigInt(100000);

    if (decimalPart === 0n) {
      return `${wholePercentage.toString()}`;
    }

    return `${wholePercentage.toString()}.${decimalPart.toString().padStart(5, "0")}`;
  }, [userStaked, redTotalSupply]);

  const getTokenInfo = useCallback((tokenType: TokenType) => {
    return {
      address: tokenType === TokenType.ERC20 ? RED_ERC20_ADDRESS : RED_ERC223_ADDRESS,
      name: tokenType === TokenType.ERC20 ? "RED (ERC20)" : "RED (ERC223)",
      type: tokenType,
    };
  }, []);

  const getAvailablePools = useCallback(() => {
    return [RED_BLU_POOL, RED_FOO_POOL];
  }, []);

  const getAvailableRewardTokens = useCallback(() => {
    return rewardTokens;
  }, [rewardTokens]);

  const addRewardToken = useCallback((token: Token) => {
    setRewardTokens((prev) => {
      if (prev.some((t) => t.address0.toLowerCase() === token.address0.toLowerCase())) {
        return prev;
      }
      return [...prev, token];
    });
  }, []);

  const removeRewardToken = useCallback((tokenAddress: Address) => {
    setRewardTokens((prev) =>
      prev.filter((t) => t.address0.toLowerCase() !== tokenAddress.toLowerCase()),
    );
  }, []);

  const refetchUserData = useCallback(() => {
    refetchUserStaked();
    refetchUserContribution();
    refetchUserContributionValue();
    refetchUserLastUpdate();
    refetchUserStakingTimestamp();
    refetchClaimDelay();
    refetchRedErc20Balance();
    refetchRedErc223Balance();
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
    refetchRedErc20Balance,
    refetchRedErc223Balance,
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
        const error = "Wallet not connected";
        setLastError(error);
        throw new Error(error);
      }

      setIsTransactionPending(true);
      setLastError(null);

      const params = {
        abi: abi || revenueABI,
        address: targetContract || contractAddress,
        functionName,
        args: args || [],
      };

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
        setLastError(error.message || "Transaction failed");
        throw error;
      }
    },
    [publicClient, walletClient, connectedAddress, chainId, addRecentTransaction, contractAddress],
  );

  const approveERC20 = useCallback(
    async (amount: bigint) => {
      return executeTransaction({
        functionName: "approve",
        args: [contractAddress, amount],
        abi: ERC20_ABI,
        address: RED_ERC20_ADDRESS,
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

  const stakeERC20 = useCallback(
    async (amount: bigint) => {
      return executeTransaction({
        functionName: "stake",
        args: [RED_ERC20_ADDRESS, amount],
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

  const depositAndStakeERC223 = useCallback(
    async (amount: bigint) => {
      // First transfer ERC223 tokens to revenue contract
      await executeTransaction({
        functionName: "transfer",
        args: [contractAddress, amount],
        abi: ERC20_ABI,
        address: RED_ERC223_ADDRESS,
        transactionTitle: {
          template: RecentTransactionTitleTemplate.TRANSFER,
          symbol: "D223",
          amount: formatUnits(amount, 18),
          logoURI: "/images/tokens/red.svg",
        },
      });

      // Then stake
      return executeTransaction({
        functionName: "stake",
        args: [RED_ERC223_ADDRESS, amount],
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
    async (tokenAddress: Address, amount: bigint) => {
      return executeTransaction({
        functionName: "withdraw",
        args: [tokenAddress, amount],
        transactionTitle: {
          template: RecentTransactionTitleTemplate.WITHDRAW,
          symbol: "D223",
          amount: formatUnits(amount, 18),
          logoURI: "/images/tokens/red.svg",
          standard: "ERC20" as any,
        },
      });
    },
    [executeTransaction],
  );

  const claimRewards = useCallback(
    async (tokenAddresses: Address[]) => {
      return executeTransaction({
        functionName: "claim",
        args: [tokenAddresses],
        transactionTitle: {
          template: RecentTransactionTitleTemplate.COLLECT,
          symbol0: "REWARDS",
          symbol1: "TOKENS",
          amount0: "1",
          amount1: tokenAddresses.length.toString(),
          logoURI0: "/images/revenue-reward.svg",
          logoURI1: "/images/tokens/placeholder.svg",
        },
      });
    },
    [executeTransaction],
  );

  return {
    contractAddress,
    chainId,
    requiredChainId: chainId,
    isCorrectNetwork,
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
    unstakeCountdown,
    claimableRewards,
    totalRewardUSD,
    rewardTokens,
    addRewardToken,
    removeRewardToken,
    setRewardTokens,
    getAvailableRewardTokens,
    formatTimeRemaining,
    formatCountdown,
    getTokenInfo,
    getAvailablePools,
    approveERC20,
    stakeERC20,
    depositAndStakeERC223,
    unstake,
    claimRewards,
    refetchUserData,
    isLoadingUserData: isLoadingUserStaked || isLoadingUserContribution,
    isTransactionPending,
    lastError,
    clearError: () => setLastError(null),
  };
}
