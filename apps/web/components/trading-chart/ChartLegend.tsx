"use client";

import { CompareSeries, IndicatorValues, PaneLayout } from "./ChartCanvas";
import { Bar } from "./datafeed/types";
import { compact, formatPercent, formatPrice } from "./format";
import { IndicatorConfig, INDICATORS, indicatorTitle } from "./indicators/registry";

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pointer-events-auto opacity-0 group-hover:opacity-100 focus:opacity-100 w-4 h-4 inline-flex items-center justify-center rounded-1 text-tertiary-text hocus:text-red-light duration-150"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function values(config: IndicatorConfig, all?: IndicatorValues) {
  const def = INDICATORS[config.type];
  const row = all?.[config.id];
  return def.outputs(config.params).map((out) => ({
    ...out,
    value: row?.[out.key] ?? null,
  }));
}

/** Price legend at the top of the price pane: OHLC and overlay indicators. */
export function PriceLegend({
  title,
  bar,
  indicators,
  indicatorValues,
  volumeLabel,
  volumeUnit,
  removeLabel,
  onRemove,
  compare = [],
  compareValues,
  onRemoveCompare,
}: {
  title: string;
  bar: Bar;
  indicators: IndicatorConfig[];
  indicatorValues?: IndicatorValues;
  volumeLabel: string;
  volumeUnit: string;
  removeLabel: string;
  onRemove: (id: string) => void;
  compare?: CompareSeries[];
  /** Each compared symbol's close at the hovered (or latest) bar. */
  compareValues?: Record<string, number | null>;
  onRemoveCompare?: (symbol: string) => void;
}) {
  const up = bar.close >= bar.open;
  const change = bar.open ? ((bar.close - bar.open) / bar.open) * 100 : 0;
  const flat = bar.trades === 0 && bar.high === bar.low;
  const tone = flat ? "text-secondary-text" : up ? "text-green" : "text-red-light";
  const overlays = indicators.filter((c) => INDICATORS[c.type].placement === "overlay");
  return (
    <div className="absolute left-3 top-2.5 z-10 flex flex-col gap-1 text-12 tabular-nums pointer-events-none max-w-[calc(100%-6rem)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="hidden sm:inline text-secondary-text font-medium">{title}</span>
        {(
          [
            ["O", bar.open],
            ["H", bar.high],
            ["L", bar.low],
            ["C", bar.close],
          ] as const
        ).map(([k, v]) => (
          <span key={k} className="text-tertiary-text">
            {k} <span className={tone}>{formatPrice(v)}</span>
          </span>
        ))}
        <span className={tone}>{formatPercent(change)}</span>
        <span className="text-tertiary-text">
          {volumeLabel}{" "}
          <span className="text-secondary-text">
            {compact(bar.volume)} {volumeUnit}
          </span>
        </span>
      </div>
      {overlays.map((config) => (
        <div key={config.id} className="group pointer-events-auto flex items-center gap-2 w-fit">
          <span className="text-tertiary-text">{indicatorTitle(config)}</span>
          {values(config, indicatorValues).map((v) => (
            <span key={v.key} style={{ color: v.color }}>
              {formatPrice(v.value)}
            </span>
          ))}
          <RemoveButton
            label={`${removeLabel} ${indicatorTitle(config)}`}
            onClick={() => onRemove(config.id)}
          />
        </div>
      ))}
      {compare.map((c) => (
        <div key={c.symbol} className="group pointer-events-auto flex items-center gap-2 w-fit">
          <span className="w-2 h-2 rounded-full" style={{ background: c.color }} aria-hidden />
          <span className="text-secondary-text">{c.label}</span>
          <span style={{ color: c.color }}>{formatPrice(compareValues?.[c.symbol] ?? null)}</span>
          {onRemoveCompare && (
            <RemoveButton
              label={`${removeLabel} ${c.label}`}
              onClick={() => onRemoveCompare(c.symbol)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/** A label at the top of each sub-pane: volume, RSI, MACD. */
export function PaneLabels({
  layout,
  indicators,
  indicatorValues,
  bar,
  volumeLabel,
  volumeUnit,
  removeLabel,
  onRemove,
}: {
  layout: PaneLayout[];
  indicators: IndicatorConfig[];
  indicatorValues?: IndicatorValues;
  bar: Bar | null;
  volumeLabel: string;
  volumeUnit: string;
  removeLabel: string;
  onRemove: (id: string) => void;
}) {
  return (
    <>
      {layout.map((pane) => {
        const config = indicators.find((c) => c.id === pane.key);
        return (
          <div
            key={pane.key}
            className="group absolute left-3 z-10 flex items-center gap-2 text-12 tabular-nums pointer-events-auto"
            style={{ top: pane.top + 6 }}
          >
            {pane.key === "volume" ? (
              <>
                <span className="text-tertiary-text">{volumeLabel}</span>
                <span className="text-secondary-text">
                  {bar ? `${compact(bar.volume)} ${volumeUnit}` : "–"}
                </span>
              </>
            ) : config ? (
              <>
                <span className="text-tertiary-text">{indicatorTitle(config)}</span>
                {values(config, indicatorValues).map((v) => (
                  <span key={v.key} style={{ color: v.color }}>
                    {formatPrice(v.value)}
                  </span>
                ))}
                <RemoveButton
                  label={`${removeLabel} ${indicatorTitle(config)}`}
                  onClick={() => onRemove(config.id)}
                />
              </>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
