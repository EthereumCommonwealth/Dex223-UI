// The RevenueV2 functions this app calls (Dex223_Contracts contracts/dex-periphery/RevenueV2.sol), taken
// from the compiled artifact. Kept to what is used: the full 59-entry ABI typed `as const` makes TypeScript
// give up on wagmi's inferred types ("type instantiation is excessively deep").
export const REVENUE_ABI = [
  {
    inputs: [
      {
        name: "tokens",
        type: "address[]",
      },
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claim_delay",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "user",
        type: "address",
      },
      {
        name: "token",
        type: "address",
      },
    ],
    name: "earned",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "emergency_withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "",
        type: "address",
      },
      {
        name: "",
        type: "address",
      },
    ],
    name: "erc223deposit",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "reward_duration",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "_token",
        type: "address",
      },
      {
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "",
        type: "address",
      },
    ],
    name: "staked",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "",
        type: "address",
      },
      {
        name: "",
        type: "address",
      },
    ],
    name: "staked_by_version",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "",
        type: "address",
      },
    ],
    name: "staking_timestamp",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "staking_token_erc20",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "staking_token_erc223",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "total_staked",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "",
        type: "address",
      },
    ],
    name: "unlock_time",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "_token",
        type: "address",
      },
      {
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "_token",
        type: "address",
      },
    ],
    name: "withdrawDeposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw_all",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
