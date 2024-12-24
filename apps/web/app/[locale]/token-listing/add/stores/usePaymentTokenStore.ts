import { create } from "zustand";

import { SingleAddressToken } from "@/app/[locale]/token-listing/add/hooks/useAutoListing";

export type PaymentMethod = { token: SingleAddressToken; price: bigint };

interface ListTokensStore {
  paymentToken: PaymentMethod | undefined;
  setPaymentToken: (paymentMethod: PaymentMethod | undefined) => void;
  reset: () => void;
}

export const usePaymentTokenStore = create<ListTokensStore>((set, get) => ({
  paymentToken: undefined,
  setPaymentToken: (paymentMethod) => set({ paymentToken: paymentMethod }),

  reset: () =>
    set({
      paymentToken: undefined,
    }),
}));
