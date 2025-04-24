import { DexChainId } from "@/sdk_bi/chains";

import { Token } from "./token";

/**
 * Known WETH9 implementation addresses, used in our implementation of Ether#wrapped
 */

export const wrappedTokens: Record<DexChainId, Token> = {
  [DexChainId.MAINNET]: new Token(
    DexChainId.MAINNET,
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "0x2b29C021e1c6942536C2FEe9B143B5DAD6c67BA4",
    18,
    "WETH",
    "Wrapped Ether",
  ),
  [DexChainId.SEPOLIA]: new Token(
    DexChainId.SEPOLIA,
    "0xb16F35c0Ae2912430DAc15764477E179D9B9EbEa",
    "0x32AB1Ee7E48CbbE091F79EeC606677c9e8Bd584E",
    18,
    "WETH",
    "Wrapped Ether",
  ),
  [DexChainId.BSC_TESTNET]: new Token(
    DexChainId.BSC_TESTNET,
    "0xae13d989dac2f0debff460ac112a837c89baa7cd",
    "0xe76C629580279b9B3972643AB4444EdC0F292DC4",
    18,
    "WBNB",
    "Wrapped BNB",
  ),
  [DexChainId.EOS]: new Token(
    DexChainId.EOS,
    "0xc00592aA41D32D137dC480d9f6d0Df19b860104F",
    "0x79F4F66C781183b2c290CA5E76C8637B54146527",
    18,
    "WEOS",
    "Wrapped EOS",
  ),
};
