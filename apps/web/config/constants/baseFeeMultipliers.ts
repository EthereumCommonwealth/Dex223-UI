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
  [DexChainId.BASE]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.BSC]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.ARBITRUM]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.POLYGON]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.AVALANCHE]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.OPTIMISM]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.MONAD]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.UNICHAIN]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.PLASMA]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.SONIC]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.LINEA]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.INK]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
  [DexChainId.MANTLE]: {
    [GasOption.CHEAP]: BigInt(120),
    [GasOption.FAST]: BigInt(200),
  },
};

export const SCALING_FACTOR = BigInt(100);
