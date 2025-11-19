"use client";

import "react-loading-skeleton/dist/skeleton.css";

import Alert from "@repo/ui/alert";
import Tooltip from "@repo/ui/tooltip";
import clsx from "clsx";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { Address, isAddress } from "viem";
import { useAccount, useSwitchChain } from "wagmi";

import { useRevenueStore } from "@/app/[locale]/revenue/stores/useRevenueStore";
import Container from "@/components/atoms/Container";
import { SearchInput } from "@/components/atoms/Input";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import { TokenListId } from "@/db/db";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useTokens } from "@/hooks/useTokenLists";
import { DexChainId } from "@/sdk_bi/chains";
import { Token } from "@/sdk_bi/entities/token";

import { Claims } from "./components/Claims";
import StakeDialog from "./dialogs/StakeDialog";
import TokenListDropdown from "./dialogs/TokenListDropdown";
import useRevenueContract from "./hooks/useRevenueContract";
import { useStakeDialogStore } from "./stores/useStakeDialogStore";
const claimsData = [
  {
    id: 1,
    name: "Aave Token",
    symbol: "AAVE",
    logoURI: "/images/tokens/placeholder.svg",
    erc20Address: "0x5...B3C",
    erc223Address: "0xD...C93",
    amount: "0.34",
    amountUSD: "$23.13",
    fullErc20Address: "0x5B3C1234567890ABCDEF1234567890ABCDEF1234",
    fullErc223Address: "0xD1234567890ABCDEF1234567890ABCDEF1234567",
    chainId: DexChainId.MAINNET,
  },
  {
    id: 2,
    name: "Basic Attention Token",
    symbol: "BAT",
    logoURI: "/images/tokens/placeholder.svg",
    erc20Address: "0x3...B7D",
    erc223Address: "0x7...U1A",
    amount: "4.25",
    amountUSD: "$3,048.88",
    fullErc20Address: "0x3B7D1234567890ABCDEF1234567890ABCDEF1234",
    fullErc223Address: "0x7U1A1234567890ABCDEF1234567890ABCDEF1234",
    chainId: DexChainId.MAINNET,
  },
  {
    id: 3,
    name: "Binance USD",
    symbol: "BUSD",
    logoURI: "/images/tokens/placeholder.svg",
    erc20Address: "0x5...C9E",
    erc223Address: "0x5...T9E",
    amount: "245.24",
    amountUSD: "$2,047.39",
    fullErc20Address: "0x5C9E1234567890ABCDEF1234567890ABCDEF1234",
    fullErc223Address: "0x5T9E1234567890ABCDEF1234567890ABCDEF1234",
    chainId: DexChainId.MAINNET,
  },
  {
    id: 4,
    name: "Dai Stablecoin",
    symbol: "DAI",
    logoURI: "/images/tokens/placeholder.svg",
    erc20Address: "0x7...D1A",
    erc223Address: "0x3...S7D",
    amount: "73.2",
    amountUSD: "$1,534.68",
    fullErc20Address: "0x7D1A1234567890ABCDEF1234567890ABCDEF1234",
    fullErc223Address: "0x3S7D1234567890ABCDEF1234567890ABCDEF1234",
    chainId: DexChainId.MAINNET,
  },
  {
    id: 5,
    name: "Enjin Coin",
    symbol: "ENJ",
    logoURI: "/images/tokens/placeholder.svg",
    erc20Address: "0x9...E3B",
    erc223Address: "0x1...R5C",
    amount: "23.2",
    amountUSD: "$1,208.53",
    fullErc20Address: "0x9E3B1234567890ABCDEF1234567890ABCDEF1234",
    fullErc223Address: "0x1R5C1234567890ABCDEF1234567890ABCDEF1234",
    chainId: DexChainId.MAINNET,
  },
  {
    id: 6,
    name: "Kyber Network Crystal",
    symbol: "KNC",
    logoURI: "/images/tokens/placeholder.svg",
    erc20Address: "0xB...F5C",
    erc223Address: "0xE...Q3B",
    amount: "3.24",
    amountUSD: "$853.27",
    fullErc20Address: "0xBF5C1234567890ABCDEF1234567890ABCDEF1234",
    fullErc223Address: "0xEQ3B1234567890ABCDEF1234567890ABCDEF1234",
    chainId: DexChainId.MAINNET,
  },
  {
    id: 7,
    name: "Lend",
    symbol: "LEND",
    logoURI: "/images/tokens/placeholder.svg",
    erc20Address: "0xD...G7D",
    erc223Address: "0xC...P1A",
    amount: "12.3",
    amountUSD: "$351.46",
    fullErc20Address: "0xDG7D1234567890ABCDEF1234567890ABCDEF1234",
    fullErc223Address: "0xCP1A1234567890ABCDEF1234567890ABCDEF1234",
    chainId: DexChainId.MAINNET,
  },
  {
    id: 8,
    name: "ChainLink Token",
    symbol: "LINK",
    logoURI: "/images/tokens/placeholder.svg",
    erc20Address: "0x2...A1B",
    erc223Address: "0x4...C2D",
    amount: "0.3",
    amountUSD: "$203.58",
    fullErc20Address: "0x2A1B1234567890ABCDEF1234567890ABCDEF1234",
    fullErc223Address: "0x4C2D1234567890ABCDEF1234567890ABCDEF1234",
    chainId: DexChainId.MAINNET,
  },
];

