import { isZeroAddress } from "@ethereumjs/util";
import { useMemo } from "react";
import { Address, isAddress } from "viem";
import { useReadContract } from "wagmi";

import { ERC20_ABI } from "@/config/abis/erc20";
import { ERC223_ABI } from "@/config/abis/erc223";
import { TOKEN_CONVERTER_ABI } from "@/config/abis/tokenConverter";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { CONVERTER_ADDRESS } from "@/sdk_bi/addresses";
import { Token } from "@/sdk_bi/entities/token";

export default function useDerivedTokenInfo({
  tokenAddressToImport,
  enabled,
}: {
  tokenAddressToImport: Address;
  enabled: boolean;
}) {
  const chainId = useCurrentChainId();

  const {
    data: tokenName,
    isFetched,
    isLoading: isLoadingName,
  } = useReadContract({
    abi: ERC20_ABI,
    functionName: "name",
    chainId,
    address: tokenAddressToImport! as Address,
    query: {
      enabled: !!tokenAddressToImport && isAddress(tokenAddressToImport),
    },
  });

  const { data: tokenSymbol, isLoading: isLoadingSymbol } = useReadContract({
    abi: ERC20_ABI,
    functionName: "symbol",
    address: tokenAddressToImport! as Address,
    chainId,
    query: {
      enabled: !!tokenAddressToImport && isAddress(tokenAddressToImport),
    },
  });

  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadContract({
    abi: ERC20_ABI,
    functionName: "decimals",
    address: tokenAddressToImport! as Address,
    chainId,
    query: {
      enabled: !!tokenAddressToImport && isAddress(tokenAddressToImport),
    },
  });

  const { data: standard, isLoading: isLoadingStandard } = useReadContract({
    abi: ERC223_ABI,
    functionName: "standard",
    address: tokenAddressToImport as Address,
    chainId,
    query: {
      enabled: !!tokenAddressToImport && isAddress(tokenAddressToImport),
      // Plain ERC-20 tokens have no standard() and revert. That is the expected answer, so do not
      // retry it: the retries kept the import dialog on a spinner for about 7 seconds.
      retry: false,
    },
  });

  const { data: isWrapper, isLoading: isLoadingWrapper } = useReadContract({
    abi: TOKEN_CONVERTER_ABI,
    functionName: "isWrapper",
    address: CONVERTER_ADDRESS[chainId],
    args: [tokenAddressToImport as Address],
    chainId,
    query: {
      enabled: !!tokenAddressToImport && isAddress(tokenAddressToImport),
    },
  });

  const otherAddressFunctionName = useMemo(() => {
    if (isWrapper == null) {
      return null;
    }

    if (isWrapper) {
      if (standard === 223) {
        return "getERC20OriginFor";
      }
      return "getERC223OriginFor";
    }

    return "predictWrapperAddress";
  }, [isWrapper, standard]);

  const otherAddressCheckFunctionName = useMemo(() => {
    if (otherAddressFunctionName !== "predictWrapperAddress") {
      return null;
    }

    if (standard === 223) {
      return "getERC20WrapperFor";
    }
    return "getERC223WrapperFor";
  }, [otherAddressFunctionName, standard]);

  const { data: otherAddress, isLoading: isLoadingOtherAddress } = useReadContract({
    abi: TOKEN_CONVERTER_ABI,
    functionName: otherAddressCheckFunctionName!,
    address: CONVERTER_ADDRESS[chainId],
    args: [tokenAddressToImport as Address],
    chainId,
    query: {
      enabled:
        !!tokenAddressToImport &&
        isAddress(tokenAddressToImport) &&
        Boolean(otherAddressCheckFunctionName),
    },
  });
  console.log(otherAddress);

  const { data: predictedOtherAddress, isLoading: isLoadingOtherAddressFunction } = useReadContract(
    {
      abi: TOKEN_CONVERTER_ABI,
      functionName: otherAddressFunctionName!,
      address: CONVERTER_ADDRESS[chainId],
      args: [tokenAddressToImport as Address, standard !== 223],
      chainId,
      query: {
        enabled:
          !!tokenAddressToImport &&
          isAddress(tokenAddressToImport) &&
          Boolean(otherAddressFunctionName),
      },
    },
  );

  console.log(predictedOtherAddress);

  const { erc20AddressToImport, erc223AddressToImport, isErc20Exist, isErc223Exist } =
    useMemo(() => {
      if (standard && +standard === 223) {
        return {
          erc20AddressToImport: predictedOtherAddress,
          erc223AddressToImport: tokenAddressToImport,
          isErc20Exist: otherAddress && isAddress(otherAddress) && !isZeroAddress(otherAddress),
          isErc223Exist: true,
        };
      }

      return {
        erc20AddressToImport: tokenAddressToImport,
        erc223AddressToImport: predictedOtherAddress,
        isErc223Exist: otherAddress && isAddress(otherAddress) && !isZeroAddress(otherAddress),
        isErc20Exist: true,
      };
    }, [otherAddress, predictedOtherAddress, standard, tokenAddressToImport]);

  const isTokenLoading = useMemo(() => {
    console.log("isLoadingSymbol", isLoadingSymbol);
    console.log("isLoadingDecimals", isLoadingDecimals);
    console.log("isLoadingStandard", isLoadingStandard);
    console.log("isLoadingName", isLoadingName);
    console.log("isLoadingOtherAddressFunction", isLoadingOtherAddressFunction);

    if (!enabled) {
      return false;
    }

    return (
      isLoadingStandard ||
      isLoadingDecimals ||
      isLoadingName ||
      isLoadingOtherAddressFunction ||
      isLoadingOtherAddress ||
      isLoadingSymbol ||
      isLoadingWrapper
    );
  }, [
    enabled,
    isLoadingDecimals,
    isLoadingName,
    isLoadingOtherAddress,
    isLoadingOtherAddressFunction,
    isLoadingStandard,
    isLoadingSymbol,
    isLoadingWrapper,
  ]);

  const token = useMemo(() => {
    if (
      !tokenSymbol ||
      !tokenName ||
      !tokenDecimals ||
      !enabled ||
      !erc20AddressToImport ||
      !erc223AddressToImport ||
      isTokenLoading
    ) {
      console.log("Not enought data");
      return null;
    }

    return new Token(
      chainId,
      erc20AddressToImport as Address,
      erc223AddressToImport as Address,
      tokenDecimals as number,
      tokenSymbol as string,
      tokenName as string,
      "/images/tokens/placeholder.svg",
    );
  }, [
    chainId,
    enabled,
    erc20AddressToImport,
    erc223AddressToImport,
    isTokenLoading,
    tokenDecimals,
    tokenName,
    tokenSymbol,
  ]);

  return { token, isLoading: isTokenLoading };
}
