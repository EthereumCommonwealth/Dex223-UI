import { findIndex } from "lodash";
import uniqby from "lodash.uniqby";
import { Address } from "viem";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PortfolioStore {
  wallets: {
    address: Address;
    isActive: boolean;
    isConnectedWallet?: boolean;
  }[];
  hasWallet: (address: Address) => void;
  setShowFromSearch: (value: boolean) => void;
  addWallet: (address: Address) => void;
  removeWallet: (address: Address) => void;
  setIsWalletActive: (address: Address, isActive: boolean) => void;
  setAllWalletActive: () => void;
  isConnectedWalletActive: boolean;
  setIsConnectedWalletActive: (isActive: boolean) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  isAllWalletActive: boolean;
  hasSearchWallet: boolean;
  showFromSearch: boolean;
}

const localStorageKey = "portfolio-state";

const checkAllActive = (wallets: any[]) => {
  let allActive = true;
  for (let wallet of wallets) {
    if (!wallet.isActive) {
      allActive = false;
      break;
    }
  }
  return allActive;
};

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set) => ({
      wallets: [],
      setShowFromSearch: (value) =>
        set(() => ({
          showFromSearch: value,
        })),
      hasWallet: (address) =>
        set((state) => {
          const res = findIndex(state.wallets, function (o) {
            return o.address.toString().toLowerCase() == address.toString().toLowerCase();
          });
          return { hasSearchWallet: res > -1 };
        }),
      addWallet: (address) =>
        set((state) => ({
          wallets: uniqby([...state.wallets, { address, isActive: true }], "address"),
        })),
      removeWallet: (address) =>
        set((state) => ({ wallets: state.wallets.filter((wallet) => wallet.address !== address) })),
      setIsWalletActive: (address, isActive) =>
        set((state) => {
          const wallets = uniqby(
            state.wallets.map((wallet) => {
              if (wallet.address === address) {
                return {
                  ...wallet,
                  isActive,
                };
              } else {
                return wallet;
              }
            }),
            "address",
          );

          let allActive = checkAllActive(wallets);
          return { wallets, isAllWalletActive: allActive && state.isConnectedWalletActive };
        }),
      setAllWalletActive: () =>
        set((state) => {
          const newVal = !state.isAllWalletActive;

          return {
            isConnectedWalletActive: newVal,
            isAllWalletActive: newVal,
            wallets: uniqby(
              state.wallets.map((wallet) => {
                return {
                  ...wallet,
                  isActive: newVal,
                };
              }),
              "address",
            ),
          };
        }),
      isConnectedWalletActive: true,
      hasSearchWallet: false,
      isAllWalletActive: false,
      showFromSearch: false,
      setIsConnectedWalletActive: (isActive) =>
        set((state) => {
          const iaAllActive = isActive ? checkAllActive(state.wallets) : false;
          return { isConnectedWalletActive: isActive, isAllWalletActive: iaAllActive };
        }),
      searchValue: "",
      setSearchValue: (value) =>
        set(() => ({
          searchValue: value,
        })),
    }),
    {
      name: localStorageKey, // name of the item in the storage (must be unique)
      // storage: typeof window !== "undefined" && window.localStorage ? localStorage : undefined,
    },
  ),
);

export enum ActiveTab {
  balances = "balances",
  margin = "margin",
  lending = "lending",
  liquidity = "liquidity",
  deposited = "deposited",
}

interface PortfolioActiveTabStore {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const usePortfolioActiveTabStore = create<PortfolioActiveTabStore>((set) => ({
  activeTab: ActiveTab.balances,
  setActiveTab: (tab) =>
    set(() => ({
      activeTab: tab,
    })),
}));
