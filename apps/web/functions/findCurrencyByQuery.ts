import { isAddress } from "viem";

import { Currency } from "@/sdk_bi/entities/currency";
import { Token } from "@/sdk_bi/entities/token";

export const NATIVE_CURRENCY_QUERY = "native";

export function currencyToQueryParam(currency: Currency | undefined): string | undefined {
  if (!currency) {
    return undefined;
  }
  return currency.isNative ? NATIVE_CURRENCY_QUERY : currency.wrapped.address0;
}

export function findCurrencyByQuery(
  tokens: Currency[],
  query: string | null | undefined,
): Currency | undefined {
  if (!query) {
    return undefined;
  }

  if (query.toLowerCase() === NATIVE_CURRENCY_QUERY) {
    return tokens.find((token) => token.isNative);
  }

  if (!isAddress(query)) {
    return undefined;
  }

  const lower = query.toLowerCase();
  const erc20 = tokens.find(
    (token): token is Token => token.isToken && token.address0.toLowerCase() === lower,
  );
  if (erc20) {
    return erc20;
  }

  const native = tokens.find((token) => token.isNative);
  if (native && native.wrapped.address0.toLowerCase() === lower) {
    return native.wrapped;
  }

  return undefined;
}
