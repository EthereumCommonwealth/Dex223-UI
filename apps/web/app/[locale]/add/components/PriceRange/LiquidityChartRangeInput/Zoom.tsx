import { ScaleLinear, select, zoom, ZoomBehavior, ZoomTransform } from "d3";
import { useTranslations } from "next-intl";
import { forwardRef, useEffect, useMemo, useRef } from "react";

import { useZoomStateStore } from "@/app/[locale]/add/stores/useZoomStateStore";

import { ZoomLevels } from "../../../hooks/types";

export const ZoomOverlay = forwardRef(
  ({ height, width, ...props }: { height: number; width: number }, ref: any) => (
    <rect
      ref={ref}
      className="fill-transparent cursor-grab active:cursor-grabbing"
      style={{
        height,
        width,
      }}
      {...props}
    />
  ),
);
ZoomOverlay.displayName = "ZoomOverlay";

export default function Zoom({
  svg,
  xScale,
  setZoom,
  width,
  height,
  resetBrush,
  zoomLevels,
}: {
  svg: SVGElement | null;
  xScale: ScaleLinear<number, number>;
  setZoom: (transform: ZoomTransform) => void;
  width: number;
  height: number;
  resetBrush: () => void;
  zoomLevels: ZoomLevels;
}) {
  const zoomBehavior = useRef<ZoomBehavior<Element, unknown>>();

  const {
    triggerZoomIn,
    triggerZoomOut,
    triggerZoomInitial,
    setZoomIn,
    setZoomOut,
    setZoomInitial,
  } = useZoomStateStore();

  const [zoomIn, zoomOut, zoomInitial] = useMemo(
    () => [
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleBy, 2),
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleBy, 0.5),
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleTo, 0.5),
    ],
    [svg],
  );

  useEffect(() => {
    if (triggerZoomIn) {
      zoomIn();
      setZoomIn(false);
    }
  }, [setZoomIn, triggerZoomIn, zoomIn]);

  useEffect(() => {
    if (triggerZoomOut) {
      zoomOut();
      setZoomOut(false);
    }
  }, [setZoomOut, triggerZoomOut, zoomOut]);

  useEffect(() => {
    if (triggerZoomInitial) {
      resetBrush();
      zoomInitial();
      setZoomInitial(false);
    }
  }, [resetBrush, setZoomInitial, triggerZoomInitial, zoomInitial]);

  useEffect(() => {
    if (!svg) return;

    zoomBehavior.current = zoom()
      .scaleExtent([zoomLevels.min, zoomLevels.max])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", ({ transform }: { transform: ZoomTransform }) => {
        setZoom(transform);
      });

    select(svg as Element).call(zoomBehavior.current);
  }, [
    height,
    width,
    setZoom,
    svg,
    xScale,
    zoomBehavior,
    zoomLevels,
    zoomLevels.max,
    zoomLevels.min,
  ]);

  useEffect(() => {
    // reset zoom to initial on zoomLevel change
    zoomInitial();
  }, [zoomInitial, zoomLevels]);

  return <></>;
}
