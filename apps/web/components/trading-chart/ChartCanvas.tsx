"use client";

import {
  AreaSeries,
  AutoscaleInfo,
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  createTextWatermark,
  CrosshairMode,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  ITextWatermarkPluginApi,
  LastPriceAnimationMode,
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
  /** Bars requested per history page (default 300). */
  pageSize?: number;
  /** Bars in view after the first load; Infinity shows everything loaded. */
  initialVisible?: number;
  /** Faint text behind the plot, e.g. the pair. */
  watermark?: string;
  /** Draw 7 and 25 period simple moving averages. */
  showMA?: boolean;
  onHover?: (bar: Bar | null, ma?: MovingAverages) => void;
  onLastBar?: (bar: Bar | null, ma?: MovingAverages) => void;
  onState?: (state: LoadState) => void;
  onTrades?: (trades: Trade[]) => void;
}

const t = (seconds: number) => seconds as UTCTimestamp;

const tickFormatters = {
  // The chart places year, month and day ticks on UTC boundaries, so they are labelled
  // in UTC; in a local zone behind UTC, 1 January 00:00 UTC would read as 31 December.
  year: new Intl.DateTimeFormat(undefined, { year: "numeric", timeZone: "UTC" }),
  month: new Intl.DateTimeFormat(undefined, { month: "short", timeZone: "UTC" }),
  day: new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", timeZone: "UTC" }),
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

export interface MovingAverages {
  ma7: number | null;
  ma25: number | null;
}

export const MA_PERIODS = [7, 25] as const;

/** Simple moving average of closes; null until a full window exists. */
function sma(bars: Bar[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(bars.length).fill(null);
  let sum = 0;
  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].close;
    if (i >= period) sum -= bars[i - period].close;
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

function mainData(bars: Bar[], type: ChartType, theme: ChartTheme) {
  if (type === "candles") {
    // A period with no trades is the pool holding its price. Drawn as a muted tick it
    // keeps time continuous without competing with the candles that carry information.
    return bars.map((b) =>
      b.trades === 0 && b.high === b.low
        ? {
            time: t(b.time),
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
            color: theme.flat,
            wickColor: theme.flat,
          }
        : { time: t(b.time), open: b.open, high: b.high, low: b.low, close: b.close },
    );
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
    pageSize = PAGE,
    initialVisible = INITIAL_VISIBLE,
    watermark,
    showMA = false,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const watermarkRef = useRef<ITextWatermarkPluginApi<Time> | null>(null);
  const maRefs = useRef<ISeriesApi<"Line">[]>([]);
  const maByTimeRef = useRef<Map<number, MovingAverages>>(new Map());
  const barsRef = useRef<Bar[]>([]);
  const byTimeRef = useRef<Map<number, Bar>>(new Map());

  const resolutionRef = useRef(resolution);
  resolutionRef.current = resolution;
  const visibleRef = useRef(initialVisible);
  visibleRef.current = initialVisible;

  // Latest props for handlers registered once.
  const props = useRef({ onHover, onLastBar, onState, onTrades, chartType, theme });
  props.current = { onHover, onLastBar, onState, onTrades, chartType, theme };

  useImperativeHandle(ref, () => ({
    resetView: () => {
      const chart = chartRef.current;
      const count = barsRef.current.length;
      if (!chart || !count) return;
      chart.timeScale().setVisibleLogicalRange({
        from: Math.max(0, count - visibleRef.current),
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
        // The Apache-2.0 attribution is shown as a link under the chart instead of a
        // logo stamped over the plot (see TradingChart).
        attributionLogo: false,
        panes: {
          separatorColor: theme.separator,
          separatorHoverColor: theme.separatorHover,
          enableResize: true,
        },
      },
      grid: {
        vertLines: { visible: false },
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
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.08 },
        entireTextOnly: true,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
        barSpacing: 9,
        minBarSpacing: 1.5,
        shiftVisibleRangeOnNewBar: true,
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
      const time = param.time as number;
      props.current.onHover?.(byTimeRef.current.get(time) ?? null, maByTimeRef.current.get(time));
    });

    return () => {
      markersRef.current = null;
      watermarkRef.current = null;
      maRefs.current = [];
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
      layout: {
        textColor: theme.text,
        panes: { separatorColor: theme.separator, separatorHoverColor: theme.separatorHover },
      },
      grid: { horzLines: { color: theme.grid } },
    });
  }, [theme]);

  // ---------------------------------------------------------------- series type
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    // The old series goes only after the new one exists: lightweight-charts drops a
    // pane the moment it has no series, and the volume pane would then slide up into
    // pane 0 and receive the new price series.
    const previous = mainRef.current;
    // A quiet market can move by a hair over the visible bars; left alone, the scale zooms
    // until 0.998502 and 0.998504 are separate ticks. Keep at least 0.4% of height.
    const autoscaleInfoProvider = (original: () => AutoscaleInfo | null) => {
      const info = original();
      if (!info?.priceRange) return info;
      const { minValue, maxValue } = info.priceRange;
      const mid = (minValue + maxValue) / 2;
      const span = Math.abs(mid) * 0.004;
      if (maxValue - minValue >= span) return info;
      return { ...info, priceRange: { minValue: mid - span / 2, maxValue: mid + span / 2 } };
    };
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
        priceLineStyle: LineStyle.Dashed,
        autoscaleInfoProvider,
        priceFormat,
      });
    } else if (chartType === "line") {
      series = chart.addSeries(LineSeries, {
        color: theme.accent,
        lineWidth: 2,
        priceLineStyle: LineStyle.Dashed,
        autoscaleInfoProvider,
        lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate,
        priceFormat,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: theme.accent,
      });
    } else {
      series = chart.addSeries(AreaSeries, {
        lineColor: theme.accent,
        topColor: theme.areaTop,
        bottomColor: theme.areaBottom,
        lineWidth: 2,
        priceLineStyle: LineStyle.Dashed,
        autoscaleInfoProvider,
        lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate,
        priceFormat,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: theme.accent,
      });
    }
    if (previous) {
      markersRef.current?.detach();
      markersRef.current = null;
      chart.removeSeries(previous);
    }
    series.setData(mainData(barsRef.current, chartType, theme));
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
      // Volume gets its own pane under the price: the price scale keeps its full height
      // and the bars never sit on top of the candles.
      const volume = chart.addSeries(
        HistogramSeries,
        {
          priceFormat: { type: "volume" },
          lastValueVisible: false,
          priceLineVisible: false,
        },
        1,
      );
      volume.priceScale().applyOptions({ scaleMargins: { top: 0.15, bottom: 0 } });
      const [pricePane, volumePane] = chart.panes();
      pricePane?.setStretchFactor(4);
      volumePane?.setStretchFactor(1);
      volume.setData(volumeData(barsRef.current, props.current.theme));
      volumeRef.current = volume;
    } else if (!showVolume && volumeRef.current) {
      chart.removeSeries(volumeRef.current);
      volumeRef.current = null;
      if (chart.panes().length > 1) chart.removePane(1);
    }
  }, [showVolume]);

  // ---------------------------------------------------------------- watermark
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const options = {
      visible: !!watermark,
      horzAlign: "center" as const,
      vertAlign: "center" as const,
      lines: [{ text: watermark ?? "", color: theme.watermark, fontSize: 44, fontStyle: "600" }],
    };
    if (watermarkRef.current) watermarkRef.current.applyOptions(options);
    else watermarkRef.current = createTextWatermark(chart.panes()[0], options);
  }, [watermark, theme]);

  // ---------------------------------------------------------------- moving averages
  function applyMA() {
    const bars = barsRef.current;
    const series = maRefs.current;
    const lines = MA_PERIODS.map((period) => sma(bars, period));
    const byTime = new Map<number, MovingAverages>();
    bars.forEach((b, i) => byTime.set(b.time, { ma7: lines[0][i], ma25: lines[1][i] }));
    maByTimeRef.current = byTime;
    series.forEach((line, k) =>
      line.setData(
        bars.map((b, i) =>
          lines[k][i] === null ? { time: t(b.time) } : { time: t(b.time), value: lines[k][i]! },
        ),
      ),
    );
  }

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    maRefs.current.forEach((line) => chart.removeSeries(line));
    maRefs.current = [];
    if (showMA) {
      maRefs.current = [theme.ma1, theme.ma2].map((color) =>
        chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
          priceFormat: { type: "custom", formatter: formatPrice },
        }),
      );
    }
    applyMA();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMA, theme]);

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
      mainRef.current?.setData(mainData(bars, props.current.chartType, props.current.theme));
      volumeRef.current?.setData(volumeData(bars, props.current.theme));
      applyMA();
      const last = bars[bars.length - 1] ?? null;
      mainRef.current?.applyOptions({
        priceFormat: {
          type: "custom",
          formatter: formatPrice,
          tickmarksFormatter: formatPriceTicks,
          minMove: minMoveFor(last?.close),
        },
      });
      props.current.onLastBar?.(last, last ? maByTimeRef.current.get(last.time) : undefined);
      applyMarkers();
    };

    setAll([]);
    props.current.onState?.("loading");

    const now = Math.floor(Date.now() / 1000);
    datafeed
      .getBars({ symbol, resolution, to: now, countback: pageSize }, controller.signal)
      .then((bars) => {
        if (cancelled) return;
        setAll(bars);
        hasMore = bars.length > 0;
        props.current.onState?.(bars.length ? "ready" : "empty");
        if (bars.length) {
          chart.timeScale().setVisibleLogicalRange({
            from: Math.max(0, bars.length - initialVisible),
            to: bars.length + 8,
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
        .getBars({ symbol, resolution, to: first - 1, countback: pageSize }, controller.signal)
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
          const [main] = mainData([b], props.current.chartType, props.current.theme);
          mainRef.current?.update(main);
          const [vol] = volumeData([b], props.current.theme);
          volumeRef.current?.update(vol);
        }
        if (maRefs.current.length) applyMA();
        props.current.onLastBar?.(bar, maByTimeRef.current.get(bar.time));
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
  }, [datafeed, symbol, resolution, pageSize, initialVisible]);

  return <div ref={containerRef} className="absolute inset-0" />;
});

export default ChartCanvas;
