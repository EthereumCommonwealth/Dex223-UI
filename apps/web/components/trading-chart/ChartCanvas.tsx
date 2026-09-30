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
  MouseEventParams,
  PriceScaleMode,
  SeriesMarker,
  SeriesType,
  TickMarkType,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { Bar, bucketTime, Datafeed, Resolution, resolutionSeconds, Trade } from "./datafeed/types";
import {
  Drawing,
  DrawingPalette,
  DrawingsPrimitive,
  DrawingTool,
  Point,
  TOOL_POINTS,
} from "./drawings/primitive";
import { formatBarTime, formatPrice, formatPriceTicks, minMoveFor } from "./format";
import { Series as IndicatorSeries } from "./indicators/calc";
import { IndicatorConfig, INDICATORS } from "./indicators/registry";
import { ChartType } from "./store";
import { ChartTheme } from "./theme";

const PAGE = 300;
// Bars kept visible on first load: enough context to read a trend without squashing.
const INITIAL_VISIBLE = 120;

export type LoadState = "loading" | "ready" | "empty" | "error";

/** Indicator id -> output key -> value at one bar. */
export type IndicatorValues = Record<string, Record<string, number | null>>;

/** Where a sub-pane sits inside the chart, for labelling it. */
export interface PaneLayout {
  key: "volume" | string;
  top: number;
}

