import clsx from "clsx";
import { BrushBehavior, brushX, D3BrushEvent, ScaleLinear, select } from "d3";
import throttle from "lodash.throttle";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { usePrevious } from "./hooks";
import { brushHandleAccentPath, brushHandlePath, OffScreenHandle } from "./svg";

const Handle = ({ color, ...props }: { color: string; d: string }) => (
  <path
    className="cursor-ew-resize pointer-events-none stroke-[3px]"
    style={{
      stroke: color,
      fill: color,
    }}
    {...props}
  />
);

const HandleAccent = (props: { d: string }) => (
  <path
    className="cursor-ew-resize pointer-events-none stroke-[1.5px] opacity-60"
    style={{
      stroke: "white",
    }}
    {...props}
  />
);

const LabelGroup = ({
  children,
  transform,
  visible,
  ...props
}: {
  children: any;
  transform: string;
  visible: boolean;
}) => (
  <g
    className={clsx("transition-opacity", visible ? "opacity-100" : "opacity-0")}
    transform={transform}
    {...props}
  >
    {children}
  </g>
);

const TooltipBackground = (props: any) => <rect className="fill-[#FFFFFF12]" {...props} />;

const Tooltip = ({ children, ...props }: any) => (
  <text
    className="text-[13px] fill-[#FFFFFF]"
    style={{
      textAnchor: "middle",
    }}
    {...props}
  >
    {children}
  </text>
);

// flips the handles draggers when close to the container edges
const FLIP_HANDLE_THRESHOLD_PX = 20;

// margin to prevent tick snapping from putting the brush off screen
const BRUSH_EXTENT_MARGIN_PX = 2;

/**
 * Returns true if every element in `a` maps to the
 * same pixel coordinate as elements in `b`
 */
const compare = (
  a: [number, number],
  b: [number, number],
  xScale: ScaleLinear<number, number>,
): boolean => {
  // normalize pixels to 1 decimals
  const aNorm = a.map((x) => xScale(x).toFixed(1));
  const bNorm = b.map((x) => xScale(x).toFixed(1));
  return aNorm.every((v, i) => v === bNorm[i]);
};

