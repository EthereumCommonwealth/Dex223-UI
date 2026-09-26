import invariant from "tiny-invariant";

import { DexChainId } from "@/sdk_bi/chains";

import { Currency } from "./currency";
import { NativeCurrency } from "./nativeCurrency";
import { Token } from "./token";
import { wrappedTokens } from "./weth9";

/**
 * Native is the main usage of a 'native' currency, i.e. for Ethereum mainnet and all testnets
 */

const nativeCurrenciesMap: Record<DexChainId, { symbol: string; name: string; logoURI: string }> = {
  [DexChainId.MAINNET]: {
    symbol: "ETH",
    name: "Ethereum",
    logoURI: "/images/coins/ETH.svg",
  },
  [DexChainId.SEPOLIA]: {
    symbol: "sepETH",
    name: "Sepolia ETH",
    logoURI: "/images/coins/ETH.svg",
  },
  [DexChainId.BSC_TESTNET]: {
    symbol: "tBNB",
    name: "Testnet BNB",
    logoURI: "/images/coins/BNB.svg",
  },
  [DexChainId.EOS]: {
    symbol: "EOS",
    name: "EOS",
    logoURI: "/images/coins/EOS.svg",
  },
  [DexChainId.BASE]: {
    symbol: "ETH",
    name: "Ethereum",
    logoURI: "/images/coins/ETH.svg",
  },
  [DexChainId.BSC]: {
    symbol: "BNB",
    name: "BNB",
    logoURI: "/images/coins/BNB.svg",
  },
  [DexChainId.ARBITRUM]: {
    symbol: "ETH",
    name: "Ethereum",
    logoURI: "/images/coins/ETH.svg",
  },
  [DexChainId.POLYGON]: {
    symbol: "POL",
    name: "POL",
    logoURI: "/images/tokens/placeholder.svg",
  },
  [DexChainId.AVALANCHE]: {
    symbol: "AVAX",
    name: "Avalanche",
    logoURI: "/images/tokens/placeholder.svg",
  },
  [DexChainId.OPTIMISM]: {
    symbol: "ETH",
    name: "Ethereum",
    logoURI: "/images/coins/ETH.svg",
  },
  [DexChainId.MONAD]: {
    symbol: "MON",
    name: "Monad",
    logoURI: "/images/tokens/placeholder.svg",
  },
  [DexChainId.UNICHAIN]: {
    symbol: "ETH",
    name: "Ethereum",
    logoURI: "/images/coins/ETH.svg",
  },
  [DexChainId.PLASMA]: {
    symbol: "XPL",
    name: "Plasma",
    logoURI: "/images/tokens/placeholder.svg",
  },
  [DexChainId.SONIC]: {
    symbol: "S",
    name: "Sonic",
    logoURI: "/images/tokens/placeholder.svg",
  },
  [DexChainId.LINEA]: {
    symbol: "ETH",
    name: "Ethereum",
    logoURI: "/images/coins/ETH.svg",
  },
  [DexChainId.INK]: {
    symbol: "ETH",
    name: "Ethereum",
    logoURI: "/images/coins/ETH.svg",
  },
  [DexChainId.MANTLE]: {
    symbol: "MNT",
    name: "Mantle",
    logoURI: "/images/tokens/placeholder.svg",
  },
};

export class NativeCoin extends NativeCurrency {
  protected constructor(chainId: DexChainId) {
    super(
      chainId,
      18,
      nativeCurrenciesMap[chainId].symbol,
      nativeCurrenciesMap[chainId].name,
      nativeCurrenciesMap[chainId].logoURI,
    );
  }

  public get wrapped(): Token {
    const weth9 = wrappedTokens[this.chainId];
    invariant(!!weth9, "WRAPPED");
    return weth9;
  }

  private static _etherCache: { [chainId: number]: NativeCoin } = {};

  public static onChain(chainId: number): NativeCoin {
    return this._etherCache[chainId] ?? (this._etherCache[chainId] = new NativeCoin(chainId));
  }

  public equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId;
  }
}
