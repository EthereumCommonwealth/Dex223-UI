import { getAddress } from "viem";

export function tokenMeta(token: { id: string; symbol: string; addressERC223?: string | null }): {
  symbol: string;
  image: string;
} {
  let symbol = token.symbol;
  let image = "/images/tokens/placeholder.svg";

  try {
    image = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${getAddress(token.id)}/logo.png`;
  } catch {
    // invalid address: keep placeholder
  }

  const d223 = "0x0908078Da2935A14BC7a17770292818C85b580dd";
  if (token.addressERC223 === d223.toLowerCase()) {
    symbol = "D223";
    image = "/images/tokens/DEX.svg";
  }

  const weth9 = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  if (token.id === weth9.toLowerCase()) {
    symbol = "ETH";
    image = "/images/tokens/ETH.svg";
  }

  return { symbol, image };
}
