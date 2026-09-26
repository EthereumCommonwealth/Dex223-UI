import { Chain, fallback, http, webSocket } from "viem";
import {
  arbitrum,
  avalanche,
  base,
  bsc,
  bscTestnet,
  ink,
  linea,
  mainnet,
  mantle,
  optimism,
  polygon,
  sonic,
  unichain,
} from "viem/chains";
import { createConfig, createStorage, parseCookie } from "wagmi";
import { coinbaseWallet, injected, metaMask, walletConnect } from "wagmi/connectors";

import { eos } from "@/config/chains/eos";
import { monad } from "@/config/chains/monad";
import { plasma } from "@/config/chains/plasma";
import { sepolia } from "@/config/chains/sepolia";
import { DEX_SUPPORTED_CHAINS, DexChainId } from "@/sdk_bi/chains";

const viemChains: Record<DexChainId, Chain> = {
  [DexChainId.MAINNET]: mainnet,
  [DexChainId.SEPOLIA]: sepolia,
  [DexChainId.BSC_TESTNET]: bscTestnet,
  [DexChainId.EOS]: eos,
  [DexChainId.BASE]: base,
  [DexChainId.BSC]: bsc,
  [DexChainId.ARBITRUM]: arbitrum,
  [DexChainId.POLYGON]: polygon,
  [DexChainId.AVALANCHE]: avalanche,
  [DexChainId.OPTIMISM]: optimism,
  [DexChainId.MONAD]: monad,
  [DexChainId.UNICHAIN]: unichain,
  [DexChainId.PLASMA]: plasma,
  [DexChainId.SONIC]: sonic,
  [DexChainId.LINEA]: linea,
  [DexChainId.INK]: ink,
  [DexChainId.MANTLE]: mantle,
};

const enabledChains = (
  process.env.NEXT_PUBLIC_ENV === "production" ? [DexChainId.MAINNET] : DEX_SUPPORTED_CHAINS
).map((chainId) => viemChains[chainId]) as [Chain, ...Chain[]];

const cookieStorage = {
  getItem(key: string) {
    if (typeof window === "undefined") return null;
    const value = parseCookie(document.cookie, key);
    return value ?? null;
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    document.cookie = `${key}=${value};path=/;samesite=Lax`;
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    document.cookie = `${key}=;path=/;max-age=-1`;
  },
};

export const config = createConfig({
  chains: enabledChains,
  connectors: [
    walletConnect({
      projectId: "0af4613ea1c747c660416c4a7a114616",
    }),
    coinbaseWallet({
      appName: "DEX223",
      appLogoUrl: "https://test-app.dex223.io/tokens/DEX.svg",
    }),
    metaMask({
      dappMetadata: {
        name: "dex223.io",
        url: "https://app.dex223.io",
      },
      useDeeplink: true,
    }),
    injected({
      target: "trust",
    }),
  ],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  multiInjectedProviderDiscovery: false, // to avoid connecting to io.metamask and other injected connectors
  transports: {
    [mainnet.id]: fallback([
      webSocket(
        "wss://lb.drpc.org/ogws?network=ethereum&dkey=AkwuSJ_nLEH3t2kOUJMm2iFCwFk2Dk4R8JcUgk2scBzi",
      ),
      http(
        "https://lb.drpc.org/ogrpc?network=ethereum&dkey=AkwuSJ_nLEH3t2kOUJMm2iFCwFk2Dk4R8JcUgk2scBzi",
      ),
      webSocket("wss://ethereum.callstaticrpc.com"),
      webSocket("wss://ethereum-rpc.publicnode.com"),
      http("https://ethereum-rpc.publicnode.com"),
      http("https://eth.drpc.org"),
      http("https://1rpc.io/eth"),
      http(),
    ]),
    [sepolia.id]: fallback([
      // NOTE: the previous first two entries pointed at lb.drpc.org/sepolia, which dRPC has moved behind
      // a paid plan - it now answers every request with HTTP 400 "chain is not available on free plan",
      // so Sepolia was completely broken in the UI.
      //
      // The third entry was wss://ethereum-rpc.publicnode.com, which is MAINNET (chainId 1) listed as a
      // Sepolia fallback. With the drpc entries failing, that was the next transport tried.
      //
      // rpc.ankr.com/eth_sepolia no longer answers either. Verified working, in order:
      webSocket("wss://ethereum-sepolia-rpc.publicnode.com"),
      http("https://ethereum-sepolia-rpc.publicnode.com"),
      webSocket("wss://eth-sepolia.g.alchemy.com/v2/kvidqVpyVu4aivBEb55XXIzCHDqMm7CO"),
      http("https://eth-sepolia.g.alchemy.com/v2/kvidqVpyVu4aivBEb55XXIzCHDqMm7CO"),
      http("https://sepolia.infura.io/v3/6689c099b8d542589b1842e30dbc2027"),
      http(),
    ]),
    [bscTestnet.id]: fallback([
      // webSocket("wss://bsc-testnet-rpc.publicnode.com"),
      http("https://api.zan.top/bsc-testnet"),
      http("https://endpoints.omniatech.io/v1/bsc/testnet/public"),
      http("https://bsc-testnet.public.blastapi.io"),
      http("https://bsc-testnet-rpc.publicnode.com"),
      http("https://data-seed-prebsc-1-s1.bnbchain.org:8545"),
      http(),
    ]),
    [eos.id]: http("https://api.evm.eosnetwork.com"),
    // Public RPCs. Swap in private endpoints before a chain goes to production.
    [base.id]: fallback([
      http("https://mainnet.base.org"),
      http("https://base-rpc.publicnode.com"),
    ]),
    [bsc.id]: fallback([
      http("https://bsc-dataseed.bnbchain.org"),
      http("https://bsc-rpc.publicnode.com"),
    ]),
    [arbitrum.id]: fallback([
      http("https://arb1.arbitrum.io/rpc"),
      http("https://arbitrum-one-rpc.publicnode.com"),
    ]),
    [polygon.id]: fallback([
      http("https://polygon.drpc.org"),
      http("https://polygon-bor-rpc.publicnode.com"),
    ]),
    [avalanche.id]: fallback([
      http("https://api.avax.network/ext/bc/C/rpc"),
      http("https://avalanche-c-chain-rpc.publicnode.com"),
    ]),
    [optimism.id]: fallback([
      http("https://mainnet.optimism.io"),
      http("https://optimism-rpc.publicnode.com"),
    ]),
    [monad.id]: http("https://rpc.monad.xyz"),
    [unichain.id]: http("https://mainnet.unichain.org"),
    [plasma.id]: http("https://rpc.plasma.to"),
    [sonic.id]: http("https://rpc.soniclabs.com"),
    [linea.id]: http("https://rpc.linea.build"),
    [ink.id]: http("https://rpc-gel.inkonchain.com"),
    [mantle.id]: http("https://rpc.mantle.xyz"),
  },
});
