import { create } from "zustand";

import { ManageTokensDialogContent } from "@/components/manage-tokens/types";
import { TokenListId } from "@/db/db";

type AddNewListTab = number;
interface AddNewListDialogStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeTab: AddNewListTab;
  setActiveTab: (activeTab: AddNewListTab) => void;
  content: ManageTokensDialogContent;
  setContent: (content: ManageTokensDialogContent) => void;
  scrollTo: TokenListId | null;
  setScrollTo: (scrollTo: TokenListId | null) => void;
}

export const useAddNewListDialogStore = create<AddNewListDialogStore>((set, get) => ({
  isOpen: false,
  activeTab: 0,
  content: "default",
  scrollTo: null,

  setIsOpen: (isOpen) => set({ isOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setContent: (content) => set({ content }),
  setScrollTo: (scrollTo) => set({ scrollTo }),
}));
