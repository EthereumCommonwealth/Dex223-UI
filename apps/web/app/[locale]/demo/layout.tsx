import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

import DemoWalletDialog from "./components/DemoWalletDialog";

export const generateMetadata = seoFor("demo", "demo");

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <DemoWalletDialog />
    </>
  );
}