export interface ChartCanvasHandle {
  resetView: () => void;
  screenshot: () => HTMLCanvasElement | null;
  deleteSelected: () => void;
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
  indicators?: IndicatorConfig[];
  scaleMode?: "normal" | "log" | "percent";
  /** Drawing tool in use; "cursor" selects and drags existing drawings. */
  tool?: DrawingTool;
  magnet?: boolean;
  drawings?: Drawing[];
  onDrawingsChange?: (drawings: Drawing[]) => void;
  /** Called when a drawing is finished, so the toolbar can return to the cursor. */
  onToolDone?: () => void;
  onSelectDrawing?: (id: string | null) => void;
  onHover?: (bar: Bar | null, values?: IndicatorValues) => void;
  onLastBar?: (bar: Bar | null, values?: IndicatorValues) => void;
  onState?: (state: LoadState) => void;
  onTrades?: (trades: Trade[]) => void;
  onLayout?: (panes: PaneLayout[]) => void;
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

function lineData(bars: Bar[], values: IndicatorSeries) {
  return bars.map((b, i) =>
    values[i] === null || values[i] === undefined
      ? { time: t(b.time) }
      : { time: t(b.time), value: values[i]! },
  );
}

// A quiet market can move by a hair over the visible bars; left alone, the scale zooms
// until 0.998502 and 0.998504 are separate ticks. Keep at least 0.4% of height.
function minimumRange(original: () => AutoscaleInfo | null) {
  const info = original();
  if (!info?.priceRange) return info;
  const { minValue, maxValue } = info.priceRange;
  const mid = (minValue + maxValue) / 2;
  const span = Math.abs(mid) * 0.004;
  if (maxValue - minValue >= span) return info;
  return { ...info, priceRange: { minValue: mid - span / 2, maxValue: mid + span / 2 } };
}

interface IndicatorRef {
  config: IndicatorConfig;
  outputs: { key: string; series: ISeriesApi<"Line"> | ISeriesApi<"Histogram"> }[];
}

let drawingSeq = 0;
const newId = () => `d${Date.now().toString(36)}${(drawingSeq++).toString(36)}`;

const ChartCanvas = forwardRef<ChartCanvasHandle, Props>(function ChartCanvas(
  {
    datafeed,
    symbol,
    resolution,
    chartType,
    showVolume,
    theme,
    myTrades,
    pageSize = PAGE,
    initialVisible = INITIAL_VISIBLE,
    watermark,
    indicators = [],
    scaleMode = "normal",
    tool = "cursor",
    magnet = false,
    drawings,
    onDrawingsChange,
    onToolDone,
    onSelectDrawing,
    onHover,
    onLastBar,
    onState,
    onTrades,
    onLayout,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const watermarkRef = useRef<ITextWatermarkPluginApi<Time> | null>(null);
  const indicatorRefs = useRef<IndicatorRef[]>([]);
  const valuesByTimeRef = useRef<Map<number, IndicatorValues>>(new Map());
  const barsRef = useRef<Bar[]>([]);
  const byTimeRef = useRef<Map<number, Bar>>(new Map());

  const resolutionRef = useRef(resolution);
  resolutionRef.current = resolution;
  const visibleRef = useRef(initialVisible);
  visibleRef.current = initialVisible;

  // Latest props for handlers registered once.
  const props = useRef({
    onHover,
    onLastBar,
    onState,
    onTrades,
    onLayout,
    onDrawingsChange,
    onToolDone,
    onSelectDrawing,
    chartType,
    theme,
    tool,
    magnet,
  });
  props.current = {
    onHover,
    onLastBar,
    onState,
    onTrades,
    onLayout,
    onDrawingsChange,
    onToolDone,
    onSelectDrawing,
    chartType,
    theme,
    tool,
    magnet,
  };

  const drawingsRef = useRef<DrawingsPrimitive | null>(null);
  if (!drawingsRef.current) {
    drawingsRef.current = new DrawingsPrimitive({
      bars: () => barsRef.current,
      seconds: () => resolutionSeconds(resolutionRef.current),
      palette: (): DrawingPalette => ({
        line: "#6FB6D9",
        selected: "#A5D8F0",
        handleFill: "#0F0F0F",
        label: "#6FB6D9",
        labelText: "#0F0F0F",
        up: props.current.theme.up,
        down: props.current.theme.down,
      }),
    });
  }
  const primitive = drawingsRef.current;

  const persistable = (list: Drawing[]) => list.filter((d) => d.type !== "measure");

  const commitDrawings = (next: Drawing[]) => {
    primitive.drawings = next;
    primitive.update();
    props.current.onDrawingsChange?.(persistable(next));
  };

  const selectDrawing = (id: string | null) => {
    if (primitive.selectedId === id) return;
    primitive.selectedId = id;
    primitive.update();
    props.current.onSelectDrawing?.(id);
  };

  const deleteSelected = () => {
    if (!primitive.selectedId) return;
    commitDrawings(primitive.drawings.filter((d) => d.id !== primitive.selectedId));
    selectDrawing(null);
  };

  const finish = (drawing: Drawing) => {
    primitive.preview = null;
    if (drawing.type === "measure") {
      // A measurement is a question, not an annotation: shown until the next action.
      primitive.drawings = [...persistable(primitive.drawings), drawing];
      primitive.update();
    } else {
      commitDrawings([...persistable(primitive.drawings), drawing]);
      selectDrawing(drawing.id);
    }
    props.current.onToolDone?.();
  };

  const resetView = () => {
    const chart = chartRef.current;
    const count = barsRef.current.length;
    if (!chart || !count) return;
    chart.timeScale().setVisibleLogicalRange({
      from: Math.max(0, count - visibleRef.current),
      to: count + 8,
    });
    chart.priceScale("right").applyOptions({ autoScale: true });
  };

  useImperativeHandle(ref, () => ({
    resetView,
    screenshot: () => chartRef.current?.takeScreenshot() ?? null,
    deleteSelected,
  }));

  // ---------------------------------------------------------------- pane layout report
  const reportLayout = () => {
    const chart = chartRef.current;
    if (!chart || !props.current.onLayout) return;
    const keys: string[] = [];
    if (volumeRef.current) keys.push("volume");
    for (const ref of indicatorRefs.current) {
      if (INDICATORS[ref.config.type].placement === "pane") keys.push(ref.config.id);
    }
    let top = 0;
    const layout: PaneLayout[] = [];
    chart.panes().forEach((pane, i) => {
      if (i > 0 && keys[i - 1]) layout.push({ key: keys[i - 1], top });
      top += pane.getHeight() + 1; // 1px separator
    });
    props.current.onLayout(layout);
  };

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

    // Crosshair: legend values, and the second point of a drawing being placed.
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      const hoveredId = typeof param.hoveredObjectId === "string" ? param.hoveredObjectId : null;
      if (primitive.hoveredId !== hoveredId) {
        primitive.hoveredId = hoveredId;
        primitive.update();
      }
      if (primitive.preview && param.point) {
        const p = primitive.pointAt(param.point.x, param.point.y, props.current.magnet);
        if (p) {
          primitive.preview = { ...primitive.preview, points: [primitive.preview.points[0], p] };
          primitive.update();
        }
      }
      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        props.current.onHover?.(null);
        return;
      }
      const time = param.time as number;
      props.current.onHover?.(
        byTimeRef.current.get(time) ?? null,
        valuesByTimeRef.current.get(time),
      );
    });

