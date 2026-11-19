import { Address } from "viem";
import { create } from "zustand";

export type WalletBalances = {
  address: Address; // wallet address
  nativeBalance: bigint;
  balances: {
    address: Address; // token address
    value: bigint;
  }[];
};
interface WalletsBalancesStore {
  balances: WalletBalances[];
  loadedKey: string | null;
  hasError: boolean;
  setAllBalances: (walletsBalances: WalletBalances[]) => void;
  setWalletBalances: (walletBalance: WalletBalances) => void;
  setBalanceStatus: (status: { loadedKey: string | null; hasError: boolean }) => void;
}

export const useWalletsBalances = create<WalletsBalancesStore>((set, get) => ({
  balances: [],
  loadedKey: null,
  hasError: false,
  setBalanceStatus: (status) => set(status),
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
