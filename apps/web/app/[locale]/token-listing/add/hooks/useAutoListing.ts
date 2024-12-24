import { Address } from "viem";

import useAutoListingContracts, {
  useAutoListingContract,
} from "@/app/[locale]/token-listing/add/hooks/useAutoListingContracts";
import { useAutoListingContractStore } from "@/app/[locale]/token-listing/add/stores/useAutoListingContractStore";
import {
  PaymentMethod,
  usePaymentTokenStore,
} from "@/app/[locale]/token-listing/add/stores/usePaymentTokenStore";
import { DexChainId } from "@/sdk_hybrid/chains";
import { Token } from "@/sdk_hybrid/entities/token";

export type SingleAddressToken = {
  address: Address;
  chainId: DexChainId;
  name: string;
  symbol: string;
  decimals: number;
};

export type AutoListing = {
  id: Address;
  name: string;
  tokens: Token[];
  tokensToPay: PaymentMethod[];
  isFree: boolean;
  totalTokens: number;
  lastUpdated: string;
};
export default function useAutoListing(): {
  autoListing: AutoListing | undefined;
  autoListings: AutoListing[] | undefined;
  paymentToken: PaymentMethod | undefined;
} {
  const { autoListingContract } = useAutoListingContractStore();

  const { paymentToken: _paymentToken } = usePaymentTokenStore();
  const autoListings = useAutoListingContracts();
  const autoListing: AutoListing | undefined = useAutoListingContract(autoListingContract);

  return {
    autoListings,
    autoListing: autoListing,
    paymentToken: _paymentToken,
  };
}
