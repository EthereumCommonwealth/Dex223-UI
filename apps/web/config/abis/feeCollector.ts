export const FEE_COLLECTOR_ABI = [
  {
    type: "function",
    name: "collect",
    stateMutability: "nonpayable",
    inputs: [{ name: "pools", type: "address[]" }],
    outputs: [],
  },
  {
    type: "function",
    name: "factory",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;
