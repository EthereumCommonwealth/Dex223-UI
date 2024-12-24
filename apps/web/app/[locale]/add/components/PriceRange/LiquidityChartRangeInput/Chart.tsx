import { max, scaleLinear, ZoomTransform } from "d3";
import { useEffect, useMemo, useRef, useState } from "react";

import { Area } from "./Area";
import { AxisBottom } from "./AxisBottom";
import { Brush } from "./Brush";
import { Line } from "./Line";
import { ChartEntry, LiquidityChartRangeInputProps } from "./types";
import Zoom, { ZoomOverlay } from "./Zoom";

const xAccessor = (d: ChartEntry) => d.price0;
const yAccessor = (d: ChartEntry) => d.activeLiquidity;

export function Chart({
  id = "liquidityChartRangeInput",
  data: { series, current },
  ticksAtLimit,
  styles,
  dimensions: { width, height },
  margins,
  interactive = true,
  brushDomain,
  brushLabels,
  onBrushDomainChange,
  zoomLevels,
}: LiquidityChartRangeInputProps) {
  const zoomRef = useRef<SVGRectElement | null>(null);

  const [zoom, setZoom] = useState<ZoomTransform | null>(null);

  const [innerHeight, innerWidth] = useMemo(
    () => [height - margins.top - margins.bottom, width - margins.left - margins.right],
    [width, height, margins],
  );

  const { xScale, yScale } = useMemo(() => {
    const scales = {
      xScale: scaleLinear()
        .domain([current * zoomLevels.initialMin, current * zoomLevels.initialMax] as number[])
        .range([0, innerWidth]),
      yScale: scaleLinear()
        .domain([0, max(series, yAccessor)] as number[])
        .range([innerHeight, 0]),
    };

    if (zoom) {
      const newXscale = zoom.rescaleX(scales.xScale);
      scales.xScale.domain(newXscale.domain());
    }

    return scales;
  }, [
    current,
    zoomLevels.initialMin,
    zoomLevels.initialMax,
    innerWidth,
    series,
    innerHeight,
    zoom,
  ]);

  useEffect(() => {
    // reset zoom as necessary
    setZoom(null);
  }, [zoomLevels]);

  const { leftChart, rightChart, yMax, leftMax, rightMax } = useMemo(() => {
    const left = series.filter((d) => xAccessor(d) < current);
    const right = series.filter((d) => xAccessor(d) >= current);

    const def = { activeLiquidity: 0, price0: 0 };

    const yMax = series.reduce((prev, current) => {
      return yAccessor(prev) > yAccessor(current) ? prev : current;
    }, def);
    const leftMax = left.reduce((prev = def, current) => {
      return yAccessor(prev) > yAccessor(current) ? prev : current;
    }, def);
    const rightMax = right.reduce((prev = def, current) => {
      return yAccessor(prev) > yAccessor(current) ? prev : current;
    }, def);

    const appendix = {
      activeLiquidity: right[0]?.activeLiquidity || 0,
      price0: current,
    };

    return {
      leftChart: [...left, appendix],
      rightChart: [appendix, ...right],
      yMax: yAccessor(yMax),
      leftMax: yAccessor(leftMax),
      rightMax: yAccessor(rightMax),
    };
  }, [current, series]);

  return (
    <>
      <Zoom
        svg={zoomRef.current}
        xScale={xScale}
        setZoom={setZoom}
        width={innerWidth}
        height={
          // allow zooming inside the x-axis
          height
        }
        resetBrush={() => {
          onBrushDomainChange(
            [current * zoomLevels.initialMin, current * zoomLevels.initialMax] as [number, number],
            "reset",
          );
        }}
        // showResetButton={Boolean(ticksAtLimit[Bound.LOWER] || ticksAtLimit[Bound.UPPER])}
        zoomLevels={zoomLevels}
      />
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
      >
        <defs>
          <clipPath id={`${id}-chart-clip`}>
            <rect x="0" y="0" width={innerWidth} height={height} />
          </clipPath>

          {brushDomain && (
            // mask to highlight selected area
            <mask id={`${id}-chart-area-mask`}>
              <rect
                fill="rgba(125, 164, 145, 0.1)"
                x={xScale(brushDomain[0])}
                y="0"
                width={xScale(brushDomain[1]) - xScale(brushDomain[0])}
                height={innerHeight}
              />
            </mask>
          )}

          <linearGradient
            id={`${id}-gradient-red`}
            x1="0%"
            x2="0%"
            y2="100%"
            y1={`${(leftMax / yMax) * 100 - 100}%`}
          >
            <stop offset="0%" stopColor="rgba(220, 65, 65, 0.7)" />
            <stop offset="100%" stopColor="rgba(220, 65, 65, 0.1)" />
          </linearGradient>

          <linearGradient
            id={`${id}-gradient-green`}
            x1="0%"
            x2="0%"
            y2={`100%`}
            y1={`${(rightMax / yMax) * 100 - 100}%`}
          >
            <stop offset={`0%`} stopColor="rgba(112, 197, 158, 0.7)" />
            <stop offset={`100%`} stopColor="rgba(112, 197, 158, 0.1)" />
          </linearGradient>
        </defs>

        <g transform={`translate(${margins.left},${margins.top})`}>
          <g clipPath={`url(#${id}-chart-clip)`}>
            {/* Left side of the Line (red) */}
            <Area
              series={leftChart}
              xScale={xScale}
              yScale={yScale}
              xValue={xAccessor}
              yValue={yAccessor}
              // color={"stroke-red fill-red opacity-50"}
              fill={`url(#${id}-gradient-red)`}
            />

            {/* Right side of the Line (green) */}
            <Area
              series={rightChart}
              xScale={xScale}
              yScale={yScale}
              xValue={xAccessor}
              yValue={yAccessor}
              fill={`url(#${id}-gradient-green)`}
              // fill="green"
            />

            {brushDomain && (
              // duplicate area chart with mask for selected area
              <g mask={`url(#${id}-chart-area-mask)`}>
                {/* Left side of the Line (red) */}
                <Area
                  series={leftChart}
                  xScale={xScale}
                  yScale={yScale}
                  xValue={xAccessor}
                  yValue={yAccessor}
                  // color={"stroke-red fill-red opacity-50"}
                  // fill={styles.area.selection}
                  fill={`url(#${id}-gradient-red)`}
                />

                {/* Right side of the Line (green) */}
                <Area
                  series={rightChart}
                  xScale={xScale}
                  yScale={yScale}
                  xValue={xAccessor}
                  yValue={yAccessor}
                  // fill={styles.area.selection}
                  fill={`url(#${id}-gradient-green)`}
                />
              </g>
            )}

            <Line value={current} xScale={xScale} innerHeight={innerHeight} />

            <AxisBottom xScale={xScale} innerHeight={innerHeight} />
          </g>

          <ZoomOverlay width={innerWidth} height={height} ref={zoomRef} />

          <Brush
            id={id}
            xScale={xScale}
            interactive={interactive}
            brushLabelValue={brushLabels}
            brushExtent={brushDomain ?? (xScale.domain() as [number, number])}
            innerWidth={innerWidth}
            innerHeight={innerHeight}
            setBrushExtent={onBrushDomainChange}
            westHandleColor={styles.brush.handle.west}
            eastHandleColor={styles.brush.handle.east}
          />
        </g>
      </svg>
    </>
  );
}
