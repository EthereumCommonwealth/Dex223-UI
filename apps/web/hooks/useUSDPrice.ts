import { useLazyQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useMemo, useState } from "react";
import { Address } from "viem";

import { apolloClient } from "@/graphql/thegraph/apollo";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useUSDPriceStore } from "@/stores/useUSDPriceStore";

const queryPrice = gql(`
  query USDPrice($address: String!) {
    token(id: $address) {
      name
      tokenDayData {
        priceUSD
      }
    }
  }
`);

const queryPrices = gql(`
  query USDPrices {
  tokens {
    id
    tokenDayData(first: 1, orderBy: date, orderDirection: desc) {
      priceUSD
      date
    }
  }
}
`);

let isInitialized = false;
let isInitializing = false;
export const useUSDPrice = (tokenAddress: Address | undefined) => {
  const { prices, loading, setPrice, setLoading, setPrices } = useUSDPriceStore();
  const chainId = useCurrentChainId();
  const [error, setError] = useState<string | null>(null);
  const client = useMemo(() => {
    return apolloClient(chainId);
  }, [chainId]);

  const [getPrice] = useLazyQuery(queryPrice, { client });
  const [getPrices] = useLazyQuery(queryPrices, { client });

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const priceData = await getPrices();

        const pricesObj: Record<string, number> = {};

        priceData.data?.tokens.forEach(
          (token: { id: string; tokenDayData: { priceUSD: number }[] }) => {
            const price = token?.tokenDayData[0].priceUSD;
            const address = token?.id;
            pricesObj[address] = price;
          },
        );

        console.log(pricesObj);
        setPrices(pricesObj);
      } catch (error) {
        console.log(error);
      } finally {
        isInitializing = false;
        isInitialized = true;
      }
    };

    if (!isInitialized && !isInitializing) {
      console.log("Initialize tokens");
      isInitializing = true;
      fetchPrices();
    }
  }, [getPrices, setPrices]);
  // Fetch price if not available and not already loading
  useEffect(() => {
    const fetchPrice = async () => {
      if (!tokenAddress || loading[tokenAddress] || prices[tokenAddress] !== undefined) return;

      setLoading(tokenAddress, true);
      try {
        const priceData = await getPrice({ variables: { address: tokenAddress.toLowerCase() } });

        if (priceData.data?.token) {
          const price =
            priceData.data.token?.tokenDayData[priceData.data.token?.tokenDayData.length - 1]
              .priceUSD;
          setError(null);
          setPrice(tokenAddress.toLowerCase(), price);
        } else {
          setError("Token price not found");
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${tokenAddress}:`, error);
        setError(`Failed to fetch price for ${tokenAddress}`); // Set error message
      } finally {
        setLoading(tokenAddress, false);
      }
    };

    if (
      tokenAddress &&
      prices[tokenAddress.toLowerCase()] === undefined &&
      !loading[tokenAddress] &&
      !error &&
      isInitialized &&
      !isInitializing
    ) {
      console.log(`No price for token ${tokenAddress}, fetching...`);
      console.log(prices);
      fetchPrice();
    }
  }, [tokenAddress, prices, loading, setLoading, setPrice, getPrice, error, chainId]);

  return {
    price: tokenAddress ? prices[tokenAddress.toLowerCase()] : undefined,
    isLoading:
      tokenAddress &&
      (loading[tokenAddress] || prices[tokenAddress] === undefined || !isInitialized),
    error,
  };
};
