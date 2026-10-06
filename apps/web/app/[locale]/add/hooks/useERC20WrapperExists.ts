import { isZeroAddress } from "@ethereumjs/util";
import { useMemo } from "react";
import { Address, isAddress } from "viem";
import { useReadContract } from "wagmi";

import { TOKEN_CONVERTER_ABI } from "@/config/abis/tokenConverter";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { CONVERTER_ADDRESS } from "@/sdk_bi/addresses";

export default function useERC20WrapperExists({
  address,
  enabled,
}: {
  address?: Address;
  enabled: boolean;
}) {
  const chainId = useCurrentChainId();

  const { data: isWrapper, isLoading: isLoadingWrapper } = useReadContract({
    abi: TOKEN_CONVERTER_ABI,
    functionName: "isWrapper",
    address: CONVERTER_ADDRESS[chainId],
    args: [address as Address],
    chainId,
    query: {
      enabled: !!address && isAddress(address),
    },
  });

  const otherAddressFunctionName = useMemo(() => {
    if (isWrapper == null) {
      return null;
    }

    if (isWrapper) {
      return "getERC20OriginFor";
    }

    return "predictWrapperAddress";
  }, [isWrapper]);

  const otherAddressCheckFunctionName = useMemo(() => {
    if (otherAddressFunctionName !== "predictWrapperAddress") {
      return null;
    }

    return "getERC20WrapperFor";
  }, [otherAddressFunctionName]);

  const { data: otherAddress, isLoading: isLoadingOtherAddress } = useReadContract({
    abi: TOKEN_CONVERTER_ABI,
    functionName: otherAddressCheckFunctionName!,
    address: CONVERTER_ADDRESS[chainId],
    args: [address as Address],
    chainId,
    query: {
      enabled: !!address && isAddress(address) && Boolean(otherAddressCheckFunctionName),
    },
  });

  return useMemo(() => {
    if (!enabled || !otherAddressCheckFunctionName) {
      return { isErc20Exist: true };
    }

    return {
      isErc20Exist: Boolean(
        otherAddress && isAddress(otherAddress) && !isZeroAddress(otherAddress),
      ),
    };
  }, [enabled, otherAddress, otherAddressCheckFunctionName]);
}
