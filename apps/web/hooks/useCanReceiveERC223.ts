import { useMemo } from "react";
import { Address } from "viem";
import { useBytecode, useReadContract } from "wagmi";

// ERC-223 transfers to an address with code call `tokenReceived(address,uint256,bytes)` on it and
// revert unless it returns this selector.
const TOKEN_RECEIVED_SELECTOR = "0x8943ec02";
// An EIP-7702 delegated account's code is this prefix followed by the delegate's address.
const EIP7702_DELEGATION_PREFIX = "0xef0100";

const TOKEN_RECEIVED_ABI = [
  {
    type: "function",
    name: "tokenReceived",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_from", type: "address" },
      { name: "_value", type: "uint256" },
      { name: "_data", type: "bytes" },
    ],
    outputs: [{ name: "", type: "bytes4" }],
  },
] as const;

/**
 * Whether `account` can receive ERC-223 tokens.
 *
 * Plain EOAs always can. An EIP-7702 delegated EOA (for example a MetaMask smart account) runs its
 * delegate's code on every ERC-223 transfer, and most delegates do not implement `tokenReceived`,
 * so ERC-223 output to it reverts. This asks the account itself, through its delegate, instead of
 * assuming either way.
 *
 * Returns `true` while unknown, so nothing is flagged before the checks finish.
 */
export default function useCanReceiveERC223(account: Address | undefined): boolean {
  const { data: code } = useBytecode({ address: account, query: { enabled: Boolean(account) } });

  const isDelegated = Boolean(code?.toLowerCase().startsWith(EIP7702_DELEGATION_PREFIX));

  const { data: returned, isError } = useReadContract({
    address: account,
    abi: TOKEN_RECEIVED_ABI,
    functionName: "tokenReceived",
    args: account ? [account, BigInt(0), "0x"] : undefined,
    query: { enabled: Boolean(account) && isDelegated, retry: false },
  });

  return useMemo(() => {
    if (!isDelegated) return true;
    if (isError) return false;
    if (returned === undefined) return true;
    return String(returned).toLowerCase() === TOKEN_RECEIVED_SELECTOR;
  }, [isDelegated, isError, returned]);
}
