"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import TokenLogo from "@/components/atoms/TokenLogo";

import { CompareSeries } from "./ChartCanvas";
import { MARKET_API_URL } from "./datafeed/marketApi";
import { AccentClasses } from "./theme";

/** Enough to compare against a benchmark or two without the lines turning to noise. */
export const MAX_COMPARE = 3;

// Distinct from candle green/red and from both accent schemes.
export const COMPARE_COLORS = ["#F2B84B", "#B48CF2", "#5FC6E8"];

interface SearchResult {
  type: "coin" | "dex";
  symbol: string;
  title: string;
  subtitle: string | null;
  image: string | null;
}

interface TopCoin {
  symbol: string;
  name: string;
  image: string | null;
  chart_symbol: string;
}

function useSearch(query: string, open: boolean) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      const q = query.trim();
      // Before anything is typed, offer the largest coins: the usual benchmarks.
      const request = q
        ? fetch(`${MARKET_API_URL}/v1/search?q=${encodeURIComponent(q)}`, {
            signal: controller.signal,
          })
            .then((r) => (r.ok ? r.json() : { results: [] }))
            .then((body: { results: SearchResult[] }) => body.results ?? [])
        : fetch(`${MARKET_API_URL}/v1/markets?per_page=10`, { signal: controller.signal })
            .then((r) => (r.ok ? r.json() : { coins: [] }))
            .then((body: { coins: TopCoin[] }) =>
              (body.coins ?? []).map(
                (c): SearchResult => ({
                  type: "coin",
                  symbol: c.chart_symbol,
                  title: `${c.symbol}/USD`,
                  subtitle: c.name,
                  image: c.image,
                }),
              ),
            );
      request
        .then(setResults)
        .catch(() => {})
        .finally(() => !controller.signal.aborted && setLoading(false));
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);
  return { results, loading };
}

export default function CompareMenu({
  symbol,
  compare,
  onChange,
  accent,
  compact,
}: {
  /** The chart's own symbol, left out of the results. */
  symbol: string;
  compare: CompareSeries[];
  onChange: (next: CompareSeries[]) => void;
  accent: AccentClasses;
  compact?: boolean;
}) {
  const t = useTranslations("TradingChart");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, loading } = useSearch(query, open);

  // Placed against the viewport, like the indicators panel, so a scrolling toolbar
  // cannot clip it.
  const place = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 320;
    setPosition({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
    });
  };

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
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

  const taken = new Set([symbol, ...compare.map((c) => c.symbol)]);
  const full = compare.length >= MAX_COMPARE;

  const add = (result: SearchResult) => {
    if (full || taken.has(result.symbol)) return;
    const used = new Set(compare.map((c) => c.color));
    const color = COMPARE_COLORS.find((c) => !used.has(c)) ?? COMPARE_COLORS[0];
    onChange([...compare, { symbol: result.symbol, label: result.title, color }]);
    setQuery("");
  };

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
          open || compare.length
            ? "border-primary-border text-primary-text bg-tertiary-bg"
            : "border-secondary-border text-tertiary-text hocus:text-primary-text",
        )}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <path
            d="M2 11.5l3.5-3.5 2.5 2 5.5-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 13.5l4-2 3 1 5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 2"
            opacity=".6"
          />
        </svg>
        <span className={compact ? "sr-only" : undefined}>{t("compare")}</span>
        {compare.length > 0 && (
          <span
            className={clsx(
              "min-w-4 h-4 px-1 rounded-full text-[10px] leading-4 text-center",
              accent.soft,
            )}
          >
            {compare.length}
          </span>
        )}
      </button>

      {open && position && (
        <div
          role="dialog"
          aria-label={t("compare")}
          style={{ top: position.top, left: position.left }}
          className="fixed z-[110] w-[320px] max-h-[70vh] flex flex-col rounded-3 bg-quaternary-bg border border-secondary-border shadow-popover shadow-black/60 p-2"
        >
          <label className="relative block mb-2">
            <span className="sr-only">{t("compare_search")}</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("compare_search")}
              className="w-full h-9 pl-3 pr-3 rounded-2 bg-secondary-bg border border-secondary-border text-14 text-primary-text placeholder:text-tertiary-text focus:outline-none focus:border-primary-border"
            />
          </label>

          {compare.length > 0 && (
            <ul className="flex flex-col gap-1 mb-2 pb-2 border-b border-secondary-border">
              {compare.map((c) => (
                <li
                  key={c.symbol}
                  className="flex items-center gap-2 h-8 px-2.5 rounded-2 bg-tertiary-bg text-12"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="flex-1 min-w-0 truncate text-primary-text">{c.label}</span>
                  <button
                    type="button"
                    onClick={() => onChange(compare.filter((x) => x.symbol !== c.symbol))}
                    aria-label={`${t("remove")} ${c.label}`}
                    className="w-6 h-6 inline-flex items-center justify-center rounded-1 text-tertiary-text hocus:text-primary-text hocus:bg-quaternary-bg duration-200"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                      <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="px-2 pb-1.5 text-12 text-tertiary-text">
            {full ? t("compare_full", { max: MAX_COMPARE }) : t("compare_hint")}
          </p>

          <ul className="overflow-y-auto min-h-0 flex-1">
            {!results.length ? (
              <li className="px-2 py-6 text-center text-12 text-tertiary-text">
                {loading ? t("loading") : t("compare_empty")}
              </li>
            ) : (
              results.map((result) => {
                const disabled = full || taken.has(result.symbol);
                return (
                  <li key={result.symbol}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => add(result)}
                      className="w-full h-10 px-2 flex items-center gap-2.5 rounded-2 text-left hocus:bg-tertiary-bg disabled:opacity-40 disabled:hocus:bg-transparent duration-200"
                    >
                      {result.image ? (
                        <TokenLogo
                          src={result.image}
                          alt={result.title}
                          size={22}
                          className="rounded-full w-[22px] h-[22px] shrink-0"
                        />
                      ) : (
                        <span className="w-[22px] h-[22px] rounded-full bg-tertiary-bg shrink-0" />
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block text-12 font-medium text-primary-text truncate">
                          {result.title}
                        </span>
                        {result.subtitle && (
                          <span className="block text-[11px] text-tertiary-text truncate">
                            {result.subtitle}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-tertiary-text">
                        {result.type === "dex" ? "Dex223" : t("compare_coin")}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
