// Default lists for chains deployed with Dex223-contracts scripts/deploy-chain.ts. The ERC-223 addresses
// are the converter's CREATE2 predictions; the wrappers exist once someone converts the token.

export const baseDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 Base Default",
  tokens: [
    {
      address0: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // ERC-20
      address1: "0xcF473D53E214BeEE33cFE9a18168D411FC02A057", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USD Coin",
      logoURI: "/images/tokens/USDC.svg",
      chainId: 8453,
      decimals: 6,
      symbol: "USDC",
    },
    {
      address0: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", // ERC-20
      address1: "0xf76b228523307df0dBE7b02A26eb720Cd0470434", // ERC-223, predicted from converter 0xa7d6…0108
      name: "Tether USD",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 8453,
      decimals: 6,
      symbol: "USDT",
    },
  ],
};

export const bscDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 BNB Chain Default",
  tokens: [
    {
      address0: "0x55d398326f99059fF775485246999027B3197955", // ERC-20
      address1: "0x835866C0b78fE12A86daEF2a25a253Ec339926a3", // ERC-223, predicted from converter 0xa7d6…0108
      name: "Tether USD",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 56,
      decimals: 18,
      symbol: "USDT",
    },
    {
      address0: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // ERC-20
      address1: "0x618cAc6D7baBD28ceBe5420198acbDdFFc58f645", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USD Coin",
      logoURI: "/images/tokens/USDC.svg",
      chainId: 56,
      decimals: 18,
      symbol: "USDC",
    },
  ],
};

export const arbitrumDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 Arbitrum Default",
  tokens: [
    {
      address0: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // ERC-20
      address1: "0x91ef1Ea67C49abc8BdF384d98d26b19B742ae17d", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USDT0",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 42161,
      decimals: 6,
      symbol: "USDT0",
    },
    {
      address0: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // ERC-20
      address1: "0x1A1551A915a6e0368D809bE5D3996d0Ad1d42f74", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USD Coin",
      logoURI: "/images/tokens/USDC.svg",
      chainId: 42161,
      decimals: 6,
      symbol: "USDC",
    },
  ],
};

export const polygonDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 Polygon Default",
  tokens: [
    {
      address0: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // ERC-20
      address1: "0xE598982675a43F288C0b6106E294D9a0c2F18fa7", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USDT0",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 137,
      decimals: 6,
      symbol: "USDT0",
    },
    {
      address0: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // ERC-20
      address1: "0xf2a048f5Ad9e2a8a09C799421229B9f90ff15CA6", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USD Coin",
      logoURI: "/images/tokens/USDC.svg",
      chainId: 137,
      decimals: 6,
      symbol: "USDC",
    },
  ],
};

export const avalancheDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 Avalanche Default",
  tokens: [
    {
      address0: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", // ERC-20
      address1: "0x10ABeF431C7AB9FEaf42Cb3Ea747daE7577bC22F", // ERC-223, predicted from converter 0xa7d6…0108
      name: "TetherToken",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 43114,
      decimals: 6,
      symbol: "USDt",
    },
    {
      address0: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // ERC-20
      address1: "0x5E6904AF4d44F49B929d313574345dBd94Ba7afc", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USD Coin",
      logoURI: "/images/tokens/USDC.svg",
      chainId: 43114,
      decimals: 6,
      symbol: "USDC",
    },
  ],
};

export const optimismDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 OP Mainnet Default",
  tokens: [
    {
      address0: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // ERC-20
      address1: "0xE8bBE94370Ffeacbcd8c1AE6a2341468D9ec586d", // ERC-223, predicted from converter 0xa7d6…0108
      name: "Tether USD",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 10,
      decimals: 6,
      symbol: "USDT",
    },
    {
      address0: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // ERC-20
      address1: "0xC12C53338Ec58ED331A47913686B35Dab10226b9", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USD Coin",
      logoURI: "/images/tokens/USDC.svg",
      chainId: 10,
      decimals: 6,
      symbol: "USDC",
    },
  ],
};