export const Brush = ({
  id,
  xScale,
  interactive,
  brushLabelValue,
  brushExtent,
  setBrushExtent,
  innerWidth,
  innerHeight,
  westHandleColor,
  eastHandleColor,
}: {
  id: string;
  xScale: ScaleLinear<number, number>;
  interactive: boolean;
  brushLabelValue: (d: "w" | "e", x: number) => string;
  brushExtent: [number, number];
  setBrushExtent: (extent: [number, number], mode: string | undefined) => void;
  innerWidth: number;
  innerHeight: number;
  westHandleColor: string;
  eastHandleColor: string;
}) => {
  const brushRef = useRef<SVGGElement | null>(null);
  const brushBehavior = useRef<BrushBehavior<SVGGElement> | null>(null);

  // only used to drag the handles on brush for performance
  const [localBrushExtent, setLocalBrushExtent] = useState<[number, number] | null>(brushExtent);
  const [showLabels, setShowLabels] = useState(false);
  const [hovering, setHovering] = useState(false);

  const previousBrushExtent = usePrevious(brushExtent);

  const beforebrushstarted = useCallback((event: D3BrushEvent<unknown>) => {
    // do nothing
  }, []);

  const brushed = useCallback(
    (event: D3BrushEvent<unknown>) => {
      const { type, selection, mode } = event;

      if (!selection) {
        setLocalBrushExtent(null);
        return;
      }

      const scaled = (selection as [number, number]).map(xScale.invert) as [number, number];

      // avoid infinite render loop by checking for change
      if (type === "end" && !compare(brushExtent, scaled, xScale)) {
        setBrushExtent(scaled, mode);
      }

      setLocalBrushExtent(scaled);
    },
    [xScale, brushExtent, setBrushExtent],
  );

  // keep local and external brush extent in sync
  // i.e. snap to ticks on bruhs end
  useEffect(() => {
    setLocalBrushExtent(brushExtent);
  }, [brushExtent]);

  // initialize the brush
  useEffect(() => {
    if (!brushRef.current) return;

    brushBehavior.current = brushX<SVGGElement>()
      .extent([
        [Math.max(0 + BRUSH_EXTENT_MARGIN_PX, xScale(0)), 0],
        [innerWidth - BRUSH_EXTENT_MARGIN_PX, innerHeight],
      ])
      .handleSize(30)
      .filter(() => interactive)
      .on("brush", throttle(brushed, 16))
      .on("end", brushed);

    brushBehavior.current(select(brushRef.current));

    if (previousBrushExtent && compare(brushExtent, previousBrushExtent, xScale)) {
      select(brushRef.current)
        .transition()
        .call(brushBehavior.current.move as any, brushExtent.map(xScale));
    }

    // brush linear gradient
    select(brushRef.current)
      .selectAll(".selection")
      .attr("stroke", "none")
      .attr("fill-opacity", "0.1")
      .attr("fill", `url(#${id}-gradient-selection)`);

    // NOTE: not the best, but it works without errors - to prevent resetting interval (selection)
    select(".overlay").datum({ type: "none" }).on("mousedown touchstart", beforebrushstarted);
  }, [
    beforebrushstarted,
    brushExtent,
    brushed,
    id,
    innerHeight,
    innerWidth,
    interactive,
    previousBrushExtent,
    xScale,
  ]);

  // respond to xScale changes only
  useEffect(() => {
    if (!brushRef.current || !brushBehavior.current) return;

    brushBehavior.current.move(select(brushRef.current) as any, brushExtent.map(xScale) as any);
  }, [brushExtent, xScale]);

  // show labels when local brush changes
  useEffect(() => {
    setShowLabels(true);
    const timeout = setTimeout(() => setShowLabels(false), 1500);
    return () => clearTimeout(timeout);
  }, [localBrushExtent]);

  // variables to help render the SVGs
  const flipWestHandle = localBrushExtent && xScale(localBrushExtent[0]) > FLIP_HANDLE_THRESHOLD_PX;
  const flipEastHandle =
    localBrushExtent && xScale(localBrushExtent[1]) > innerWidth - FLIP_HANDLE_THRESHOLD_PX;

  const showWestArrow =
    localBrushExtent && (xScale(localBrushExtent[0]) < 0 || xScale(localBrushExtent[1]) < 0);
  const showEastArrow =
    localBrushExtent &&
    (xScale(localBrushExtent[0]) > innerWidth || xScale(localBrushExtent[1]) > innerWidth);

  const westHandleInView =
    localBrushExtent &&
    xScale(localBrushExtent[0]) >= 0 &&
    xScale(localBrushExtent[0]) <= innerWidth;
  const eastHandleInView =
    localBrushExtent &&
    xScale(localBrushExtent[1]) >= 0 &&
    xScale(localBrushExtent[1]) <= innerWidth;

  return useMemo(
    () => (
      <>
        <defs>
          <linearGradient id={`${id}-gradient-selection`} x1="0%" y1="100%" x2="100%" y2="100%">
            <stop stopColor="rgba(125, 164, 145, 1)" /> {/* Light green with some transparency */}
            <stop stopColor="rgba(125, 164, 145, 1)" offset="1" />{" "}
            {/* Darker green with some transparency */}
          </linearGradient>
          {/*<stop stopColor={westHandleColor} />*/}
          {/*<stop stopColor={eastHandleColor} offset="1" />*/}
          {/*</linearGradient>*/}

          {/* clips at exactly the svg area */}
          <clipPath id={`${id}-brush-clip`}>
            <rect x="0" y="0" width={innerWidth} height={innerHeight} />
          </clipPath>
        </defs>

        {/* will host the d3 brush */}
        <g
          ref={brushRef}
          clipPath={`url(#${id}-brush-clip)`}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        />

        {/* custom brush handles */}
        {localBrushExtent && (
          <>
            {/* west handle */}
            {westHandleInView ? (
              <g
                transform={`translate(${Math.max(0, xScale(localBrushExtent[0]))}, 0), scale(${
                  flipWestHandle ? "-1" : "1"
                }, 1)`}
              >
                <g>
                  <Handle color={westHandleColor} d={brushHandlePath(innerHeight)} />
                  <HandleAccent d={brushHandleAccentPath()} />
                </g>

                <LabelGroup
                  transform={`translate(50,0), scale(${flipWestHandle ? "1" : "-1"}, 1)`}
                  visible={showLabels || hovering}
                >
                  <TooltipBackground y="0" x="-30" height="30" width="60" rx="8" />
                  <Tooltip transform="scale(-1, 1)" y="15" dominantBaseline="middle">
                    {brushLabelValue("w", localBrushExtent[0])}
                  </Tooltip>
                </LabelGroup>
              </g>
            ) : null}

            {/* east handle */}
            {eastHandleInView ? (
              <g
                transform={`translate(${xScale(localBrushExtent[1])}, 0), scale(${flipEastHandle ? "-1" : "1"}, 1)`}
              >
                <g>
                  <Handle color={eastHandleColor} d={brushHandlePath(innerHeight)} />
                  <HandleAccent d={brushHandleAccentPath()} />
                </g>

                <LabelGroup
                  transform={`translate(50,0), scale(${flipEastHandle ? "-1" : "1"}, 1)`}
                  visible={showLabels || hovering}
                >
                  <TooltipBackground y="0" x="-30" height="30" width="60" rx="8" />
                  <Tooltip y="15" dominantBaseline="middle">
                    {brushLabelValue("e", localBrushExtent[1])}
                  </Tooltip>
                </LabelGroup>
              </g>
            ) : null}

            {showWestArrow && <OffScreenHandle color={westHandleColor} />}

            {showEastArrow && (
              <g transform={`translate(${innerWidth}, 0) scale(-1, 1)`}>
                <OffScreenHandle color={eastHandleColor} />
              </g>
            )}
          </>
        )}
      </>
    ),
    [
      brushLabelValue,
      eastHandleColor,
      eastHandleInView,
      flipEastHandle,
      flipWestHandle,
      hovering,
      id,
      innerHeight,
      innerWidth,
      localBrushExtent,
      showEastArrow,
      showLabels,
      showWestArrow,
      westHandleColor,
      westHandleInView,
      xScale,
    ],
  );
};
