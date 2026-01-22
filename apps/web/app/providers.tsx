"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";
import { cookieToInitialState, WagmiProvider } from "wagmi";

import { config } from "@/config/wagmi/config";

import NuqsProvider from "./providers/NuqsAdapter";

export default function Providers({
  cookie,
  children,
}: PropsWithChildren<{ cookie?: string | null }>) {
  const [queryClient] = useState(() => new QueryClient());
  const initialState = cookie
    ? cookieToInitialState(config, cookie)
    : undefined;

    return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <NuqsProvider>{children}</NuqsProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