export const monadDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 Monad Default",
  tokens: [
    {
      address0: "0xe7cd86e13AC4309349F30B3435a9d337750fC82D", // ERC-20
      address1: "0xBeAe8B9Edb43f9A5A61d7CE018558c13d3F80120", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USDT0",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 143,
      decimals: 6,
      symbol: "USDT0",
    },
    {
      address0: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603", // ERC-20
      address1: "0xe4321502a31C295caFDC3A1cB2eF38DF066fdd75", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USD Coin",
      logoURI: "/images/tokens/USDC.svg",
      chainId: 143,
      decimals: 6,
      symbol: "USDC",
    },
  ],
};

export const unichainDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 Unichain Default",
  tokens: [
    {
      address0: "0x9151434b16b9763660705744891fA906F660EcC5", // ERC-20
      address1: "0xa4fF9177fdf290Fe4E0c33dab8e7c8201A034F64", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USDT0",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 130,
      decimals: 6,
      symbol: "USDT0",
    },
    {
      address0: "0x078D782b760474a361dDA0AF3839290b0EF57AD6", // ERC-20
      address1: "0x7de23ccF04F3a9cE7ed493aFb5572b5F7ABB505a", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USD Coin",
      logoURI: "/images/tokens/USDC.svg",
      chainId: 130,
      decimals: 6,
      symbol: "USDC",
    },
  ],
};

export const plasmaDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 Plasma Default",
  tokens: [
    {
      address0: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb", // ERC-20
      address1: "0x0a9349DF86624AA83c5E0a5f617651B7fD8bB42A", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USDT0",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 9745,
      decimals: 6,
      symbol: "USDT0",
    },
  ],
};

export const sonicDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 Sonic Default",
  tokens: [
    {
      address0: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894", // ERC-20
      address1: "0x5799630c28927435968AEFEE2c144d557053B9bd", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USD Coin",
      logoURI: "/images/tokens/USDC.svg",
      chainId: 146,
      decimals: 6,
      symbol: "USDC",
    },
    {
      address0: "0x6047828dc181963ba44974801FF68e538dA5eaF9", // ERC-20
      address1: "0x3A74ce0294386064E6869053E217cA1BAfb8c388", // ERC-223, predicted from converter 0xa7d6…0108
      name: "Tether USD",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 146,
      decimals: 6,
      symbol: "USDT",
    },
  ],
};

export const lineaDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 Linea Default",
  tokens: [
    {
      address0: "0xA219439258ca9da29E9Cc4cE5596924745e12B93", // ERC-20
      address1: "0xC72613F90975e9C335Ff4fc99b890aF5C386bA70", // ERC-223, predicted from converter 0xa7d6…0108
      name: "Tether USD",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 59144,
      decimals: 6,
      symbol: "USDT",
    },
    {
      address0: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff", // ERC-20
      address1: "0x41DA657679508aB07af5d497B53185aF7582bB00", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USD Coin",
      logoURI: "/images/tokens/USDC.svg",
      chainId: 59144,
      decimals: 6,
      symbol: "USDC",
    },
  ],
};

export const inkDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 Ink Default",
  tokens: [
    {
      address0: "0x0200C29006150606B650577BBE7B6248F58470c1", // ERC-20
      address1: "0xD091168D3976B0FEaF6267617E299C951f059098", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USDT0",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 57073,
      decimals: 6,
      symbol: "USDT0",
    },
    {
      address0: "0x2D270e6886d130D724215A266106e6832161EAEd", // ERC-20
      address1: "0x9e2f2462539Bf08c514649aF57cE5Ba692C40329", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USD Coin",
      logoURI: "/images/tokens/USDC.svg",
      chainId: 57073,
      decimals: 6,
      symbol: "USDC",
    },
  ],
};

export const mantleDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 Mantle Default",
  tokens: [
    {
      address0: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736", // ERC-20
      address1: "0xfc289F195CA5324010Eb6f034B3B06BF095Fa615", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USDT0",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 5000,
      decimals: 6,
      symbol: "USDT0",
    },
    {
      address0: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9", // ERC-20
      address1: "0x69a8B7cdb9071770A333e247158aeA21d7b3f7Cd", // ERC-223, predicted from converter 0xa7d6…0108
      name: "USD Coin",
      logoURI: "/images/tokens/USDC.svg",
      chainId: 5000,
      decimals: 6,
      symbol: "USDC",
    },
  ],
};
