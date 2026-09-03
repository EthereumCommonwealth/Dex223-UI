import { D223_ADDRESS_ERC_20, D223_ADDRESS_ERC_223 } from "@/config/constants/d223";
import { Currency } from "@/sdk_bi/entities/currency";
import { Standard } from "@/sdk_bi/standard";

const nativeERC223Addresses = [D223_ADDRESS_ERC_20, D223_ADDRESS_ERC_223].map((address) =>
  address.toLowerCase(),
);

/**
 * Standard a token should be pre-selected with. Tokens that were issued as ERC-223 (D223) default
 * to ERC-223, everything else keeps ERC-20 as before.
 */
export function getDefaultStandard(token: Currency | undefined): Standard {
  if (!token || token.isNative) {
    return Standard.ERC20;
  }

  return nativeERC223Addresses.includes(token.address0.toLowerCase())
    ? Standard.ERC223
    : Standard.ERC20;
}
