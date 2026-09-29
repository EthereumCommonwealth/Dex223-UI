"use client";

import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  CrosshairMode,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  LineSeries,
  LineStyle,
  LogicalRange,
  SeriesMarker,
  SeriesType,
  TickMarkType,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { Bar, bucketTime, Datafeed, Resolution, resolutionSeconds, Trade } from "./datafeed/types";
import { formatBarTime, formatPrice, formatPriceTicks, minMoveFor } from "./format";
import { ChartType } from "./store";
import { ChartTheme } from "./theme";

const PAGE = 300;
// Bars kept visible on first load: enough context to read a trend without squashing.
const INITIAL_VISIBLE = 120;

export type LoadState = "loading" | "ready" | "empty" | "error";

export interface ChartCanvasHandle {
  resetView: () => void;
  screenshot: () => HTMLCanvasElement | null;
}

interface Props {
  datafeed: Datafeed;
  symbol: string;
  resolution: Resolution;
  chartType: ChartType;
  showVolume: boolean;
  theme: ChartTheme;
  /** The viewer's own trades, drawn as markers. */
  myTrades?: Trade[];
  onHover?: (bar: Bar | null) => void;
  onLastBar?: (bar: Bar | null) => void;
  onState?: (state: LoadState) => void;
  onTrades?: (trades: Trade[]) => void;
}

const t = (seconds: number) => seconds as UTCTimestamp;

const tickFormatters = {
  year: new Intl.DateTimeFormat(undefined, { year: "numeric" }),
  month: new Intl.DateTimeFormat(undefined, { month: "short" }),
  day: new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }),
  time: new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }),
};

function tickMark(time: Time, type: TickMarkType): string {
  const date = new Date((time as number) * 1000);
  switch (type) {
    case TickMarkType.Year:
      return tickFormatters.year.format(date);
    case TickMarkType.Month:
      return tickFormatters.month.format(date);
    case TickMarkType.DayOfMonth:
      return tickFormatters.day.format(date);
    default:
      return tickFormatters.time.format(date);
  }
}

