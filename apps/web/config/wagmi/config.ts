import { fallback, http, webSocket } from "viem";
import { bscTestnet, mainnet } from "viem/chains";
import { apeChain } from "viem/chains";
import { createConfig, createStorage, parseCookie } from "wagmi";
import { coinbaseWallet, injected, metaMask, walletConnect } from "wagmi/connectors";

import { eos } from "@/config/chains/eos";
import { sepolia } from "@/config/chains/sepolia";

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
  chains:
    process.env.NEXT_PUBLIC_ENV === "production"
      ? [mainnet]
      : [mainnet, sepolia, bscTestnet, eos, apeChain],
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
      webSocket("wss://lb.drpc.org/sepolia/AkwuSJ_nLEH3t2kOUJMm2iE4PlM4mHER8Lt2wg8TMB_n"),
      http("https://lb.drpc.org/sepolia/AkwuSJ_nLEH3t2kOUJMm2iE4PlM4mHER8Lt2wg8TMB_n"),
      webSocket("wss://ethereum-rpc.publicnode.com"),
      webSocket("wss://eth-sepolia.g.alchemy.com/v2/kvidqVpyVu4aivBEb55XXIzCHDqMm7CO"),
      http("https://sepolia.infura.io/v3/6689c099b8d542589b1842e30dbc2027"),
      http("https://eth-sepolia.g.alchemy.com/v2/kvidqVpyVu4aivBEb55XXIzCHDqMm7CO"),
      http("https://rpc.ankr.com/eth_sepolia"),
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
    [apeChain.id]: fallback([
      webSocket("wss://apechain.drpc.org"),
      http("https://apechain.drpc.org"),
    ]),
  },
});
