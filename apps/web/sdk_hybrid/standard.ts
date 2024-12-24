import { Currency } from "@/sdk_hybrid/entities/currency";

export enum Standard {
  ERC20 = "ERC-20",
  ERC223 = "ERC-223",
}

export function getTokenAddressForStandard(token: Currency, standard: Standard) {
  if (token.isNative) {
    return token.wrapped.address0;
  }

  return standard === Standard.ERC20 ? token.address0 : token.address1;
}