function mainData(bars: Bar[], type: ChartType) {
  if (type === "candles") {
    return bars.map((b) => ({
      time: t(b.time),
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));
  }
  return bars.map((b) => ({ time: t(b.time), value: b.close }));
}

function volumeData(bars: Bar[], theme: ChartTheme) {
  return bars.map((b) => ({
    time: t(b.time),
    value: b.volume,
    color: b.close >= b.open ? theme.upVolume : theme.downVolume,
  }));
}

const ChartCanvas = forwardRef<ChartCanvasHandle, Props>(function ChartCanvas(
  {
    datafeed,
    symbol,
    resolution,
    chartType,
    showVolume,
    theme,
    myTrades,
    onHover,
    onLastBar,
    onState,
    onTrades,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const barsRef = useRef<Bar[]>([]);
  const byTimeRef = useRef<Map<number, Bar>>(new Map());

  const resolutionRef = useRef(resolution);
  resolutionRef.current = resolution;

  // Latest props for handlers registered once.
  const props = useRef({ onHover, onLastBar, onState, onTrades, chartType, theme });
  props.current = { onHover, onLastBar, onState, onTrades, chartType, theme };

  useImperativeHandle(ref, () => ({
    resetView: () => {
      const chart = chartRef.current;
      const count = barsRef.current.length;
      if (!chart || !count) return;
      chart.timeScale().setVisibleLogicalRange({
        from: Math.max(0, count - INITIAL_VISIBLE),
        to: count + 4,
      });
      chart.priceScale("right").applyOptions({ autoScale: true });
    },
    screenshot: () => chartRef.current?.takeScreenshot() ?? null,
  }));

  // ---------------------------------------------------------------- chart lifecycle
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fontFamily = getComputedStyle(document.body).fontFamily;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: theme.text,
        fontFamily,
        fontSize: 11,
        // Lightweight Charts' Apache-2.0 notice asks for this attribution link.
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: theme.crosshair,
          style: LineStyle.Dashed,
          labelBackgroundColor: theme.crosshairLabel,
        },
        horzLine: {
          color: theme.crosshair,
          style: LineStyle.Dashed,
          labelBackgroundColor: theme.crosshairLabel,
        },
      },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.22 } },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: 8,
        minBarSpacing: 1.5,
        tickMarkFormatter: tickMark,
      },
      localization: {
        priceFormatter: formatPrice,
        tickmarksPriceFormatter: formatPriceTicks,
        timeFormatter: (time: Time) =>
          formatBarTime(time as number, resolutionSeconds(resolutionRef.current) < 86400),
      },
      handleScale: { axisPressedMouseMove: { time: true, price: true } },
    });
    chartRef.current = chart;

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        props.current.onHover?.(null);
        return;
      }
      props.current.onHover?.(byTimeRef.current.get(param.time as number) ?? null);
    });

    return () => {
      markersRef.current = null;
      mainRef.current = null;
      volumeRef.current = null;
      chartRef.current = null;
      chart.remove();
    };
    // The chart is created once; options that change are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------- theme
  useEffect(() => {
    chartRef.current?.applyOptions({
      layout: { textColor: theme.text },
      grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
    });
  }, [theme]);

  // ---------------------------------------------------------------- series type
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (mainRef.current) {
      markersRef.current?.detach();
      markersRef.current = null;
      chart.removeSeries(mainRef.current);
    }
    const priceFormat = {
      type: "custom" as const,
      formatter: formatPrice,
      tickmarksFormatter: formatPriceTicks,
      minMove: minMoveFor(barsRef.current[barsRef.current.length - 1]?.close),
    };
    let series: ISeriesApi<SeriesType>;
    if (chartType === "candles") {
      series = chart.addSeries(CandlestickSeries, {
        upColor: theme.up,
        downColor: theme.down,
        wickUpColor: theme.up,
        wickDownColor: theme.down,
        borderVisible: false,
        priceFormat,
      });
    } else if (chartType === "line") {
      series = chart.addSeries(LineSeries, {
        color: theme.accent,
        lineWidth: 2,
        priceFormat,
        crosshairMarkerRadius: 4,
      });
    } else {
      series = chart.addSeries(AreaSeries, {
        lineColor: theme.accent,
        topColor: theme.areaTop,
        bottomColor: theme.areaBottom,
        lineWidth: 2,
        priceFormat,
        crosshairMarkerRadius: 4,
      });
    }
    series.setData(mainData(barsRef.current, chartType));
    mainRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);
    applyMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, theme]);

  // ---------------------------------------------------------------- volume
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (showVolume && !volumeRef.current) {
      const volume = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
        lastValueVisible: false,
        priceLineVisible: false,
      });
      chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      volume.setData(volumeData(barsRef.current, props.current.theme));
      volumeRef.current = volume;
    } else if (!showVolume && volumeRef.current) {
      chart.removeSeries(volumeRef.current);
      volumeRef.current = null;
    }
    // Give the price the band volume used when volume is hidden.
    chart
      .priceScale("right")
      .applyOptions({ scaleMargins: { top: 0.12, bottom: showVolume ? 0.22 : 0.08 } });
  }, [showVolume]);

  // ---------------------------------------------------------------- markers
  const myTradesRef = useRef(myTrades);
  myTradesRef.current = myTrades;

  function applyMarkers() {
    const plugin = markersRef.current;
    if (!plugin) return;
    const trades = myTradesRef.current ?? [];
    const sec = resolutionSeconds(resolutionRef.current);
    const markers: SeriesMarker<Time>[] = trades
      .map((trade) => ({
        time: t(bucketTime(trade.time, sec)),
        position: trade.side === "buy" ? ("belowBar" as const) : ("aboveBar" as const),
        shape: trade.side === "buy" ? ("arrowUp" as const) : ("arrowDown" as const),
        color: trade.side === "buy" ? props.current.theme.up : props.current.theme.down,
        text: trade.side === "buy" ? "B" : "S",
        size: 1,
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));
    plugin.setMarkers(markers);
  }

  useEffect(() => {
    applyMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTrades, resolution]);

  // ---------------------------------------------------------------- data
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    let cancelled = false;
    let loadingOlder = false;
    let hasMore = true;
    const controller = new AbortController();
    const sec = resolutionSeconds(resolution);

    const setAll = (bars: Bar[]) => {
      barsRef.current = bars;
      byTimeRef.current = new Map(bars.map((b) => [b.time, b]));
      mainRef.current?.setData(mainData(bars, props.current.chartType));
      volumeRef.current?.setData(volumeData(bars, props.current.theme));
      const last = bars[bars.length - 1] ?? null;
      mainRef.current?.applyOptions({
        priceFormat: {
          type: "custom",
          formatter: formatPrice,
          tickmarksFormatter: formatPriceTicks,
          minMove: minMoveFor(last?.close),
        },
      });
      props.current.onLastBar?.(last);
      applyMarkers();
    };

    setAll([]);
    props.current.onState?.("loading");

    const now = Math.floor(Date.now() / 1000);
    datafeed
      .getBars({ symbol, resolution, to: now, countback: PAGE }, controller.signal)
      .then((bars) => {
        if (cancelled) return;
        setAll(bars);
        hasMore = bars.length > 0;
        props.current.onState?.(bars.length ? "ready" : "empty");
        if (bars.length) {
          chart.timeScale().setVisibleLogicalRange({
            from: Math.max(0, bars.length - INITIAL_VISIBLE),
            to: bars.length + 4,
          });
        }
      })
      .catch((error) => {
        if (cancelled || controller.signal.aborted) return;
        console.warn("Chart history failed", error);
        props.current.onState?.("error");
      });

    // Older history as the user scrolls back.
    const onRange = (range: LogicalRange | null) => {
      if (!range || range.from > 20 || loadingOlder || !hasMore || !barsRef.current.length) return;
      loadingOlder = true;
      const first = barsRef.current[0].time;
      datafeed
        .getBars({ symbol, resolution, to: first - 1, countback: PAGE }, controller.signal)
        .then((older) => {
          if (cancelled) return;
          const fresh = older.filter((b) => b.time < first);
          if (!fresh.length) {
            hasMore = false;
            return;
          }
          const visible = chart.timeScale().getVisibleLogicalRange();
          setAll([...fresh, ...barsRef.current]);
          // Keep the viewport where the user was instead of jumping by the prepended count.
          if (visible) {
            chart.timeScale().setVisibleLogicalRange({
              from: visible.from + fresh.length,
              to: visible.to + fresh.length,
            });
          }
        })
        .catch(() => {})
        .finally(() => {
          loadingOlder = false;
        });
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRange);

    // Live updates. A bar with the same time replaces the forming one; a newer time
    // starts the next bar. Bars between the last one and the new one are filled flat,
    // so a quiet pool does not leave a hole when trading resumes.
    const unsubscribe = datafeed.subscribe(symbol, resolution, {
      onBar: (incoming) => {
        if (cancelled) return;
        const bars = barsRef.current;
        const last = bars[bars.length - 1];
        const bar = { ...incoming, time: bucketTime(incoming.time, sec) };
        if (last && bar.time < last.time) return;
        const additions: Bar[] = [];
        if (last && bar.time > last.time + sec) {
          for (let time = last.time + sec; time < bar.time; time += sec) {
            const p = last.close;
            additions.push({
              time,
              open: p,
              high: p,
              low: p,
              close: p,
              volume: 0,
              quote_volume: 0,
              trades: 0,
            });
          }
        }
        additions.push(bar);
        for (const b of additions) {
          if (last && b.time === last.time) bars[bars.length - 1] = b;
          else bars.push(b);
          byTimeRef.current.set(b.time, b);
          const [main] = mainData([b], props.current.chartType);
          mainRef.current?.update(main);
          const [vol] = volumeData([b], props.current.theme);
          volumeRef.current?.update(vol);
        }
        props.current.onLastBar?.(bar);
        if (bars.length === 1) props.current.onState?.("ready");
      },
      onTrades: (trades) => {
        if (!cancelled) props.current.onTrades?.(trades);
      },
    });

    return () => {
      cancelled = true;
      controller.abort();
      unsubscribe();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datafeed, symbol, resolution]);

  return <div ref={containerRef} className="absolute inset-0" />;
});

export default ChartCanvas;
