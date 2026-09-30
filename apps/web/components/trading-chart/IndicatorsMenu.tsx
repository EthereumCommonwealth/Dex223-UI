"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import {
  defaultConfig,
  INDICATOR_ORDER,
  IndicatorConfig,
  INDICATORS,
  indicatorTitle,
} from "./indicators/registry";

/** At most this many indicators at once: beyond it the panes get too thin to read. */
const MAX_INDICATORS = 6;

export default function IndicatorsMenu({
  indicators,
  onChange,
  showVolume,
  onShowVolume,
}: {
  indicators: IndicatorConfig[];
  onChange: (next: IndicatorConfig[]) => void;
  showVolume: boolean;
  onShowVolume: (show: boolean) => void;
}) {
  const t = useTranslations("TradingChart");
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // The toolbar scrolls sideways on narrow screens, which would clip an absolutely
  // positioned panel; the panel is placed against the viewport instead.
  const place = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 300;
    setPosition({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
    });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onMove = () => place();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  const update = (id: string, index: number, value: number) =>
    onChange(
      indicators.map((c) =>
        c.id === id ? { ...c, params: c.params.map((p, i) => (i === index ? value : p)) } : c,
      ),
    );

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          if (!open) place();
          setOpen(!open);
        }}
        className={clsx(
          "h-7 pl-2 pr-2.5 inline-flex items-center gap-1.5 rounded-2 text-12 font-medium border duration-200",
          open || indicators.length
            ? "border-primary-border text-primary-text bg-tertiary-bg"
            : "border-secondary-border text-tertiary-text hocus:text-primary-text",
        )}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <path
            d="M2 12.5l3.5-4 3 2.5L14 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {t("indicators")}
        {indicators.length > 0 && (
          <span className="min-w-4 h-4 px-1 rounded-full bg-green-bg text-green text-[10px] leading-4 text-center">
            {indicators.length}
          </span>
        )}
      </button>

      {open && position && (
        <div
          role="dialog"
          aria-label={t("indicators")}
          style={{ top: position.top, left: position.left }}
          className="fixed z-[110] w-[300px] max-h-[70vh] overflow-y-auto rounded-3 bg-quaternary-bg border border-secondary-border shadow-popover shadow-black/60 p-2"
        >
          <label className="flex items-center justify-between h-9 px-2.5 mb-1 rounded-2 hocus:bg-tertiary-bg cursor-pointer text-12">
            <span className="text-primary-text font-medium">{t("volume")}</span>
            <input
              type="checkbox"
              checked={showVolume}
              onChange={(e) => onShowVolume(e.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={clsx(
                "relative w-8 h-[18px] rounded-full duration-200",
                showVolume ? "bg-green" : "bg-tertiary-bg border border-secondary-border",
              )}
            >
              <span
                className={clsx(
                  "absolute top-[2px] w-3.5 h-3.5 rounded-full bg-primary-text duration-200",
                  showVolume ? "left-[16px]" : "left-[2px]",
                )}
              />
            </span>
          </label>
          <div className="px-2 pt-2 pb-2 text-12 text-tertiary-text border-t border-secondary-border">
            {t("add_indicator")}
          </div>
          <ul className="grid grid-cols-2 gap-1">
            {INDICATOR_ORDER.map((type) => {
              const def = INDICATORS[type];
              return (
                <li key={type}>
                  <button
                    type="button"
                    disabled={indicators.length >= MAX_INDICATORS}
                    onClick={() => onChange([...indicators, defaultConfig(type)])}
                    title={def.name}
                    className="w-full h-9 px-2.5 flex items-center justify-between rounded-2 text-left text-12 text-secondary-text hocus:bg-tertiary-bg hocus:text-primary-text disabled:opacity-40 duration-200"
                  >
                    <span className="font-medium text-primary-text">{def.short}</span>
                    <span className="text-[10px] text-tertiary-text">
                      {def.placement === "pane" ? t("indicator_pane") : t("indicator_overlay")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {indicators.length > 0 && (
            <>
              <div className="px-2 pt-3 pb-2 text-12 text-tertiary-text border-t border-secondary-border mt-2">
                {t("active_indicators")}
              </div>
              <ul className="flex flex-col gap-1">
                {indicators.map((config) => {
                  const def = INDICATORS[config.type];
                  return (
                    <li
                      key={config.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-2 bg-tertiary-bg"
                    >
                      <span className="text-12 font-medium text-primary-text w-12 shrink-0">
                        {def.short}
                      </span>
                      <div className="flex gap-1.5 flex-1 min-w-0">
                        {def.params.map((param, i) => (
                          <label
                            key={param.label}
                            className="flex flex-col min-w-0"
                            title={param.label}
                          >
                            <span className="sr-only">{param.label}</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min={param.min}
                              max={param.max}
                              step={param.step ?? 1}
                              value={config.params[i]}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                if (Number.isFinite(v) && v >= param.min && v <= param.max) {
                                  update(config.id, i, v);
                                }
                              }}
                              className="w-14 h-7 px-1.5 rounded-[6px] bg-secondary-bg border border-secondary-border text-12 text-primary-text tabular-nums focus:outline-none focus:border-green"
                            />
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        aria-label={`${t("remove")} ${indicatorTitle(config)}`}
                        onClick={() => onChange(indicators.filter((c) => c.id !== config.id))}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-2 text-tertiary-text hocus:text-red-light hocus:bg-quaternary-bg duration-200"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                          <path
                            d="M3.5 3.5l7 7M10.5 3.5l-7 7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
