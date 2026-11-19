import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";
import { Address } from "viem";

import { AutoListing } from "@/app/[locale]/token-listing/add/hooks/useAutoListing";
import { orderListingContracts } from "@/functions/listingContracts";
import useAutoListingApolloClient from "@/hooks/useAutoListingApolloClient";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { CORE_AUTO_LISTING_ADDRESS, FREE_AUTO_LISTING_ADDRESS } from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";
import { Token } from "@/sdk_bi/entities/token";

const AUTOLISTING_BLACKLIST = [
  "0x6a5ff6c7b1ea8e9b9e40da3b162468b61e40584f",
  "0x39491101f7d46E9f0c3217D2eB91C016F761aD59",
  "0x50eefb898f8209173ab7e812794a103c1793dc58",
  "0xb568e95591175d61345a8daef225483c120d01c4",
  "0x0dc218cf5b88dd7add4a0d1b7ba4343884bad6df",
  "0xF2A975e0Af1F9D39b4E7CA45b84EbD8b5B67756F",
  "0x250D7Ed2D4daD78bACDafA8B4C2b6298323a86bB",
  "0x163168354cE9BDcE073850B85CC6306d715474B4",
  "0x45DCb59D97809955192EFE86D5c5ba9a6ad3baC2",
  "0x13ddc6460c705d29d37b18a906c7fe69fa9e711d",
  "0xbfbd1a95e551ba8de2dc1c84843d9df5c52619a3",
  "0xf851ffe03478f0bfebd4337287f315350cc311c2",
  // Sepolia v3 lists (factory 0xf07c), replaced by the v4 lists on 2026-10-30
  "0xF35AB968Eb874A56244e7df1D569F06aEf327936",
  "0x0F81b549eE7DB363fbbb4358B9004C2AB97C7118",
  "0x063fd9a30f75c3b8a1ffb22167fc0984dfba1adf",
  "0x5c24027303865b744f2794945aee88eA56F1F5ee",
  "0x8D13f2795228aB18faeFBdF9461E7E46b5853Bc5",
  // Mainnet core and free autolistings replaced on 2026-09-22. They are bound to older factories
  // (0x8dae...bc06 and 0xc0c5...8F1f), so a listing there, paid or free, does not reach the current DEX.
  "0x029f10E06Dc7d6264f9432ACA3F52572543c48e0",
  "0xa7089d8cbcC47543388A346Dd6EbF0B05106A477",
  // Sepolia core and free autolistings replaced with the v2 factory 0xeA0A...37eb. They are bound to
  // the old factory 0x5D63...50f9, so every v2 pool reverts with "Token pool is not a part of Dex223 factory."
  "0x8a1839E6b7b4538a15de8865891FcE6e24a27ddA",
  "0xBC5fC0bbd73DF985Cc28c9367407f9FfB1FD4CC3",
  // Mainnet core and free autolistings replaced with the v2 factory 0x8990...C3a5 on 2026-10-07.
  // They are bound to 0xeA0A...37eb, so a listing there does not reach the v2 pools.
  "0x83E1e7f47536515db9Ec4D7C4024e7395CD11A48",
  "0xCc46E110426958E83e9298d46a50572691065eC5",
  // Sepolia v2 core and free autolistings, replaced with the v3 factory 0xf07c...42B9 on 2026-10-07.
  // They are bound to 0xeA0A...37eb, so a listing there does not reach the v3 pools.
  "0xcF08b4d75B20c2b6B2C3EF5921a60B15CE7B010a",
  "0x5BDdb8BF9404DFBF2C45c4eEad817F5e54782734",
  // Sepolia v4 core and free autolistings (factory 0x4EC0...3460), replaced by v5 on 2026-11-04.
  "0x31e1ec42C4dC30E50B2791F3a8e237399c498c3b",
  "0xe53760E2873A3103f0Cb7664C23CAA5273e6FF2e",
  // Sepolia v5 core and free autolistings (factory 0x186a...Fd12), replaced by v6 on 2026-11-07.
  // A listing on any of these four does not reach the v6 pools.
  "0x0ABCb3321e0d208A0D961a6ab199339389382c06",
  "0x87D82638eAbA509832C6027CEC76CA7BDF0D415F",
];

// The names of Dex223's own lists. Another contract registered under one of them is left out.
const OFFICIAL_LISTING_NAMES = ["Dex223 Core Autolisting", "Dex223 Free Auto-listing"];

// The official lists are fetched by address, so other contracts cannot push them off the first
// page: the subgraph returns contracts ordered by address, which anyone can choose.
const query = gql(`
  query AutoListings($first: Int!, $official: [String!], $exclude: [String!]) {
    official: autoListings(where: {id_in: $official}) {
      ...AutoListingFields
    }
    others: autoListings(first: $first, where: {id_not_in: $exclude}) {
      ...AutoListingFields
    }
  }

  fragment AutoListingFields on AutoListing {
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
  const official = useMemo(
    () =>
      [CORE_AUTO_LISTING_ADDRESS[chainId], FREE_AUTO_LISTING_ADDRESS[chainId]]
        .filter(Boolean)
        .map((address) => address.toLowerCase()),
    [chainId],
  );
  const autoListings = useQuery(query, {
    client,
    variables: {
      first: 10,
      official,
      exclude: [...AUTOLISTING_BLACKLIST.map((v) => v.toLowerCase()), ...official],
    },
  });

  return useMemo(() => {
    if (!autoListings.data) return undefined;
    return orderListingContracts<GqlAutoListing>(
      official,
      autoListings.data.official ?? [],
      autoListings.data.others ?? [],
      OFFICIAL_LISTING_NAMES,
    ).map((autoListing) => serializeAutoListing(autoListing, chainId));
  }, [autoListings.data, official, chainId]);
}

export function useAutoListingContract(address: Address | undefined): AutoListing | undefined {
  const listings = useAutoListingContracts();

  if (!address) {
    return;
  }

  return listings?.find((listing) => listing.id.toLowerCase() === address.toLowerCase());
}
