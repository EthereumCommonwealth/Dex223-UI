import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";
import { Address } from "viem";

import { AutoListing } from "@/app/[locale]/token-listing/add/hooks/useAutoListing";
import useAutoListingApolloClient from "@/hooks/useAutoListingApolloClient";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { DexChainId } from "@/sdk_hybrid/chains";
import { Token } from "@/sdk_hybrid/entities/token";

const query = gql(`
  query AutoListings($first: Int!) {
    autoListings(first: $first) {
      id
      owner
      name
      url
      totalTokens
      lastUpdated
      pricesDetail {
        id
        feeTokenAddress {
          id
          name
          symbol
          address
          decimals
          inConverter
        }
        price
      }
      tokens {
        token {
          addressERC20
          addressERC223
          decimals
          id
          name
          symbol
        }
      }
    }
  }
`);

type GqlToken = {
  addressERC20: Address;
  addressERC223: Address;
  decimals: string;
  symbol: string;
  name: string;
};

type GqlFeeToken = {
  address: Address;
  decimals: string;
  symbol: string;
  name: string;
};

type GqlAutoListing = {
  id: Address;
  owner: Address;
  name: string;
  lastUpdated: string;
  totalTokens: string;
  tokens: Array<{ token: GqlToken }>;
  pricesDetail: Array<{ feeTokenAddress: GqlFeeToken; price: string }>;
};

function serializeAutoListing(gqlAutoListing: GqlAutoListing, chainId: DexChainId): AutoListing {
  return {
    id: gqlAutoListing.id,
    name: gqlAutoListing.name,
    tokens: gqlAutoListing.tokens.map(({ token }) => {
      return new Token(
        chainId,
        token.addressERC20,
        token.addressERC223,
        +token.decimals,
        token.symbol,
        token.name,
        "/images/tokens/placeholder.svg",
      );
    }),
    totalTokens: +gqlAutoListing.totalTokens,
    lastUpdated: gqlAutoListing.lastUpdated,
    tokensToPay: gqlAutoListing.pricesDetail.map(({ feeTokenAddress, price }) => {
      return {
        token: {
          symbol: feeTokenAddress.symbol,
          name: feeTokenAddress.name,
          address: feeTokenAddress.address,
          chainId,
          decimals: +feeTokenAddress.decimals,
        },
        price: BigInt(price),
      };
    }),
    isFree: !Boolean(gqlAutoListing.pricesDetail.length),
  };
}

export default function useAutoListingContracts(): AutoListing[] | undefined {
  const chainId = useCurrentChainId();
  const client = useAutoListingApolloClient();
  const autoListings = useQuery(query, {
    client,
    variables: {
      first: 10,
    },
  });

  return useMemo(() => {
    return autoListings.data?.autoListings.map((autoListing: GqlAutoListing) =>
      serializeAutoListing(autoListing, chainId),
    );
  }, [autoListings.data?.autoListings, chainId]);
}

export function useAutoListingContract(address: Address | undefined): AutoListing | undefined {
  const listings = useAutoListingContracts();

  if (!address) {
    return;
  }

  return listings?.find((listing) => listing.id.toLowerCase() === address.toLowerCase());
}
