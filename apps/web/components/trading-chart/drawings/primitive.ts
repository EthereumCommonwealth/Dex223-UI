import type { CanvasRenderingTarget2D } from "fancy-canvas";
import {
  IChartApi,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  Logical,
  PrimitiveHoveredItem,
  SeriesAttachedParameter,
  SeriesType,
  Time,
} from "lightweight-charts";

import { Bar } from "../datafeed/types";
import { formatPercent, formatPrice } from "../format";

export type DrawingType = "trend" | "hline" | "vline" | "rect" | "fib" | "measure" | "alert";
export type DrawingTool = "cursor" | DrawingType;

export interface Point {
  time: number;
  price: number;
}

export interface Drawing {
  id: string;
  type: DrawingType;
  points: Point[];
  /** Alerts only: set once the price has crossed the line. */
  triggered?: boolean;
}

/** How many clicks each tool takes. */
export const TOOL_POINTS: Record<DrawingType, 1 | 2> = {
  trend: 2,
  hline: 1,
  vline: 1,
  rect: 2,
  fib: 2,
  measure: 2,
  alert: 1,
};

const ALERT_COLOR = "#E7A36A";
const ALERT_DONE_COLOR = "#858D8C";

export const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

export interface DrawingPalette {
  line: string;
  selected: string;
  handleFill: string;
  label: string;
  labelText: string;
  up: string;
  down: string;
}

interface Context {
  bars: () => Bar[];
  seconds: () => number;
  palette: () => DrawingPalette;
}

type XY = { x: number; y: number };

const HIT_TOLERANCE = 6;
const HANDLE_RADIUS = 4.5;

function distanceToSegment(p: XY, a: XY, b: XY): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function durationLabel(seconds: number): string {
  const abs = Math.abs(seconds);
  if (abs < 3600) return `${Math.round(abs / 60)}m`;
  if (abs < 86400) return `${(abs / 3600).toFixed(abs < 36000 ? 1 : 0)}h`;
  return `${(abs / 86400).toFixed(abs < 864000 ? 1 : 0)}d`;
}

/**
 * Renders user drawings on the price pane and answers hit tests for them.
 *
 * Points are stored as (time, price), not pixels or bar indexes, so drawings stay put
 * when older history is prepended, the viewport scrolls, or the window resizes, and can
 * sit in the future beyond the last bar.
 */
export class DrawingsPrimitive implements ISeriesPrimitive<Time> {
  private chart: IChartApi | null = null;
  private series: ISeriesApi<SeriesType> | null = null;
  private requestUpdate: (() => void) | null = null;

  drawings: Drawing[] = [];
  preview: Drawing | null = null;
  selectedId: string | null = null;
  hoveredId: string | null = null;

  constructor(private readonly ctx: Context) {}

  attached(param: SeriesAttachedParameter<Time, SeriesType>) {
    this.chart = param.chart as IChartApi;
    this.series = param.series;
    this.requestUpdate = param.requestUpdate;
  }

  detached() {
    this.chart = null;
    this.series = null;
    this.requestUpdate = null;
  }

  update() {
    this.requestUpdate?.();
  }

  // ------------------------------------------------------------------ coordinates

