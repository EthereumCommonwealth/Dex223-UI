import { Address } from "viem";
import { create } from "zustand";

import { PositionInfo } from "@/hooks/usePositions";

export type WalletPositions = {
  address: Address; // wallet address
  positions: PositionInfo[];
};
interface WalletsPositionsStore {
  positions: WalletPositions[];
  setAllPositions: (walletsPositions: WalletPositions[]) => void;
  setWalletPositions: (walletBalance: WalletPositions) => void;
}

export const useWalletsPosotions = create<WalletsPositionsStore>((set, get) => ({
  positions: [],
  setAllPositions: (walletsPositions) =>
    set((state) => ({
      positions: walletsPositions,
    })),
  setWalletPositions: (walletPositions) =>
    set((state) => ({
      positions: [
        ...state.positions.filter((balance) => balance.address !== walletPositions.address),
        walletPositions,
      ],
    })),
}));
