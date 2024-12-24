"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";
import { type State, WagmiProvider } from "wagmi";

import { config } from "@/config/wagmi/config";
import { MixpanelNavigationEvents } from "@/functions/mixpanel";

export default function Providers({
  initialState,
  children,
}: PropsWithChildren<{ initialState: State | undefined }>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <MixpanelNavigationEvents />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
