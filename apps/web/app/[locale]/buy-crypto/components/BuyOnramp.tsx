"use client";

import { OnrampWebSDK } from "@onramp.money/onramp-web-sdk";
import React, { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import Button from "@/components/buttons/Button";

interface BuyOnrampProps {
  appId: number;
  userId?: string;
  flowType: string;
  walletAddress?: string;
}

export default function BuyOnramp({ appId, userId, flowType, walletAddress }: BuyOnrampProps) {
  const [onrampInstanceObj, setOnrampInstanceObj] = useState<any>(null);
  const { address } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const effectiveWalletAddress = walletAddress || address || "";

  useEffect(() => {
    if (
      !effectiveWalletAddress &&
      (flowType === "Sell Crypto" || flowType === "Buy Crypto" || flowType === "Swap Crypto")
    ) {
      setError("Please connect your wallet to proceed");
      return;
    }

    setError(null);

    try {
      const flowTypeInNo = flowType === "Buy Crypto" ? 1 : flowType === "Sell Crypto" ? 2 : 4;
      let obj: any;

      if (flowType === "Buy Crypto") {
        obj = {
          merchantRecognitionId: userId || effectiveWalletAddress,
          appId: appId,
          flowType: flowTypeInNo,
          lang: "en",
          walletAddress: effectiveWalletAddress,
        };
      } else if (flowType === "Sell Crypto") {
        obj = {
          appId: appId,
          flowType: flowTypeInNo,
          walletAddress: effectiveWalletAddress,
          lang: "en",
        };
      } else {
        obj = {
          merchantRecognitionId: userId || effectiveWalletAddress,
          appId: appId,
          walletAddress: effectiveWalletAddress,
          flowType: flowTypeInNo,
          lang: "en",
        };
      }

      const newInstance = new OnrampWebSDK(obj);
      setOnrampInstanceObj(newInstance);

      return () => {
        try {
          newInstance.close();
        } catch (err) {
          console.warn("Error closing onramp instance:", err);
        }
      };
    } catch (err) {
      console.error("Error initializing OnRamp SDK:", err);
      setError("Failed to initialize payment system");
    }
  }, [flowType, appId, userId, effectiveWalletAddress]);

  // Set up event listeners
  useEffect(() => {
    if (!onrampInstanceObj) return;

    const handleTxEvents = (e: any) => {
      if (e.type === "ONRAMP_WIDGET_TX_COMPLETED") {
        const {
          transactionHash,
          walletAddress,
          fiatAmount,
          cryptoAmount,
          coinCode,
          network,
          orderId,
          orderStatus,
          networkData,
        } = e.data || {};

        const record = {
          user_id: userId || effectiveWalletAddress || null,
          transactionHash,
          walletAddress,
          coinCode,
          orderId,
          orderStatus,
          fromAmount: fiatAmount,
          toAmount: cryptoAmount,
          networkName: network,
          networkId: networkData?.networkId,
          hashLink: networkData?.hashLink,
          flowType,
        };

        console.log("Transaction completed:", record);
        // TODO: Add success callback prop if needed
      } else if (e.type === "ONRAMP_WIDGET_TX_FAILED") {
        const { error, orderId } = e.data || {};
        console.error("Transaction failed:", { error, orderId, flowType });
        // TODO: Add error callback prop if needed
      }
    };

    const handleWidgetEvents = (e: any) => {
      if (e.type === "ONRAMP_WIDGET_CLOSE_REQUEST_CONFIRMED") {
        try {
          onrampInstanceObj.close();
        } catch (err) {
          console.warn("Error closing onramp widget:", err);
        }
      }
    };

    try {
      onrampInstanceObj.on("TX_EVENTS", handleTxEvents);
      onrampInstanceObj.on("WIDGET_EVENTS", handleWidgetEvents);
    } catch (err) {
      console.error("Error setting up event listeners:", err);
    }

    // Cleanup function
    return () => {
      try {
        if (onrampInstanceObj) {
          onrampInstanceObj.off("TX_EVENTS", handleTxEvents);
          onrampInstanceObj.off("WIDGET_EVENTS", handleWidgetEvents);
        }
      } catch (err) {
        console.warn("Error removing event listeners:", err);
      }
    };
  }, [onrampInstanceObj, userId, effectiveWalletAddress, flowType]);

  const handleClick = useCallback(() => {
    if (!onrampInstanceObj) {
      console.warn("OnRamp instance not initialized");
      return;
    }

    if (error) {
      console.warn("Cannot show OnRamp due to error:", error);
      return;
    }

    try {
      onrampInstanceObj.show();
    } catch (err) {
      console.error("Error showing OnRamp widget:", err);
      setError("Failed to open payment widget");
    }
  }, [onrampInstanceObj, error]);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {error && <div className="text-red-500 text-sm mb-2 p-2 bg-red-50 rounded">{error}</div>}
      <Button
        onClick={handleClick}
        size={ButtonSize.EXTRA_LARGE}
        mobileSize={ButtonSize.LARGE}
        colorScheme={ButtonColor.PURPLE}
        disabled={!onrampInstanceObj || !!error}
      >
        {flowType === "Buy Crypto" ? "Buy" : flowType === "Sell Crypto" ? "Sell" : "Swap"} with
        Onramp
      </Button>
    </div>
  );
}