const WalletSearchInput = ({
  searchValue,
  setSearchValue,
}: {
  searchValue: string;
  setSearchValue: (value: string) => void;
}) => {
  const error = Boolean(searchValue) && !isAddress(searchValue) ? "Enter a valid address" : "";

  const { hasRevenue, hasSearchRevenue } = useRevenueStore();

  useEffect(() => {
    if (searchValue) {
      hasRevenue(searchValue as Address);
    }
  }, [hasRevenue, searchValue]);

  return (
    <div className="relative w-full">
      <SearchInput
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder="Search by address"
        isError={!!error}
        style={
          searchValue && !hasSearchRevenue ? { paddingRight: "100px" } : { paddingRight: "60px" }
        }
        className={clsx(
          "bg-primary-bg w-full lg:w-[540px] h-[40px] lg:h-[48px]",
          searchValue && "pr-[100px]",
        )}
      />
      {error && <p className="text-12 text-red-light mt-1 h-4">{error}</p>}
    </div>
  );
};

export function Revenue() {
  const [searchValue, setSearchValue] = useState("");
  const [claimRewardsSearchValue, setClaimRewardsSearchValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const [selectedTokens, setSelectedTokens] = useState<Set<number>>(new Set());
  const chainId = useCurrentChainId();
  const [selectedTokenLists, setSelectedTokenLists] = useState<Set<TokenListId>>(
    new Set([`default-${chainId}` as TokenListId]),
  );
  const { openDialog } = useStakeDialogStore();
  const { switchChain } = useSwitchChain();

  const allAvailableTokens = useTokens();

  const tokensFromSelectedLists = useMemo(() => {
    return allAvailableTokens.filter((token) => {
      if (!token.isToken) return false; // Filter out native coins

      // Check if token is in any of the selected lists
      return token.lists?.some((listId) => selectedTokenLists.has(listId));
    });
  }, [allAvailableTokens, selectedTokenLists]);

  const searchAddress =
    searchValue && isAddress(searchValue) ? (searchValue as Address) : undefined;
  const {
    userStaked,
    stakingPercentage,
    isLoadingUserData,
    redTotalSupply,
    isCorrectNetwork,
    requiredChainId,
    claimableRewards,
    setRewardTokens,
    canUnstake,
    unstakeCountdown,
    hasStaked,
  } = useRevenueContract({ searchAddress });

  useEffect(() => {
    if (tokensFromSelectedLists.length > 0) {
      setRewardTokens(tokensFromSelectedLists as unknown as Token[]);
    }
  }, [tokensFromSelectedLists, setRewardTokens]);

  const mappedClaimsData = useMemo(() => {
    return claimableRewards.map((reward, index) => ({
      id: index + 1,
      name: reward.token.name || "Unknown",
      symbol: reward.token.symbol || "???",
      logoURI: reward.token.logoURI || "/images/tokens/placeholder.svg",
      erc20Address: truncateMiddle(reward.token.address0, { charsFromStart: 3, charsFromEnd: 3 }),
      erc223Address: truncateMiddle(reward.token.address1, { charsFromStart: 3, charsFromEnd: 3 }),
      amount: reward.amountFormatted,
      amountUSD: reward.amountUSD || "$0.00",
      fullErc20Address: reward.token.address0,
      fullErc223Address: reward.token.address1,
      chainId: reward.token.chainId,
      token: reward.token,
    }));
  }, [claimableRewards]);

  const handleSelectedTokens = (tokenId: number) => {
    if (tokenId === 0) {
      setSelectedTokens(new Set());
    } else {
      setSelectedTokens((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(tokenId)) {
          newSet.delete(tokenId);
        } else {
          newSet.add(tokenId);
        }
        return newSet;
      });
    }
  };

  const handleStakeClick = () => {
    openDialog("stake", "", "ERC-20");
  };

  const handleUnstakeClick = () => {
    openDialog("unstake", "", "ERC-20");
  };

  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [searchValue, claimRewardsSearchValue, error]);

  const formatStakedAmount = (amount: unknown) => {
    if (!amount || typeof amount !== "bigint") return "0";
    const divisor = BigInt(10 ** 18);
    const quotient = amount / divisor;
    const remainder = amount % divisor;

    if (remainder === 0n) {
      return quotient.toString();
    }

    const decimalPart = (remainder * BigInt(100)) / divisor;
    return `${quotient.toString()}.${decimalPart.toString().padStart(2, "0")}`;
  };

  const formatTotalSupply = (amount: unknown) => {
    if (!amount || typeof amount !== "bigint") return "0";

    const divisor = BigInt(10 ** 18);
    const quotient = amount / divisor;
    const quotientStr = quotient.toString();
    const quotientNum = Number(quotient);

    if (quotientNum >= 1000000000000000000000) {
      // Sextillions
      const sextillions = quotientNum / 1000000000000000000000;
      return `${sextillions}Sx`;
    } else if (quotientNum >= 1000000000000000000) {
      // Quintillions
      const quintillions = quotientNum / 1000000000000000000;
      return `${quintillions}Qt`;
    } else if (quotientNum >= 1000000000000000) {
      // Quadrillions
      const quadrillions = quotientNum / 1000000000000000;
      return `${quadrillions}Q`;
    } else if (quotientNum >= 1000000000000) {
      // Trillions
      const trillions = quotientNum / 1000000000000;
      return `${trillions}T`;
    } else if (quotientNum >= 1000000000) {
      // Billions
      const billions = quotientNum / 1000000000;
      return `${billions}B`;
    } else if (quotientNum >= 1000000) {
      // Millions
      const millions = quotientNum / 1000000;
      return `${millions}M`;
    }
    return quotientStr;
  };

  // Use mapped claims data or fallback to hardcoded data for demo
  const dataToUse = mappedClaimsData.length > 0 ? mappedClaimsData : claimsData;

  const filteredClaimsData = dataToUse.filter((claim) => {
    const searchLower = claimRewardsSearchValue.toLowerCase();
    return (
      claim.name.toLowerCase().includes(searchLower) ||
      claim.symbol.toLowerCase().includes(searchLower) ||
      claim.fullErc20Address.toLowerCase().includes(searchLower) ||
      claim.fullErc223Address.toLowerCase().includes(searchLower)
    );
  });

  // Determine which empty state to show
  const hasFilteredResults = filteredClaimsData.length > 0;

  return (
    <Container>
      <div className="p-4 lg:p-10 flex flex-col max-w-[100dvw]">
        <div className="flex flex-col lg:flex-row w-full justify-between items-start lg:items-center gap-4 lg:gap-0 mb-5 lg:mb-0">
          <h1 className="text-24 lg:text-40 font-medium">Revenue</h1>
          <div className="flex flex-col lg:flex-row gap-y-2 lg:gap-x-3">
            <WalletSearchInput searchValue={searchValue} setSearchValue={setSearchValue} />
          </div>
        </div>

        {/* Network Warning */}
        {address && !isCorrectNetwork && (
          <div className="mt-6 mb-5">
            <Alert
              type="warning"
              text={
                <div className="flex items-center justify-between gap-4 w-full">
                  <span className="text-14">
                    Please switch to Sepolia testnet to use the Revenue feature. Your balances are
                    only available on Sepolia.
                  </span>
                  <Button
                    size={ButtonSize.SMALL}
                    colorScheme={ButtonColor.GREEN}
                    onClick={() => switchChain?.({ chainId: requiredChainId })}
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    Switch Network
                  </Button>
                </div>
              }
            />
          </div>
        )}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {isLoadingUserData ? (
            <>
              <div className="relative flex flex-col bg-gradient-card-green-light-fill rounded-3 px-5 py-3 w-full lg:col-span-7 overflow-hidden h-[120px]">
                <SkeletonTheme
                  baseColor="#1D1E1E"
                  highlightColor="#272727"
                  borderRadius="20px"
                  enableAnimation={false}
                >
                  <div className="flex items-center gap-1 z-10">
                    <Skeleton width={90} height={20} />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 z-10">
                    <div className="flex flex-col">
                      <Skeleton width={200} height={32} className="mb-1" />
                      <Skeleton width={50} height={14} />
                    </div>

                    <div className="flex gap-2 justify-end mt-2 sm:mt-0">
                      <Skeleton width={73} height={48} />
                      <Skeleton width={90} height={48} />
                    </div>
                  </div>
                </SkeletonTheme>
                <Image
                  src="/images/revenue-image.svg"
                  alt="Side Icon"
                  width={180}
                  height={120}
                  className="absolute right-0 bottom-0 w-auto h-full max-h-full object-contain object-right-bottom pointer-events-none select-none"
                />
              </div>

              <div className="relative flex flex-col bg-primary-bg rounded-3 px-5 py-3 w-full lg:col-span-5 overflow-hidden h-[120px]">
                <SkeletonTheme
                  baseColor="#1D1E1E"
                  highlightColor="#272727"
                  borderRadius="20px"
                  enableAnimation={false}
                >
                  <div className="flex items-center gap-1 z-10">
                    <Skeleton width={100} height={20} />
                  </div>

                  <div className="flex flex-col z-10">
                    <Skeleton width={120} height={32} className="mb-1" />
                    <Skeleton width={110} height={16} />
                  </div>
                </SkeletonTheme>
                <Image
                  src="/images/revenue-reward.svg"
                  alt="Side Icon"
                  width={220}
                  height={140}
                  className="absolute right-0 bottom-0 w-auto h-full max-h-full object-contain object-right-bottom pointer-events-none select-none"
                />
              </div>
            </>
          ) : (
            <>
              <div className="relative flex flex-col bg-gradient-card-green-light-fill rounded-3 px-5 py-3 w-full lg:col-span-7 overflow-hidden h-[120px]">
                <div className="flex items-center z-10">
                  <span className="text-16 text-secondary-text">D223 staked</span>
                  <Tooltip
                    iconSize={20}
                    text="This shows your staked D223 tokens and the percentage of total supply you represent"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 z-10">
                  <div className="flex flex-col">
                    <span className="text-32 lg:text-32 font-medium">
                      {formatStakedAmount(userStaked)} / {formatTotalSupply(redTotalSupply)}
                    </span>
                    <span className="text-12 lg:text-14 text-secondary-text">
                      {stakingPercentage}%
                    </span>
                  </div>

                  <div className="flex gap-2 justify-end mt-2 sm:mt-0">
                    <button
                      type="button"
                      onClick={handleStakeClick}
                      className={clsx(
                        "border px-4 h-[48px] rounded-3 text-14 font-medium transition-colors active:scale-95",
                        "border-yellow-light bg-[#4C483C] text-white cursor-pointer",
                      )}
                    >
                      Stake
                    </button>
                    {unstakeCountdown ? (
                      <div className="border border-yellow-light bg-primary-bg text-secondary-text px-4 h-[48px] rounded-3 text-14 font-medium flex items-center">
                        {unstakeCountdown}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleUnstakeClick}
                        disabled={!canUnstake || !hasStaked}
                        className={clsx(
                          "border px-4 h-[48px] rounded-3 text-14 font-medium transition-colors active:scale-95",
                          "border-yellow-light bg-[#4C483C] text-white",
                          !canUnstake || !hasStaked
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer",
                        )}
                      >
                        Unstake
                      </button>
                    )}
                  </div>
                </div>

                <Image
                  src="/images/revenue-image.svg"
                  alt="Side Icon"
                  width={180}
                  height={120}
                  className="absolute right-0 bottom-0 w-auto h-full max-h-full object-contain object-right-bottom pointer-events-none select-none"
                />
              </div>

              <div className="relative flex flex-col bg-primary-bg rounded-3 px-5 py-3 w-full lg:col-span-5 overflow-hidden h-[120px]">
                <div className="flex items-center z-10">
                  <span className="text-16 text-secondary-text">Total reward</span>
                  <Tooltip
                    iconSize={20}
                    text="Total rewards earned from staking your D223 tokens"
                  />
                </div>

                <div className="flex flex-col z-10">
                  <span className="text-24 lg:text-32 font-medium">
                    $
                    {mappedClaimsData
                      .reduce((sum, claim) => {
                        const usdValue = parseFloat(claim.amountUSD.replace(/[$,]/g, ""));
                        return sum + usdValue;
                      }, 0)
                      .toFixed(2)}
                  </span>
                  <span className="text-12 lg:text-16 text-secondary-text">
                    {userStaked && typeof userStaked === "bigint" && userStaked > 0n
                      ? "Staking active"
                      : "Not staked yet"}
                  </span>
                </div>

                <Image
                  src="/images/revenue-reward.svg"
                  alt="Side Icon"
                  width={220}
                  height={140}
                  className="absolute right-0 bottom-0 w-auto h-full max-h-full object-contain object-right-bottom pointer-events-none select-none"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-10 flex flex-col lg:flex-row w-full justify-between items-start lg:items-center gap-4 lg:gap-0">
          <h1 className="text-18 lg:text-32 font-medium">Claim rewards</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="w-full">
              <TokenListDropdown
                selectedOptions={selectedTokenLists}
                onSelectionChange={setSelectedTokenLists}
                placeholder="Select token lists"
                searchPlaceholder="Search list name"
                className="w-full sm:w-auto"
              />
            </div>
            <div className="w-full">
              <SearchInput
                value={claimRewardsSearchValue}
                onChange={(e) => setClaimRewardsSearchValue(e.target.value)}
                placeholder="Search name or paste address"
                className="h-[48px] bg-primary-bg w-full lg:w-[540px]"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 min-h-[340px] w-full">
          {!address ? (
            <div className="flex flex-col items-center justify-center min-h-[340px] w-full bg-[#1A1A1A] rounded-3 p-8 relative overflow-hidden">
              <p className="text-14 lg:text-16 text-gray-400 text-center z-10 mb-4">
                Connect wallet to see your rewards
              </p>
              <div className="absolute top-0 right-0 flex items-end justify-end p-4 pointer-events-none">
                <Image
                  src="/images/state.svg"
                  alt="Account"
                  width={300}
                  height={200}
                  className="w-full h-auto object-contain object-right-bottom"
                />
              </div>
            </div>
          ) : !hasFilteredResults ? (
            <div className="flex flex-col items-center justify-center min-h-[340px] w-full bg-[#1A1A1A] rounded-3 relative overflow-hidden">
              <p className="text-14 lg:text-16 text-secondary-text text-center z-10 mb-4">Reward not found</p>
              <div className="absolute top-0 right-0 flex items-center justify-center pointer-events-none">
                <Image
                  src="/images/empty-state.svg"
                  alt="Search"
                  width={340}
                  height={340}
                  className="w-[340px] h-[340px] object-contain opacity-30"
                />
              </div>
            </div>
          ) : (
            <Claims
              tableData={filteredClaimsData}
              selectedTokens={selectedTokens}
              setSelectedTokens={handleSelectedTokens}
              isLoading={isLoadingUserData}
            />
          )}
        </div>
      </div>
      <StakeDialog />
    </Container>
  );
}
