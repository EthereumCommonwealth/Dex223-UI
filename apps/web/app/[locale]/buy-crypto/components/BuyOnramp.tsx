"use client";

import { OnrampWebSDK } from "@onramp.money/onramp-web-sdk";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";

import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import { useConnectWalletDialogStateStore } from "@/components/dialogs/stores/useConnectWalletStore";

import { FLOW_TYPE_MAP, ONRAMP_THEME, OnrampAsset, OnrampFlow } from "./onrampAssets";

type TxCompletedPayload = {
  transactionHash?: string;
  walletAddress?: string;
  fiatAmount?: number | string;
  cryptoAmount?: number | string;
  coinCode?: string;
  network?: string;
  orderId?: string | number;
  orderStatus?: number;
};

interface BuyOnrampProps {
  appId: number;
  flow: OnrampFlow;
  asset: OnrampAsset;
  onCompleted?: (payload: TxCompletedPayload) => void;
}

export default function BuyOnramp({ appId, flow, asset, onCompleted }: BuyOnrampProps) {
  const t = useTranslations("BuyCrypto");
  const tWallet = useTranslations("Wallet");
  const locale = useLocale();
  const { address, isConnected } = useAccount();
  const { setIsOpened: setWalletConnectOpened } = useConnectWalletDialogStateStore();
  const [error, setError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const sdkRef = useRef<InstanceType<typeof OnrampWebSDK> | null>(null);

  const closeSdk = useCallback(() => {
    if (!sdkRef.current) return;
    try {
      sdkRef.current.close();
    } catch {
      // Widget may already be closed.
    }
    sdkRef.current = null;
  }, []);

  useEffect(() => () => closeSdk(), [closeSdk]);

  const buildConfig = useCallback(() => {
    const config: Record<string, unknown> = {
      appId,
      flowType: FLOW_TYPE_MAP[flow],
      lang: locale,
      theme: ONRAMP_THEME,
      isRestricted: true,
    };

    if (address) {
      config.walletAddress = address;
      config.merchantRecognitionId = address;
    }

    if (flow === "buy" && asset.coinCode) {
      config.coinCode = asset.coinCode;
      config.defaultCoinCode = asset.coinCode;
      if (asset.network) {
        config.network = asset.network;
      }
    }

    if (flow === "sell" && asset.coinCode) {
      config.sellCoinCode = asset.coinCode;
      config.defaultSellCoinCode = asset.coinCode;
      if (asset.network) {
        config.sellNetwork = asset.network;
      }
    }

    return config;
  }, [address, appId, asset.coinCode, asset.network, flow, locale]);

  const openWidget = useCallback(() => {
    if (!appId || Number.isNaN(appId)) {
      setError(t("missing_app_id"));
      return;
    }

    if (!isConnected || !address) {
      setWalletConnectOpened(true);
      return;
    }

    setError(null);
    setIsOpening(true);

    try {
      closeSdk();
      const instance = new OnrampWebSDK(
        buildConfig() as ConstructorParameters<typeof OnrampWebSDK>[0],
      );
      sdkRef.current = instance;

      const handleTxEvents = (e: { type?: string; data?: TxCompletedPayload }) => {
        if (e.type === "ONRAMP_WIDGET_TX_COMPLETED") {
          onCompleted?.(e.data || {});
        } else if (e.type === "ONRAMP_WIDGET_TX_FAILED") {
          setError(t("tx_failed"));
        }
      };

      const handleWidgetEvents = (e: { type?: string }) => {
        if (e.type === "ONRAMP_WIDGET_READY") {
          setIsOpening(false);
        } else if (e.type === "ONRAMP_WIDGET_CLOSE_REQUEST_CONFIRMED") {
          closeSdk();
          setIsOpening(false);
        } else if (e.type === "ONRAMP_WIDGET_FAILED") {
          setError(t("widget_failed"));
          setIsOpening(false);
        }
      };

      instance.on("TX_EVENTS", handleTxEvents);
      instance.on("WIDGET_EVENTS", handleWidgetEvents);
      instance.show();
      // Fallback if READY never fires.
      setTimeout(() => setIsOpening(false), 1500);
    } catch (err) {
      console.error("Failed to open Onramp widget:", err);
      setError(t("widget_failed"));
      setIsOpening(false);
    }
  }, [address, appId, buildConfig, closeSdk, isConnected, onCompleted, setWalletConnectOpened, t]);

  const label = !isConnected
    ? tWallet("connect_wallet")
    : flow === "buy"
      ? asset.coinCode
        ? t("cta_buy_asset", { symbol: asset.symbol })
        : t("cta_buy_any")
      : t("cta_sell");

  return (
    <div className="w-full flex flex-col gap-3">
      {error && (
        <div className="text-14 text-red bg-red-bg border border-red rounded-3 px-4 py-3">
          {error}
        </div>
      )}
      <Button
        onClick={openWidget}
        fullWidth
        size={ButtonSize.EXTRA_LARGE}
        mobileSize={ButtonSize.LARGE}
        colorScheme={ButtonColor.PURPLE}
        disabled={isOpening && isConnected}
        isLoading={isOpening && isConnected}
      >
        {label}
      </Button>
      <p className="text-12 text-secondary-text text-center">{t("wallet_destination_hint")}</p>
    </div>
  );
}
