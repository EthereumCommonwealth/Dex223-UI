"use client";

import clsx from "clsx";
import { ReactNode } from "react";

import Container from "@/components/atoms/Container";

import { useChartPreferences } from "./store";

/**
 * Trade page layout shared by swap and margin swap.
 *
 * Desktop puts the chart beside the trade form, with recent transactions under the
 * chart; mobile stacks form, chart, then transactions. Each block is rendered once and
 * placed with grid areas, so the chart is never mounted twice (which would open two
 * live connections) and never remounts when the viewport crosses the breakpoint.
 */
export default function TradingLayout({
  form,
  chart,
  recent,
  showChart,
  showRecent,
}: {
  form: ReactNode;
  chart: ReactNode;
  recent: ReactNode;
  showChart: boolean;
  showRecent: boolean;
}) {
  useChartPreferences();

  // Literal class names: Tailwind only generates classes it can find verbatim.
  const grid = showChart
    ? showRecent
      ? "grid-areas-[form,chart,recent] xl:grid-areas-[chart_form,recent_form] xl:grid-cols-[minmax(0,1fr)_600px]"
      : "grid-areas-[form,chart] xl:grid-areas-[chart_form] xl:grid-cols-[minmax(0,1fr)_600px]"
    : showRecent
      ? "grid-areas-[form,recent] xl:grid-areas-[recent_form] xl:grid-cols-[580px_600px] xl:max-w-[1200px]"
      : "grid-areas-[form] xl:grid-cols-[600px] xl:max-w-[600px]";

  return (
    <Container>
      <div
        className={clsx(
          "grid grid-cols-1 items-start gap-4 xl:gap-6 py-4 lg:py-[40px] mx-auto",
          grid,
        )}
      >
        <div className="grid-in-[form] flex justify-center min-w-0 xl:sticky xl:top-6">
          <div className="flex flex-col gap-4 md:gap-6 lg:gap-5 w-full sm:max-w-[600px] xl:max-w-full">
            {form}
          </div>
        </div>
        {showChart && (
          <div className="grid-in-[chart] min-w-0 w-full sm:max-w-[600px] xl:max-w-none mx-auto">
            {chart}
          </div>
        )}
        {showRecent && (
          <div className="grid-in-[recent] min-w-0 flex justify-center">
            <div className={clsx("w-full sm:max-w-[600px]", "xl:max-w-full")}>{recent}</div>
          </div>
        )}
      </div>
    </Container>
  );
}
