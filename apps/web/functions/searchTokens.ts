import { AutoListing } from "@/app/[locale]/token-listing/add/hooks/useAutoListing";
import { TokenList } from "@/db/db";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { Token } from "@/sdk_hybrid/entities/token";

const generateOrderedSubsets = (arr: string[]): string[] => {
  const _arr: string[] = [];
  for (let start = 1; start < arr.length; start++) {
    let subset = "";
    for (let end = start; end < arr.length; end++) {
      subset = subset ? `${subset} ${arr[end]}` : arr[end];
      _arr.push(subset);
    }
  }
  return _arr;
};
export function filterTokens<T extends Currency>(searchStr: string, tokens: T[]): T[] {
  return tokens.filter((token) => {
    const nameParts = token.name ? token.name.split(" ") : [];
    const symbolParts = token.symbol ? token.symbol.split(" ") : [];
    const addressParts = token.isToken ? [token.address0, token.address1] : [];

    const allPartsArr = [...nameParts, ...symbolParts, ...addressParts];
    if (token.name && nameParts.length > 1) {
      allPartsArr.push(token.name);
    }

    if (token.symbol && symbolParts.length > 1) {
      allPartsArr.push(token.symbol);
    }

    const allParts = Array.from(
      new Set<string>([
        ...allPartsArr,
        ...generateOrderedSubsets(nameParts),
        ...generateOrderedSubsets(symbolParts),
      ]),
    );

    console.log(allParts);
    for (let i = 0; i < allParts.length; i++) {
      if (allParts[i].toLowerCase().startsWith(searchStr.toLowerCase())) {
        return true;
      }
    }
  });
}

export function filterTokenLists(searchStr: string, lists: TokenList[]): TokenList[] {
  return lists.filter(({ list, id }) => {
    const nameParts = list.name.split(" ");
    const idParts = id ? [id.toString()] : [];

    const allPartsSet = [...nameParts, ...idParts];

    if (list.name && nameParts.length > 1) {
      allPartsSet.push(list.name);
    }

    const allParts = Array.from(
      new Set<string>([...allPartsSet, ...generateOrderedSubsets(nameParts)]),
    );

    console.log(allParts);
    if (!allParts.every((part) => !part.toLowerCase().startsWith(searchStr.toLowerCase()))) {
      return true;
    }
  });
}

export function filterAutoListings(searchStr: string, lists: AutoListing[]) {
  return lists.filter((list) => {
    const nameParts = list.name.split(" ");
    const idParts = list.id ? [list.id.toString()] : [];

    const allPartsSet = [...nameParts, ...idParts];

    if (list.name && nameParts.length > 1) {
      allPartsSet.push(list.name);
    }

    const allParts = Array.from(
      new Set<string>([...allPartsSet, ...generateOrderedSubsets(nameParts)]),
    );

    for (let i = 0; i < allParts.length; i++) {
      if (allParts[i].toLowerCase().startsWith(searchStr.toLowerCase())) {
        return true;
      }
    }
  });
}
