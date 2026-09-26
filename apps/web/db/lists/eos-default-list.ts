// Tokens on the new EOS EVM deploy (Dex223-contracts deploy-chain.ts). The USDT address is unverified:
// EOS EVM has had no public RPC since 2025-10-08. Check it against our node before enabling the chain.
export const eosDefaultList = {
  version: {
    major: 2,
    minor: 0,
    patch: 0,
  },
  logoURI: "/token-list-placeholder.svg",
  name: "DEX223 EOS Default",
  tokens: [
    {
      address0: "0x33B57dC70014FD7AA6e1ed3080eeD2B619632B8e", // ERC-20
      address1: "0xDBCbbFC51A9449277181bc6f101C4eAc28c8De05", // ERC-223, predicted from converter 0xa7d6…0108
      name: "Tether USD",
      logoURI: "/images/tokens/USDT.svg",
      chainId: 17777,
      decimals: 6,
      symbol: "USDT",
    },
  ],
};
