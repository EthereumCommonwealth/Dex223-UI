import { keccak256, toHex } from "viem";

// The ERC-1820 registry has the same address on every EVM chain.
export const ERC1820_REGISTRY_ADDRESS = "0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24" as const;

// Every ERC-777 token must register itself in ERC-1820 under this interface hash.
export const ERC777_TOKEN_INTERFACE_HASH = keccak256(toHex("ERC777Token"));

export const ERC1820_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_addr", type: "address" },
      { internalType: "bytes32", name: "_interfaceHash", type: "bytes32" },
    ],
    name: "getInterfaceImplementer",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
