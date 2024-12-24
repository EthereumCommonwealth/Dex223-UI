import { multicall } from "@wagmi/core";
import { useEffect, useMemo } from "react";
import { Address } from "viem";

import { ERC20_ABI } from "@/config/abis/erc20";
import { config } from "@/config/wagmi/config";
import { useTokens } from "@/hooks/useTokenLists";
import { Token } from "@/sdk_hybrid/entities/token";

import { useActiveAddresses } from "./hooks";
import { useWalletsBalances, WalletBalances } from "./useWalletsBalances";

const getWalletBalances = async (addressToCheck: Address, tokens: Token[]) => {
  const calls = [
    ...tokens.map(({ address0 }) => ({
      address: address0,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [addressToCheck],
    })),
    ...tokens.map(({ address1 }) => ({
      address: address1,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [addressToCheck],
    })),
  ];

  const result = await multicall(config, {
    contracts: calls,
  });

  const balances = tokens.reduce(
    (acc, { address0, address1 }, index) => {
      if (!result?.length) return acc;
      const index0 = index;
      const index1 = index + tokens.length;
      const balance0 = {
        address: address0,
        value: result[index0].status === "success" ? (result[index0].result as BigInt) : BigInt(0),
      };
      const balance1 = {
        address: address1,
        value: result[index1].status === "success" ? (result[index1].result as BigInt) : BigInt(0),
      };

      return [...acc, balance0, balance1];
    },
    [] as WalletBalances["balances"],
  );

  const walletBalances: WalletBalances = {
    address: addressToCheck,
    balances,
  };

  return walletBalances;
};

export const useActiveWalletBalances = () => {
  const { activeAddresses } = useActiveAddresses();
  const tokens = useTokens();
  const { balances, setWalletBalances, setAllBalances } = useWalletsBalances();

  useEffect(() => {
    (async () => {
      const walletsBalances = await Promise.all(
        activeAddresses.map((address) => {
          return getWalletBalances(
            address,
            tokens.map((token) => token.wrapped),
          );
        }),
      );
      setAllBalances(walletsBalances);
    })();
  }, [tokens, activeAddresses, setAllBalances]);

  const tokenBalances = useMemo(() => {
    return tokens.map((token) => {
      const amountERC20 = balances.reduce((acc, { address, balances }) => {
        const amount = balances.find(
          ({ address }) => address.toLowerCase() === token.wrapped.address0.toLowerCase(),
        );
        return amount ? acc + (amount.value as any) : acc;
      }, BigInt(0));

      const amountERC223 = balances.reduce((acc, { address, balances }) => {
        const amount = balances.find(
          ({ address }) => address.toLowerCase() === token.wrapped.address1.toLowerCase(),
        );
        return amount ? acc + (amount.value as any) : acc;
      }, BigInt(0));

      return {
        token,
        amountERC20: amountERC20 || BigInt(0),
        amountERC223: amountERC223 || BigInt(0),
        amountFiat: "$ —",
      };
    });
  }, [tokens, balances]);

  return { tokenBalances, activeAddresses };
};
