export const FEE_COLLECTOR_ABI = [
  {
    type: "function",
    name: "collect",
    stateMutability: "nonpayable",
    inputs: [{ name: "pools", type: "address[]" }],
    outputs: [],
  },
] as const;
