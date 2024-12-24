import { Address } from "viem";
import { create } from "zustand";

import { Token } from "@/sdk_hybrid/entities/token";

export type WalletDeposite = {
  token: Token;
  contractAddress: Address;
  deposited: bigint;
  approved: bigint;
};

export type WalletDeposites = {
  address: Address; // wallet address
  deposites: WalletDeposite[];
};

interface WalletsDepositesStore {
  deposites: WalletDeposites[];
  setAllDeposites: (walletsDeposites: WalletDeposites[]) => void;
  setWalletDeposites: (walletsDeposites: WalletDeposites) => void;
}

export const useWalletsDeposites = create<WalletsDepositesStore>((set, get) => ({
  deposites: [],
  approves: [],
  setAllDeposites: (walletsDeposites: WalletDeposites[]) =>
    set(() => ({
      deposites: walletsDeposites,
    })),
  setWalletDeposites: (walletsDeposites: WalletDeposites) =>
    set((state) => ({
      deposites: [
        ...state.deposites.filter((balance) => balance.address !== walletsDeposites.address),
        walletsDeposites,
      ],
    })),
}));
