"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useAccount } from "wagmi";

import Container from "@/components/atoms/Container";
import TabButton from "@/components/buttons/TabButton";
import { ThemeColors } from "@/config/theme/colors";
import { ColorSchemeProvider } from "@/lib/color-scheme";

import { ExchangeData, ExchangeToken } from "../types";
import BuyOnramp from "./BuyOnramp";
import ExchangePageClient from "./ExchangePageClient";

const platforms = ["OnRamp", "SimpleSwap"];
const tabs = ["Swap Crypto", "Buy Crypto", "Sell Crypto"];
const tabs1 = ["Swap Crypto", "Buy/Sell Crypto"];

interface Props {
  tokens: ExchangeToken[];
  initialExchange?: ExchangeData;
}

export default function BuyCryptoPageClient({ tokens, initialExchange }: Props) {
  const [selectedPlatform, setSelectedPlatform] = useState("OnRamp");
  const [selectedTab, setSelectedTab] = useState("Swap Crypto");
  const containerRef = useRef(null);
  const [tabList, setTabList] = useState(tabs);
  const tNav = useTranslations("Navigation");
  const { address } = useAccount();

  const handlePlatformSelect = (platform: string) => {
    if (platform === "OnRamp") {
      setTabList(tabs);
    } else {
      setTabList(tabs1);
      setSelectedTab("Swap Crypto");
    }
    setSelectedPlatform(platform);
  };

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab);
  };

  return (
    <ColorSchemeProvider value={ThemeColors.PURPLE}>
      <Container className="px-4 md:px-4">
        <div className="py-4 lg:py-[40px] flex justify-center">
          <div className="w-full max-w-[600px]">
            <div className="mt-5 w-full flex bg-primary-bg p-1 gap-1 rounded-3 overflow-x-auto mb-6">
              {platforms.map((platform, index) => (
                <TabButton
                  key={platform}
                  inactiveBackground="bg-secondary-bg"
                  size={48}
                  active={selectedPlatform === platform}
                  onClick={() => handlePlatformSelect(platform)}
                  className="w-full"
                >
                  <span className="text-nowrap text-14 md:text-16">{platform}</span>
                </TabButton>
              ))}
            </div>

            {selectedPlatform === "OnRamp" && (
              <Container className="bg-primary-bg rounded-5 p-4 md:p-6 mb-6">
                <div className="w-full flex bg-primary-bg p-1 gap-1 rounded-3 overflow-x-auto mb-6">
                  {tabList.map((tab, index) => (
                    <TabButton
                      key={tab}
                      inactiveBackground="bg-secondary-bg"
                      size={48}
                      active={selectedTab === tab}
                      onClick={() => handleTabSelect(tab)}
                      className="w-full"
                    >
                      <span className="text-nowrap text-12 md:text-16">{tab}</span>
                    </TabButton>
                  ))}
                </div>

                <div className="bg-primary-bg rounded-5 p-4 md:p-6 mb-6">
                  <div className="flex items-center justify-center py-4 md:py-8">
                    <BuyOnramp
                      userId={address}
                      appId={Number(process.env.NEXT_PUBLIC_ONRAMP_APP_ID)}
                      flowType={selectedTab}
                    />
                  </div>
                </div>
                <div className="flex justify-center items-center gap-4 md:gap-8 py-4 md:py-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-20 md:text-24">⚡</div>
                    <span className="text-12 md:text-14 text-secondary-text">Fast</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-20 md:text-24">🔒</div>
                    <span className="text-12 md:text-14 text-secondary-text">Secure</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-20 md:text-24">💎</div>
                    <span className="text-12 md:text-14 text-secondary-text">Best Rates</span>
                  </div>
                </div>
              </Container>
            )}
            {selectedPlatform === "SimpleSwap" && (
              <div className="flex items-center justify-center">
                <Container className="bg-primary-bg rounded-5 p-4 md:p-6 mb-6 w-full">
                  <ExchangePageClient tokens={tokens} initialExchange={initialExchange} />
                </Container>
              </div>
            )}
          </div>
        </div>
      </Container>
    </ColorSchemeProvider>
  );
}
