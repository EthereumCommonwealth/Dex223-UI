import { Address } from "viem";

import { DexChainId } from "./chains";

//TODO: MAINNET add convertor and paid autolisting address

export const CONVERTER_ADDRESS: Record<DexChainId, Address> = {
  [DexChainId.MAINNET]: "0xe7E969012557f25bECddB717A3aa2f4789ba9f9a",
  [DexChainId.SEPOLIA]: "0x044845FB22B4258d83a6c24b2fB061AFEba7e5b9",
  [DexChainId.BSC_TESTNET]: "0x18EEdef5d3D21C2828Ca8557BeF7210Bfa481bC2",
  [DexChainId.EOS]: "0xDd90b13bcb92950CA9b6b3e0407d439533eA0df2",
};
export const FACTORY_ADDRESS: Record<DexChainId, Address> = {
  [DexChainId.MAINNET]: "0xa146a20b4e9551cc827afe183130061af92db12a",
  [DexChainId.SEPOLIA]: "0x8524c3bD49Cd455EA0102BF194AdD2F21165E049",
  [DexChainId.BSC_TESTNET]: "0x8524c3bD49Cd455EA0102BF194AdD2F21165E049",
  [DexChainId.EOS]: "0x9f3118af733Ea3Fe4f9Ed71033F25B6bcF7F49e9",
};
export const ROUTER_ADDRESS: Record<DexChainId, Address> = {
  [DexChainId.MAINNET]: "0xc87c815c03b6cd45880cbd51a90d0a56ecfba9da",
  [DexChainId.SEPOLIA]: "0xb130D5e318898718C1Efa27Abe634294B0a4C4c8",
  [DexChainId.BSC_TESTNET]: "0xb130D5e318898718C1Efa27Abe634294B0a4C4c8",
  [DexChainId.EOS]: "0x1937f00296267c2bA4Effa1122D944F33de46891",
};

export const QUOTER_ADDRESS: Record<DexChainId, Address> = {
  [DexChainId.MAINNET]: "0x29c3b2cb7a6249f282264bbc693707a41e773e1e",
  [DexChainId.SEPOLIA]: "0x757e8D27B366153161d0990d82F7661835802083",
  [DexChainId.BSC_TESTNET]: "0x757e8D27B366153161d0990d82F7661835802083",
  [DexChainId.EOS]: "0x22cD7407eB4cE475AeC9769fDF229b1046C891C0",
};

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESS: Record<DexChainId, Address> = {
  [DexChainId.MAINNET]: "0x1a817a1b78506e2d45f344a4d327614559859993",
  [DexChainId.SEPOLIA]: "0x9cCF60dDE926FB2579209bb0D6C00C8Cc873A458",
  [DexChainId.BSC_TESTNET]: "0x9cCF60dDE926FB2579209bb0D6C00C8Cc873A458",
  [DexChainId.EOS]: "0xcB53086f8D8532CD2253A02052314D07ec8D5B76",
};

export const POOL_INIT_CODE_HASH: Record<DexChainId, Address> = {
  [DexChainId.MAINNET]: "0x506a6a31eff8c1887c6ed0374682d0a0e806f5bd8c4b4d5eb96dd3cdc9c99ac3",
  [DexChainId.SEPOLIA]: "0xf0d7ddf29422ea801b9317d66d14a1055d17fd476a9da81c3c985fb2d8e49281",
  [DexChainId.BSC_TESTNET]: "0xf0d7ddf29422ea801b9317d66d14a1055d17fd476a9da81c3c985fb2d8e49281",
  [DexChainId.EOS]: "0xf0d7ddf29422ea801b9317d66d14a1055d17fd476a9da81c3c985fb2d8e49281",
};

export const CORE_AUTO_LISTING_ADDRESS: Record<DexChainId, Address> = {
  [DexChainId.MAINNET]: "0x6a5ff6c7b1ea8e9b9e40da3b162468b61e40584f",
  [DexChainId.SEPOLIA]: "0x4C82Def7222525a02c271E8958E7ac37043806e9",
  [DexChainId.BSC_TESTNET]: "0xD9EAC1C424554499322FECCb673fC62Ea92cF810",
  [DexChainId.EOS]: "0x39491101f7d46e9f0c3217d2eb91c016f761ad59",
};

export const FREE_AUTO_LISTING_ADDRESS: Record<DexChainId, Address> = {
  [DexChainId.MAINNET]: "0x39491101f7d46e9f0c3217d2eb91c016f761ad59",
  [DexChainId.SEPOLIA]: "0x9c7B27d6be94d30ECb83A9849F7966E44BcD1FA7",
  [DexChainId.BSC_TESTNET]: "0xde839Df421dA5B5a4b34d872D90517C90B511b57",
  [DexChainId.EOS]: "0x5bf0FD2874B54CD42a7b7F19E98a2AdA8c9A756d",
};
