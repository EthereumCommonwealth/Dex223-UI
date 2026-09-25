import { findIndex } from "lodash";
import uniqby from "lodash.uniqby";
import { Address } from "viem";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RevenueStore {
  revenues: {
    address: Address;
    isActive: boolean;
    isConnectedWallet?: boolean;
  }[];
  hasRevenue: (address: Address) => void;
  setShowFromSearch: (value: boolean) => void;
  addRevenue: (address: Address) => void;
  removeRevenue: (address: Address) => void;
  setIsRevenueActive: (address: Address, isActive: boolean) => void;
  setAllRevenueActive: () => void;
  isConnectedWalletActive: boolean;
  setIsConnectedWalletActive: (isActive: boolean) => void;
  isAllRevenueActive: boolean;
  hasSearchRevenue: boolean;
  showFromSearch: boolean;
}

interface RevenueSearchStore {
  searchValue: string;
  setSearchValue: (value: string) => void;
}

const localStorageKey = "revenue-state";

const checkAllActive = (revenues: any[]) => {
  let allActive = true;
  for (let revenue of revenues) {
    if (!revenue.isActive) {
      allActive = false;
      break;
    }
  }
  return allActive;
};

export const useRevenueStore = create<RevenueStore>()(
  persist(
    (set) => ({
      revenues: [],
      setShowFromSearch: (value) =>
        set(() => ({
          showFromSearch: value,
        })),
      hasRevenue: (address) =>
        set((state) => {
          const res = findIndex(state.revenues, function (o) {
            return o.address.toString().toLowerCase() == address.toString().toLowerCase();
          });
          return { hasSearchRevenue: res > -1 };
        }),
      addRevenue: (address) =>
        set((state) => ({
          revenues: uniqby([...state.revenues, { address, isActive: true }], "address"),
        })),
      removeRevenue: (address) =>
        set((state) => ({
          revenues: state.revenues.filter((revenue) => revenue.address !== address),
        })),
      setIsRevenueActive: (address, isActive) =>
        set((state) => {
          const revenues = uniqby(
            state.revenues.map((revenue) => {
              if (revenue.address === address) {
                return {
                  ...revenue,
                  isActive,
                };
              } else {
                return revenue;
              }
            }),
            "address",
          );

          let allActive = checkAllActive(revenues);
          return { revenues, isAllRevenueActive: allActive && state.isConnectedWalletActive };
        }),
      setAllRevenueActive: () =>
        set((state) => {
          const newVal = !state.isAllRevenueActive;

          return {
            isConnectedWalletActive: newVal,
            isAllRevenueActive: newVal,
            revenues: uniqby(
              state.revenues.map((revenue) => {
                return {
                  ...revenue,
                  isActive: newVal,
                };
              }),
              "address",
            ),
          };
        }),
      isConnectedWalletActive: true,
      hasSearchRevenue: false,
      isAllRevenueActive: false,
      showFromSearch: false,
      setIsConnectedWalletActive: (isActive) =>
        set((state) => {
          const iaAllActive = isActive ? checkAllActive(state.revenues) : false;
          return { isConnectedWalletActive: isActive, isAllRevenueActive: iaAllActive };
        }),
    }),
    {
      name: localStorageKey, // name of the item in the storage (must be unique)
      // storage: typeof window !== "undefined" && window.localStorage ? localStorage : undefined,
    },
  ),
);

export enum ActiveTab {
  overview = "overview",
  analytics = "analytics",
  transactions = "transactions",
  settings = "settings",
}

interface RevenueActiveTabStore {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const useRevenueActiveTabStore = create<RevenueActiveTabStore>((set) => ({
  activeTab: ActiveTab.overview,
  setActiveTab: (tab) =>
    set(() => ({
      activeTab: tab,
    })),
}));
