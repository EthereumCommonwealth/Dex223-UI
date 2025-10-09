import { DexChainId } from "@/sdk_bi/chains";
import { GasOption } from "@/stores/factories/createGasPriceStore";

type GasOptionWithoutCustom = Exclude<GasOption, GasOption.CUSTOM>;

export const baseFeeMultipliers: Record<DexChainId, Record<GasOptionWithoutCustom, bigint>> = {
  [DexChainId.MAINNET]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.SEPOLIA]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.BSC_TESTNET]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.EOS]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.APE_CHAIN]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
};

export const SCALING_FACTOR = BigInt(100);
