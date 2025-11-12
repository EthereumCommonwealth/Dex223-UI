import Image from "next/image";
import React, { memo, useEffect, useMemo, useRef } from "react";

import Svg from "@/components/atoms/Svg";
import { Currency } from "@/sdk_bi/entities/currency";

function TradingViewWidget({
  tokenA,
  tokenB,
  onSwapTokens,
}: {
  tokenA: Currency | undefined;
  tokenB: Currency | undefined;
  onSwapTokens?: () => void;
}) {
  const QUOTE_CURRENCIES = ['USDT', 'USDC', 'USD', 'BUSD', 'DAI', 'BTC', 'ETH', 'BNB'];
  
  const symbol = useMemo(() => {
    if (!tokenA?.symbol || !tokenB?.symbol) return "BINANCE:BTCUSDT";
    
    const symbolA = tokenA.symbol.toUpperCase();
    const symbolB = tokenB.symbol.toUpperCase();
    
    const isAQuote = QUOTE_CURRENCIES.indexOf(symbolA);
    const isBQuote = QUOTE_CURRENCIES.indexOf(symbolB);
    
    let baseToken = symbolA;
    let quoteToken = symbolB;
    
    if (isAQuote !== -1 && isBQuote !== -1) {
      if (isAQuote > isBQuote) {
        baseToken = symbolA;
        quoteToken = symbolB;
      } else {
        baseToken = symbolB;
        quoteToken = symbolA;
      }
    }
    else if (isAQuote !== -1 && isBQuote === -1) {
      baseToken = symbolB;
      quoteToken = symbolA;
    }
    return `BINANCE:${baseToken}${quoteToken}`;
  }, [tokenA?.symbol, tokenB?.symbol]);

  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current || !symbol) return;

    const containerElement = container.current;

    // Clear any existing content and scripts
    containerElement.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.id = "tradingview_widget_script";
    script.innerHTML = `
      {
        "allow_symbol_change": true,
        "calendar": false,
        "details": false,
        "hide_side_toolbar": true,
        "hide_top_toolbar": false,
        "hide_legend": false,
        "hide_volume": false,
        "hotlist": false,
        "interval": "D",
        "locale": "en",
        "save_image": true,
        "style": "1",
        "symbol": "${symbol}",
        "theme": "dark",
        "timezone": "Etc/UTC",
        "backgroundColor": "#0F0F0F",
        "gridColor": "rgba(242, 242, 242, 0.06)",
        "watchlist": [],
        "withdateranges": false,
        "compareSymbols": [],
        "studies": [],
        "autosize": true,
        "container_id": "tradingview_${Date.now()}"
      }`;

    containerElement.appendChild(script);

    return () => {
      const scripts = containerElement.querySelectorAll("script");
      scripts.forEach((s) => {
        if (s.parentNode) {
          s.parentNode.removeChild(s);
        }
      });
      containerElement.innerHTML = "";
    };
  }, [symbol]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-tertiary-bg border-b border-secondary-border rounded-t-2 flex-shrink-0">
        
        {tokenA && tokenB && (
          <div className="flex items-center flex-shrink-0">  
          <Image
            src={tokenA?.logoURI || "/images/tokens/placeholder.svg"}
            alt={tokenA?.symbol || ""}
            width={32}
            height={32}
            className="h-[24px] w-[24px] md:h-[32px] md:w-[32px] rounded-full border-2 border-tertiary-bg relative z-10"
          />
          <Image
            src={tokenB?.logoURI || "/images/tokens/placeholder.svg"}
            alt={tokenB?.symbol || ""}
            width={32}
            height={32}
            className="h-[24px] w-[24px] md:h-[32px] md:w-[32px] rounded-full relative z-[11] left-[-16px] top-[8px] "
          />
        </div>
        )}
        <span className="text-primary-text text-14 sm:text-16 font-medium uppercase">
          {tokenA && tokenB ? `${tokenA?.symbol} / ${tokenB?.symbol}` : "BTC"}
        </span>
          <button
            onClick={onSwapTokens}
            className="flex items-center justify-center hover:bg-tertiary-bg rounded transition-colors cursor-pointer"
            aria-label="Swap tokens"
          >
            <Svg iconName="swap" size={24} className="text-tertiary-text" />
          </button>

      </div>

      <div
        className="tradingview-widget-container w-full flex-1 min-h-0"
        ref={container}
        style={{
          width: "100%",
          overflow: "hidden",
        }}
      ></div>
    </div>
  );
}

export default memo(TradingViewWidget);
