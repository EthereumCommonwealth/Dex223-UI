"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Bar } from "./datafeed/types";

type ScaleMode = "normal" | "log" | "percent";

function countdown(bar: Bar | null, seconds: number, now: number): string | null {
  if (!bar || seconds >= 86400 * 7) return null;
  const left = bar.time + seconds - now;
  if (left <= 0 || left > seconds) return null;
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = Math.floor(left % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function zoneLabel(): string {
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const h = Math.floor(Math.abs(offset) / 60);
  const m = Math.abs(offset) % 60;
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

export default function ChartFooter({
  source,
  lastBar,
  seconds,
  scaleMode,
  onScaleMode,
}: {
  source: string;
  lastBar: Bar | null;
  seconds: number;
  scaleMode: ScaleMode;
  onScaleMode: (mode: ScaleMode) => void;
}) {
  const t = useTranslations("TradingChart");
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [zone, setZone] = useState("");

  useEffect(() => {
    setZone(zoneLabel());
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = countdown(lastBar, seconds, now);

  return (
    <div className="flex items-center gap-3 px-3 md:px-4 h-8 border-t border-secondary-border text-12 text-tertiary-text">
      <span className="truncate min-w-0">{source}</span>
      <div className="ml-auto flex items-center gap-3 shrink-0">
        {remaining && (
          <span className="hidden sm:inline tabular-nums" title={t("bar_closes_in")}>
            {t("bar_closes_in")} <span className="text-secondary-text">{remaining}</span>
          </span>
        )}
        {zone && <span className="hidden md:inline">{zone}</span>}
        <div className="flex items-center gap-0.5" role="radiogroup" aria-label={t("price_scale")}>
          {(
            [
              ["percent", "%", t("scale_percent")],
              ["log", "log", t("scale_log")],
              ["normal", "auto", t("scale_auto")],
            ] as const
          ).map(([mode, label, title]) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={scaleMode === mode}
              title={title}
              onClick={() => onScaleMode(scaleMode === mode && mode !== "normal" ? "normal" : mode)}
              className={clsx(
                "px-1.5 h-6 rounded-1 duration-200",
                scaleMode === mode
                  ? "text-green bg-green-bg"
                  : "text-tertiary-text hocus:text-primary-text",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline hocus:text-secondary-text duration-200"
        >
          {t("charts_by")}
        </a>
      </div>
    </div>
  );
}
