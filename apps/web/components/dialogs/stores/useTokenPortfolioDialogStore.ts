import { create } from "zustand";

import { Token } from "@/sdk_bi/entities/token";

interface TokenPortfolioDialogStore {
  token: Token | null;
  isOpen: boolean;
  handleOpen: (token: Token) => void;
  handleClose: () => void;
}

export const useTokenPortfolioDialogStore = create<TokenPortfolioDialogStore>((set, get) => ({
  token: null,
  isOpen: false,
  handleOpen: (token) => set({ token, isOpen: true }),
  handleClose: () => {
    set({ isOpen: false });
    setTimeout(() => {
      set({ token: null });
    }, 500);
  },
}));
