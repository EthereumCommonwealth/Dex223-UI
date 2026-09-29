import { create } from "zustand";

import { networks } from "@/config/networks";
import { DexChainId } from "@/sdk_bi/chains";

export type WalletName = "metamask" | "wc" | "coinbase" | "trustWallet" | "keystore" | "safe";

interface ConnectWalletStore {
  walletName: WalletName;
  setName: (walletName: WalletName) => void;
  chainToConnect: DexChainId;
  setChainToConnect: (chain: DexChainId) => void;

  wcChainsToConnect: number[]; //for simultaneous connection via walletConnect
  addChainToConnect: (chain: number) => void;
  removeChainToConnect: (chain: number) => void;
}

export const useConnectWalletStore = create<ConnectWalletStore>((set, get) => ({
  walletName: "metamask",
  setName: (walletName) => set({ walletName }),

  chainToConnect:
    process.env.NEXT_PUBLIC_ENV === "production" ? DexChainId.MAINNET : DexChainId.SEPOLIA,
  setChainToConnect: (chainToConnect) => set({ chainToConnect }),

  wcChainsToConnect: networks.map((network) => network.chainId),
  addChainToConnect: (chain) => {
    const newChainsSet = [...get().wcChainsToConnect, chain];
    return set({ wcChainsToConnect: newChainsSet });
  },
  removeChainToConnect: (chain) => {
    const newChainsSet = [...get().wcChainsToConnect].filter((e) => e !== chain);
    return set({ wcChainsToConnect: newChainsSet });
  },
}));

interface ConnectWalletDialogStateStore {
  isOpened: boolean;
  setIsOpened: (isOpened: boolean) => void;
}
export const useConnectWalletDialogStateStore = create<ConnectWalletDialogStateStore>(
  (set, get) => ({
    isOpened: false,
    setIsOpened: (isOpened) => set({ isOpened }),
  }),
);
