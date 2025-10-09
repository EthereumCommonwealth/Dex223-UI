export enum DexChainId {
  MAINNET = 1,
  SEPOLIA = 11155111,
  BSC_TESTNET = 97,
  EOS = 17777,
  APE_CHAIN = 33139,
}

const getEnumValues = <T extends { [key: string]: any }>(enumObj: T): Array<T[keyof T]> => {
  return Object.values(enumObj).filter((v) => !isNaN(Number(v)));
};

export const DEX_SUPPORTED_CHAINS = getEnumValues(DexChainId);
