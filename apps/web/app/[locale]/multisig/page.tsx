"use client";

import { useState } from "react";

import Container from "@/components/atoms/Container";
import TabButton from "@/components/buttons/TabButton";
import { ThemeColors } from "@/config/theme/colors";
import { ColorSchemeProvider } from "@/lib/color-scheme";

import Configure from "./components/Configure";
import Observe from "./components/Observe";
import Transaction from "./components/Transactions/Transaction";

const platforms = ["Transaction", "Observe", "Configure"];

export default function MultisigPage() {
  const [selectedPlatform, setSelectedPlatform] = useState("Transaction");

  const handlePlatformSelect = (platform: string) => {
    setSelectedPlatform(platform);
  };

  return (
    <ColorSchemeProvider value={ThemeColors.PURPLE}>
      <Container>
        <div className="py-6 lg:py-12 flex justify-center">
          <div className="w-full max-w-[640px]">
            <div className="text-center mb-8">
              <h1 className="mb-3 text-24 lg:text-40">Dex223 Multi-sig</h1>
            </div>
            <div className="w-full flex bg-primary-bg p-1 gap-1 rounded-3 overflow-x-auto mb-8">
              {platforms.map((platform) => (
                <TabButton
                  className="w-full"
                  key={platform}
                  size={48}
                  active={selectedPlatform === platform}
                  onClick={() => handlePlatformSelect(platform)}
                >
                  {platform}
                </TabButton>
              ))}
            </div>
            {selectedPlatform === "Transaction" && <Transaction />}
            {selectedPlatform === "Observe" && <Observe />}
            {selectedPlatform === "Configure" && <Configure />}
          </div>
        </div>
      </Container>
    </ColorSchemeProvider>
  );
}
