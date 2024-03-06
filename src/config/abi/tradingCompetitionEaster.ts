export const tradingCompetitionEasterABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_pancakeProfileAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "_bunnyStationAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "_cakeTokenAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "enum TradingCompV1.CompetitionStatus",
        name: "status",
        type: "uint8",
      },
    ],
    name: "NewCompetitionStatus",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "teamId",
        type: "uint256",
      },
    ],
    name: "TeamRewardsUpdate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "teamId",
        type: "uint256",
      },
    ],
    name: "UserRegister",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address[]",
        name: "userAddresses",
        type: "address[]",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "rewardGroup",
        type: "uint256",
      },
    ],
    name: "UserUpdateMultiple",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "teamId",
        type: "uint256",
      },
    ],
    name: "WinningTeam",
    type: "event",
  },
  {
    inputs: [],
    name: "bunnyId",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "bunnyMintingStation",
    outputs: [
      {
        internalType: "contract BunnyMintingStation",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "cakeToken",
    outputs: [
      {
        internalType: "contract IBEP20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_userAddress",
        type: "address",
      },
    ],
    name: "claimInformation",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "claimRemainder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "currentStatus",
    outputs: [
      {
        internalType: "enum TradingCompV1.CompetitionStatus",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "numberTeams",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pancakeProfile",
    outputs: [
      {
        internalType: "contract IPancakeProfile",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum TradingCompV1.CompetitionStatus",
        name: "_status",
        type: "uint8",
      },
    ],
    name: "updateCompetitionStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_teamId",
        type: "uint256",
      },
      {
        internalType: "uint256[5]",
        name: "_userCampaignIds",
        type: "uint256[5]",
      },
      {
        internalType: "uint256[5]",
        name: "_cakeRewards",
        type: "uint256[5]",
      },
      {
        internalType: "uint256[5]",
        name: "_pointRewards",
        type: "uint256[5]",
      },
    ],
    name: "updateTeamRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_addressesToUpdate",
        type: "address[]",
      },
      {
        internalType: "uint256",
        name: "_rewardGroup",
        type: "uint256",
      },
    ],
    name: "updateUserStatusMultiple",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_winningTeamId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_tokenURI",
        type: "string",
      },
      {
        internalType: "uint8",
        name: "_bunnyId",
        type: "uint8",
      },
    ],
    name: "updateWinningTeamAndTokenURIAndBunnyId",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "userTradingStats",
    outputs: [
      {
        internalType: "uint256",
        name: "rewardGroup",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "teamId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "hasRegistered",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "hasClaimed",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "viewRewardTeams",
    outputs: [
      {
        components: [
          {
            internalType: "uint256[5]",
            name: "userCampaignId",
            type: "uint256[5]",
          },
          {
            internalType: "uint256[5]",
            name: "cakeRewards",
            type: "uint256[5]",
          },
          {
            internalType: "uint256[5]",
            name: "pointUsers",
            type: "uint256[5]",
          },
        ],
        internalType: "struct TradingCompV1.CompetitionRewards[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "winningTeamId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
