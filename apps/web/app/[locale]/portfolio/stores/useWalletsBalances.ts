import { Address } from "viem";
import { create } from "zustand";

export type WalletBalances = {
  address: Address; // wallet address
  balances: {
    address: Address; // token address
    value: BigInt;
  }[];
};
interface WalletsBalancesStore {
  balances: WalletBalances[];
  setAllBalances: (walletsBalances: WalletBalances[]) => void;
  setWalletBalances: (walletBalance: WalletBalances) => void;
}

export const useWalletsBalances = create<WalletsBalancesStore>((set, get) => ({
  balances: [],
  setAllBalances: (walletsBalances) =>
    set((state) => ({
      balances: walletsBalances,
    })),
  setWalletBalances: (walletBalances) =>
    set((state) => ({
      balances: [
        ...state.balances.filter((balance) => balance.address !== walletBalances.address),
        walletBalances,
      ],
    })),
}));
