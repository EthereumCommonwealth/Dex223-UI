import { DexChainId } from "@/sdk_hybrid/chains";
import { GasOption } from "@/stores/factories/createGasPriceStore";

type GasOptionWithoutCustom = Exclude<GasOption, GasOption.CUSTOM>;

export const baseFeeMultipliers: Record<DexChainId, Record<GasOptionWithoutCustom, bigint>> = {
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
};

export const SCALING_FACTOR = BigInt(100);