    const observer = new ResizeObserver(() => reportLayout());
    observer.observe(el);

    return () => {
      observer.disconnect();
      markersRef.current = null;
      watermarkRef.current = null;
      indicatorRefs.current = [];
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
    const priceFormat = {
      type: "custom" as const,
      formatter: formatPrice,
      tickmarksFormatter: formatPriceTicks,
      minMove: minMoveFor(barsRef.current[barsRef.current.length - 1]?.close),
    };
    const common = {
      priceLineStyle: LineStyle.Dashed,
      autoscaleInfoProvider: minimumRange,
      priceFormat,
    };
    let series: ISeriesApi<SeriesType>;
    if (chartType === "candles") {
      series = chart.addSeries(CandlestickSeries, {
        ...common,
        upColor: theme.up,
        downColor: theme.down,
        wickUpColor: theme.up,
        wickDownColor: theme.down,
        borderVisible: false,
      });
    } else if (chartType === "line") {
      series = chart.addSeries(LineSeries, {
        ...common,
        color: theme.accent,
        lineWidth: 2,
        lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: theme.accent,
      });
    } else {
      series = chart.addSeries(AreaSeries, {
        ...common,
        lineColor: theme.accent,
        topColor: theme.areaTop,
        bottomColor: theme.areaBottom,
        lineWidth: 2,
        lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: theme.accent,
      });
    }
    if (previous) {
      markersRef.current?.detach();
      markersRef.current = null;
      previous.detachPrimitive(primitive);
      chart.removeSeries(previous);
    }
    series.setData(mainData(barsRef.current, chartType, theme));
    series.attachPrimitive(primitive);
    mainRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);
    applyMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, theme]);

  // ---------------------------------------------------------------- price scale mode
  useEffect(() => {
    const mode =
      scaleMode === "log"
        ? PriceScaleMode.Logarithmic
        : scaleMode === "percent"
          ? PriceScaleMode.Percentage
          : PriceScaleMode.Normal;
    chartRef.current?.priceScale("right").applyOptions({ mode, autoScale: true });
  }, [scaleMode]);

  // ---------------------------------------------------------------- volume + indicators
  // Rebuilt together so pane order is always: price, volume, then pane indicators in the
  // order they were added.
  const indicatorsKey = JSON.stringify(indicators);
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    for (const ref of indicatorRefs.current) {
      for (const o of ref.outputs) chart.removeSeries(o.series);
    }
    indicatorRefs.current = [];
    if (volumeRef.current) {
      chart.removeSeries(volumeRef.current);
      volumeRef.current = null;
    }
    while (chart.panes().length > 1) chart.removePane(chart.panes().length - 1);

    if (showVolume) {
      const volume = chart.addSeries(
        HistogramSeries,
        { priceFormat: { type: "volume" }, lastValueVisible: false, priceLineVisible: false },
        1,
      );
      volume.priceScale().applyOptions({ scaleMargins: { top: 0.15, bottom: 0 } });
      volumeRef.current = volume;
    }

    for (const config of indicators) {
      const def = INDICATORS[config.type];
      const paneIndex = def.placement === "pane" ? chart.panes().length : 0;
      const range = def.range;
      const outputs = def.outputs(config.params).map((out) => {
        const common = {
          priceLineVisible: false,
          lastValueVisible: def.placement === "pane",
          crosshairMarkerVisible: false,
          priceFormat: { type: "custom" as const, formatter: formatPrice },
          ...(range
            ? {
                autoscaleInfoProvider: () => ({
                  priceRange: { minValue: range[0], maxValue: range[1] },
                }),
              }
            : {}),
        };
        const series =
          out.kind === "histogram"
            ? chart.addSeries(HistogramSeries, { ...common, color: out.color }, paneIndex)
            : chart.addSeries(
                LineSeries,
                {
                  ...common,
                  color: out.color,
                  lineWidth: 1,
                  lineStyle: out.dashed ? LineStyle.Dashed : LineStyle.Solid,
                },
                paneIndex,
              );
        return { key: out.key, series };
      });
      for (const level of def.levels ?? []) {
        outputs[outputs.length - 1].series.createPriceLine({
          price: level,
          color: "rgba(133, 141, 140, 0.5)",
          lineStyle: LineStyle.Dotted,
          lineWidth: 1,
          axisLabelVisible: false,
          title: "",
        });
      }
      indicatorRefs.current.push({ config, outputs });
    }

    // Price keeps most of the height; each sub-pane gets a readable strip.
    chart.panes().forEach((pane, i) => pane.setStretchFactor(i === 0 ? 5 : 1.4));
    if (volumeRef.current) chart.panes()[1]?.setStretchFactor(1);

    volumeRef.current?.setData(volumeData(barsRef.current, props.current.theme));
    applyIndicators();
    // New indicators need their latest values in the legend before the next live bar.
    const last = barsRef.current[barsRef.current.length - 1];
    if (last) props.current.onLastBar?.(last, valuesByTimeRef.current.get(last.time));
    requestAnimationFrame(reportLayout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVolume, indicatorsKey]);

  function applyIndicators() {
    const bars = barsRef.current;
    const byTime = new Map<number, IndicatorValues>();
    const { upVolume, downVolume } = props.current.theme;
    for (const ref of indicatorRefs.current) {
      const def = INDICATORS[ref.config.type];
      const computed = def.compute(bars, ref.config.params);
      for (const o of ref.outputs) {
        const values = computed[o.key] ?? [];
        if (o.key === "hist") {
          (o.series as ISeriesApi<"Histogram">).setData(
            bars.map((b, i) =>
              values[i] === null || values[i] === undefined
                ? { time: t(b.time) }
                : {
                    time: t(b.time),
                    value: values[i]!,
                    color: values[i]! >= 0 ? upVolume : downVolume,
                  },
            ),
          );
        } else {
          (o.series as ISeriesApi<"Line">).setData(lineData(bars, values));
        }
      }
      bars.forEach((b, i) => {
        const entry = byTime.get(b.time) ?? {};
        entry[ref.config.id] = Object.fromEntries(
          ref.outputs.map((o) => [o.key, computed[o.key]?.[i] ?? null]),
        );
        byTime.set(b.time, entry);
      });
    }
    valuesByTimeRef.current = byTime;
  }

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

  // ---------------------------------------------------------------- drawings
  useEffect(() => {
    const measures = primitive.drawings.filter((d) => d.type === "measure");
    primitive.drawings = [...(drawings ?? []), ...measures];
    if (primitive.selectedId && !primitive.drawings.some((d) => d.id === primitive.selectedId)) {
      primitive.selectedId = null;
    }
    primitive.update();
  }, [drawings, primitive]);

  useEffect(() => {
    // Leaving a drawing tool mid-placement abandons the half-drawn shape.
    if (tool === "cursor" && primitive.preview) {
      primitive.preview = null;
      primitive.update();
    }
    if (containerRef.current) {
      containerRef.current.style.cursor = tool === "cursor" ? "" : "crosshair";
    }
  }, [tool, primitive]);

  // Pointer input for drawings: placing points, selecting, and dragging. Handled here
  // rather than through the chart's click events because lightweight-charts holds back a
  // second click that lands within its double-click window but too far away to be a
  // double-click, which would silently drop the second point of a quickly drawn line.
  useEffect(() => {
    const el = containerRef.current;
    const chart = chartRef.current;
    if (!el || !chart) return;
    let down: { x: number; y: number } | null = null;
    let drag: { id: string; handle: number | null; start: Point; original: Point[] } | null = null;

    const local = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    // Only the plot of the price pane takes drawings: not the price or time axes, and
    // not the indicator panes below it.
    const inPricePlot = (x: number, y: number) =>
      x >= 0 &&
      x <= chart.timeScale().width() &&
      y >= 0 &&
      y <= (chart.panes()[0]?.getHeight() ?? 0);

    const place = (x: number, y: number) => {
      const active = props.current.tool;
      if (active === "cursor") return;
      const point = primitive.pointAt(x, y, props.current.magnet);
      if (!point) return;
      if (!primitive.preview) {
        const drawing: Drawing = { id: newId(), type: active, points: [point] };
        if (TOOL_POINTS[active] === 1) finish(drawing);
        else {
          primitive.preview = { ...drawing, points: [point, point] };
          primitive.update();
        }
        return;
      }
      finish({ ...primitive.preview, points: [primitive.preview.points[0], point] });
    };

    const select = (x: number, y: number) => {
      if (primitive.drawings.some((d) => d.type === "measure")) {
        primitive.drawings = persistable(primitive.drawings);
        primitive.update();
      }
      selectDrawing(primitive.drawingAt(x, y)?.id ?? null);
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      // The chart cancels the default focus on press; take it so shortcuts work.
      el.focus({ preventScroll: true });
      const { x, y } = local(e);
      if (!inPricePlot(x, y)) return;
      down = { x, y };
      if (props.current.tool !== "cursor") {
        // Keep the press from starting a pan while placing points.
        chart.applyOptions({ handleScroll: false });
        return;
      }
      const target = primitive.drawingAt(x, y);
      if (!target || target.type === "measure") return;
      const start = primitive.pointAt(x, y, false);
      if (!start) return;
      drag = {
        id: target.id,
        handle: primitive.handleAt(target, x, y),
        start,
        original: target.points.map((p) => ({ ...p })),
      };
      selectDrawing(target.id);
      chart.applyOptions({ handleScroll: false, handleScale: false });
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const { x, y } = local(e);
      const now = primitive.pointAt(x, y, drag.handle !== null && props.current.magnet);
      if (!now) return;
      const { id, handle, start, original } = drag;
      primitive.drawings = primitive.drawings.map((d) => {
        if (d.id !== id) return d;
        if (handle !== null) {
          const points = original.map((p) => ({ ...p }));
          points[handle] = now;
          return { ...d, points };
        }
        const dt = now.time - start.time;
        const dp = now.price - start.price;
        return { ...d, points: original.map((p) => ({ time: p.time + dt, price: p.price + dp })) };
      });
      primitive.update();
    };
    const onUp = (e: PointerEvent) => {
      const started = down;
      down = null;
      if (drag) {
        drag = null;
        chart.applyOptions({ handleScroll: true, handleScale: true });
        props.current.onDrawingsChange?.(persistable(primitive.drawings));
        return;
      }
      chart.applyOptions({ handleScroll: true });
      if (!started) return;
      const { x, y } = local(e);
      // A press that moved is a pan, not a click.
      if (Math.hypot(x - started.x, y - started.y) > 4) return;
      if (props.current.tool === "cursor") select(x, y);
      else place(x, y);
    };
    el.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primitive]);

  // Keyboard, while the chart has focus: zoom, scroll, reset, delete, cancel.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      const chart = chartRef.current;
      if (!chart) return;
      const ts = chart.timeScale();
      const spacing = ts.options().barSpacing;
      switch (e.key) {
        case "+":
        case "=":
          ts.applyOptions({ barSpacing: Math.min(50, spacing * 1.25) });
          break;
        case "-":
          ts.applyOptions({ barSpacing: Math.max(1.5, spacing / 1.25) });
          break;
        case "ArrowLeft":
          ts.scrollToPosition(ts.scrollPosition() - 5, false);
          break;
        case "ArrowRight":
          ts.scrollToPosition(ts.scrollPosition() + 5, false);
          break;
        case "Delete":
        case "Backspace":
          deleteSelected();
          break;
        case "Escape":
          primitive.preview = null;
          primitive.drawings = persistable(primitive.drawings);
          primitive.update();
          selectDrawing(null);
          props.current.onToolDone?.();
          break;
        case "r":
        case "R":
          if (!e.altKey) return;
          resetView();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primitive]);

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
      applyIndicators();
      const last = bars[bars.length - 1] ?? null;
      mainRef.current?.applyOptions({
        priceFormat: {
          type: "custom",
          formatter: formatPrice,
          tickmarksFormatter: formatPriceTicks,
          minMove: minMoveFor(last?.close),
        },
      });
      primitive.update();
      props.current.onLastBar?.(last, last ? valuesByTimeRef.current.get(last.time) : undefined);
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
        requestAnimationFrame(reportLayout);
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
        if (indicatorRefs.current.length) applyIndicators();
        props.current.onLastBar?.(bar, valuesByTimeRef.current.get(bar.time));
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

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="absolute inset-0 focus:outline-none"
      aria-label="Price chart"
    />
  );
});

export default ChartCanvas;
