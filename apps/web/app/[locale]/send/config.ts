import { type Hex, keccak256, stringToBytes } from "viem";

export const SEPOLIA_CHAIN_ID = 11155111;

/**
 * Safe Send only has contracts on Sepolia, and production builds offer Ethereum only, so the
 * menu entry is hidden there instead of leading to a page nobody can use.
 */
export const IS_SAFE_SEND_LISTED = process.env.NEXT_PUBLIC_ENV !== "production";

// Each ERC-223 address is the Dex223 converter wrapper of the ERC-20, so the safe path and
// the approve-and-wrap path deliver the same token to the recipient.
export const SAFE_SEND_TOKENS = [
  {
    symbol: "HE",
    name: "Helium",
    erc20: "0xEC5aa08386F4B20dE1ADF9Cdf225b71a133FfaBa" as const,
    erc223: "0x4f7d649dd8026EBB42DFe161DB065DD7c8a8d711" as const,
    decimals: 2,
  },
  {
    symbol: "NE",
    name: "Neon",
    erc20: "0xe39c469BeA1D805E02A31E9d8d2D78A379F2A099" as const,
    erc223: "0x149974B54cb2f68707D5221D8CBE2E905b1De0E5" as const,
    decimals: 10,
  },
  {
    symbol: "AR",
    name: "Argon",
    erc20: "0xc676e76573267cc2E053BE8637Ba71d6BA321195" as const,
    erc223: "0x61AE468f3ecB968A4B847DC6274e80d2388eD8Fa" as const,
    decimals: 1,
  },
] as const;

// Sepolia deployment of Dex223-contracts#79 (with the USDT-safe router and rescue).
export const PAYMENT_RECEIVER = "0x32480C1Edc5e51eca39FfF766cDdd9087DfC34E9" as const;
export const SAFE_SEND_ROUTER = "0x7b58D9B037C4AC84eE06208Bc0fF95Ba9b84AC7e" as const;

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const erc223Abi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "payable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;

export const balanceOfAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

/** ERC-223 recipient hook, used to check a contract can accept the token before sending. */
export const tokenReceivedAbi = [
  {
    type: "function",
    name: "tokenReceived",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_from", type: "address" },
      { name: "_value", type: "uint256" },
      { name: "_data", type: "bytes" },
    ],
    outputs: [{ type: "bytes4" }],
  },
] as const;

export const TOKEN_RECEIVED_SELECTOR = "0x8943ec02";

export const safeSendRouterAbi = [
  {
    type: "function",
    name: "wrapAndSend",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_erc20", type: "address" },
      { name: "_to", type: "address" },
      { name: "_amount", type: "uint256" },
      { name: "_data", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export function encodeInvoice(invoice: string): Hex {
  const trimmed = invoice.trim();
  if (!trimmed) return "0x";
  return keccak256(stringToBytes(trimmed));
}

export function tokenBySymbol(symbol: string) {
  const index = SAFE_SEND_TOKENS.findIndex(
    (token) => token.symbol.toLowerCase() === symbol.toLowerCase(),
  );
  return index >= 0 ? { token: SAFE_SEND_TOKENS[index], index } : null;
}