  /** Fractional bar index for any time, extrapolating before the first and after the last bar. */
  private logicalFor(time: number): number | null {
    const bars = this.ctx.bars();
    const sec = this.ctx.seconds();
    if (!bars.length) return null;
    if (time <= bars[0].time) return (time - bars[0].time) / sec;
    const last = bars.length - 1;
    if (time >= bars[last].time) return last + (time - bars[last].time) / sec;
    let lo = 0;
    let hi = last;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (bars[mid].time <= time) lo = mid;
      else hi = mid;
    }
    const span = bars[hi].time - bars[lo].time || sec;
    return lo + (time - bars[lo].time) / span;
  }

  timeToX(time: number): number | null {
    const logical = this.logicalFor(time);
    if (logical === null || !this.chart) return null;
    return this.chart.timeScale().logicalToCoordinate(logical as Logical);
  }

  xToTime(x: number): number | null {
    const bars = this.ctx.bars();
    const sec = this.ctx.seconds();
    if (!this.chart || !bars.length) return null;
    const logical = this.chart.timeScale().coordinateToLogical(x);
    if (logical === null) return null;
    const i = Math.round(logical);
    if (i < 0) return bars[0].time + i * sec;
    if (i >= bars.length) return bars[bars.length - 1].time + (i - bars.length + 1) * sec;
    return bars[i].time;
  }

  priceToY(price: number): number | null {
    return this.series?.priceToCoordinate(price) ?? null;
  }

  yToPrice(y: number): number | null {
    return this.series?.coordinateToPrice(y) ?? null;
  }

  toXY(p: Point): XY | null {
    const x = this.timeToX(p.time);
    const y = this.priceToY(p.price);
    return x === null || y === null ? null : { x, y };
  }

  /** The chart point under (x, y); with `magnet`, the price snaps to the bar's nearest O/H/L/C. */
  pointAt(x: number, y: number, magnet: boolean): Point | null {
    const time = this.xToTime(x);
    const price = this.yToPrice(y);
    if (time === null || price === null) return null;
    if (!magnet) return { time, price };
    const bar = this.ctx.bars().find((b) => b.time === time);
    if (!bar) return { time, price };
    let best = price;
    let bestDist = Infinity;
    for (const v of [bar.open, bar.high, bar.low, bar.close]) {
      const vy = this.priceToY(v);
      if (vy === null) continue;
      const d = Math.abs(vy - y);
      if (d < bestDist) {
        bestDist = d;
        best = v;
      }
    }
    return { time, price: bestDist < 24 ? best : price };
  }

  // ------------------------------------------------------------------ hit testing

  /** Distance from (x, y) to a drawing in pixels, or Infinity when off it. */
  distanceTo(d: Drawing, x: number, y: number): number {
    const pts = d.points.map((p) => this.toXY(p));
    if (pts.some((p) => p === null)) return Infinity;
    const [a, b] = pts as XY[];
    const p = { x, y };
    switch (d.type) {
      case "trend":
        return b ? distanceToSegment(p, a, b) : Infinity;
      case "hline":
      case "alert":
        return Math.abs(y - a.y);
      case "vline":
        return Math.abs(x - a.x);
      case "rect":
      case "measure": {
        if (!b) return Infinity;
        const [x0, x1] = [Math.min(a.x, b.x), Math.max(a.x, b.x)];
        const [y0, y1] = [Math.min(a.y, b.y), Math.max(a.y, b.y)];
        const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1;
        const edge = Math.min(
          distanceToSegment(p, { x: x0, y: y0 }, { x: x1, y: y0 }),
          distanceToSegment(p, { x: x0, y: y1 }, { x: x1, y: y1 }),
          distanceToSegment(p, { x: x0, y: y0 }, { x: x0, y: y1 }),
          distanceToSegment(p, { x: x1, y: y0 }, { x: x1, y: y1 }),
        );
        return inside ? Math.min(edge, HIT_TOLERANCE - 1) : edge;
      }
      case "fib": {
        if (!b) return Infinity;
        const [x0, x1] = [Math.min(a.x, b.x), Math.max(a.x, b.x)];
        if (x < x0 - HIT_TOLERANCE || x > x1 + HIT_TOLERANCE) return Infinity;
        return Math.min(
          ...FIB_LEVELS.map((lvl) => {
            const ly = this.priceToY(
              d.points[1].price + (d.points[0].price - d.points[1].price) * lvl,
            );
            return ly === null ? Infinity : Math.abs(y - ly);
          }),
        );
      }
    }
  }

  /** Index of the endpoint handle under (x, y), for dragging. */
  handleAt(d: Drawing, x: number, y: number): number | null {
    for (let i = 0; i < d.points.length; i++) {
      const p = this.toXY(d.points[i]);
      if (!p) continue;
      if ((d.type === "hline" || d.type === "alert") && Math.abs(y - p.y) <= HIT_TOLERANCE) {
        return null;
      }
      if (Math.hypot(p.x - x, p.y - y) <= HANDLE_RADIUS + 4) return i;
    }
    return null;
  }

  drawingAt(x: number, y: number): Drawing | null {
    let best: Drawing | null = null;
    let bestDist = HIT_TOLERANCE;
    for (const d of this.drawings) {
      const dist = this.distanceTo(d, x, y);
      if (dist <= bestDist) {
        best = d;
        bestDist = dist;
      }
    }
    return best;
  }

  hitTest(x: number, y: number): PrimitiveHoveredItem | null {
    const d = this.drawingAt(x, y);
    if (!d) return null;
    return {
      externalId: d.id,
      zOrder: "top",
      cursorStyle: this.handleAt(d, x, y) !== null ? "grab" : "move",
      distance: this.distanceTo(d, x, y),
    };
  }

  // ------------------------------------------------------------------ rendering

  paneViews(): readonly IPrimitivePaneView[] {
    return [{ zOrder: () => "top", renderer: () => this.renderer }];
  }

  private renderer: IPrimitivePaneRenderer = {
    draw: (target: CanvasRenderingTarget2D) => {
      target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
        const all = this.preview ? [...this.drawings, this.preview] : this.drawings;
        for (const d of all) this.drawOne(ctx, d, mediaSize.width, mediaSize.height);
      });
    },
  };

  private drawOne(ctx: CanvasRenderingContext2D, d: Drawing, width: number, height: number) {
    const pal = this.ctx.palette();
    const active = d.id === this.selectedId || d.id === this.hoveredId || d === this.preview;
    const pts = d.points.map((p) => this.toXY(p));
    if (pts.some((p) => p === null)) return;
    const [a, b] = pts as XY[];
    const color = d.id === this.selectedId ? pal.selected : pal.line;

    ctx.save();
    ctx.lineWidth = active ? 2 : 1.5;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    switch (d.type) {
      case "trend":
        if (b) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        break;
      case "hline":
        ctx.beginPath();
        ctx.moveTo(0, a.y);
        ctx.lineTo(width, a.y);
        ctx.stroke();
        this.priceTag(ctx, formatPrice(d.points[0].price), width, a.y, color, pal);
        break;
      case "alert": {
        const alertColor = d.triggered ? ALERT_DONE_COLOR : ALERT_COLOR;
        ctx.strokeStyle = alertColor;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, a.y);
        ctx.lineTo(width, a.y);
        ctx.stroke();
        ctx.setLineDash([]);
        this.priceTag(
          ctx,
          `${d.triggered ? "\u2713" : "\u23F0"} ${formatPrice(d.points[0].price)}`,
          width,
          a.y,
          alertColor,
          pal,
        );
        break;
      }
      case "vline":
        ctx.beginPath();
        ctx.moveTo(a.x, 0);
        ctx.lineTo(a.x, height);
        ctx.stroke();
        break;
      case "rect":
        if (b) {
          ctx.globalAlpha = 0.12;
          ctx.fillRect(
            Math.min(a.x, b.x),
            Math.min(a.y, b.y),
            Math.abs(b.x - a.x),
            Math.abs(b.y - a.y),
          );
          ctx.globalAlpha = 1;
          ctx.strokeRect(
            Math.min(a.x, b.x),
            Math.min(a.y, b.y),
            Math.abs(b.x - a.x),
            Math.abs(b.y - a.y),
          );
        }
        break;
      case "fib":
        if (b) this.drawFib(ctx, d, a, b);
        break;
      case "measure":
        if (b) this.drawMeasure(ctx, d, a, b, pal);
        break;
    }

    if (active && d.type !== "measure") {
      for (const p of pts as XY[]) {
        if (d.type === "hline" || d.type === "vline" || d.type === "alert") continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, HANDLE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = pal.handleFill;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = color;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawFib(ctx: CanvasRenderingContext2D, d: Drawing, a: XY, b: XY) {
    const [p0, p1] = [d.points[0].price, d.points[1].price];
    const x0 = Math.min(a.x, b.x);
    const x1 = Math.max(a.x, b.x);
    const levelColors = [
      "#858D8C",
      "#EF5F67",
      "#E7A36A",
      "#3FCF8E",
      "#6FB6D9",
      "#8FA6F2",
      "#858D8C",
    ];
    let prevY: number | null = null;
    FIB_LEVELS.forEach((lvl, i) => {
      // 0 sits at the second point and 1 at the first, as in TradingView: drawn from a
      // swing low to a swing high, retracements read down from the high.
      const price = p1 + (p0 - p1) * lvl;
      const y = this.priceToY(price);
      if (y === null) return;
      if (prevY !== null) {
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = levelColors[i];
        ctx.fillRect(x0, Math.min(prevY, y), x1 - x0, Math.abs(y - prevY));
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = levelColors[i];
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
      ctx.font = "11px sans-serif";
      ctx.fillStyle = levelColors[i];
      ctx.textBaseline = "bottom";
      ctx.fillText(`${lvl} (${formatPrice(price)})`, x0 + 4, y - 2);
      prevY = y;
    });
  }

  private drawMeasure(
    ctx: CanvasRenderingContext2D,
    d: Drawing,
    a: XY,
    b: XY,
    pal: DrawingPalette,
  ) {
    const [p0, p1] = d.points;
    const up = p1.price >= p0.price;
    const color = up ? pal.up : pal.down;
    const x0 = Math.min(a.x, b.x);
    const y0 = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = color;
    ctx.fillRect(x0, y0, w, h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const sec = this.ctx.seconds();
    const change = p1.price - p0.price;
    const pct = p0.price ? (change / p0.price) * 100 : 0;
    const bars = Math.round((p1.time - p0.time) / sec);
    const lines = [
      `${change >= 0 ? "+" : ""}${formatPrice(change)} (${formatPercent(pct)})`,
      `${bars} bars, ${durationLabel(p1.time - p0.time)}`,
    ];
    ctx.font = "600 11px sans-serif";
    const tw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 16;
    const th = 36;
    const cx = x0 + w / 2 - tw / 2;
    const cy = up ? y0 - th - 6 : y0 + h + 6;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(cx, cy, tw, th, 6);
    ctx.fill();
    ctx.fillStyle = "#0F0F0F";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((l, i) => ctx.fillText(l, cx + tw / 2, cy + 11 + i * 14));
  }

  private priceTag(
    ctx: CanvasRenderingContext2D,
    text: string,
    width: number,
    y: number,
    color: string,
    pal: DrawingPalette,
  ) {
    ctx.font = "600 11px sans-serif";
    const tw = ctx.measureText(text).width + 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(width - tw - 4, y - 9, tw, 18, 4);
    ctx.fill();
    ctx.fillStyle = pal.labelText;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, width - tw / 2 - 4, y);
  }
}
