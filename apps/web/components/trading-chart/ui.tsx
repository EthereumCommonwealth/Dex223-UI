"use client";

import clsx from "clsx";

import { ChartType } from "./store";

export function Segmented({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex items-center gap-0.5 p-0.5 rounded-2 bg-secondary-bg shrink-0"
    >
      {children}
    </div>
  );
}

export function SegmentButton({
  active,
  disabled,
  title,
  ariaLabel,
  icon,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  icon?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "h-7 inline-flex items-center justify-center rounded-[6px] text-12 font-medium duration-200 shrink-0",
        icon ? "w-8" : "px-2.5",
        active
          ? "bg-tertiary-bg text-primary-text shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
          : "text-tertiary-text hocus:text-primary-text disabled:opacity-30 disabled:hover:text-tertiary-text",
      )}
    >
      {children}
    </button>
  );
}

export function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-8 h-8 inline-flex items-center justify-center rounded-2 text-tertiary-text hocus:text-primary-text hocus:bg-tertiary-bg duration-200 shrink-0"
    >
      {children}
    </button>
  );
}

export function ChartTypeIcon({ type }: { type: ChartType }) {
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      {type === "candles" && (
        <>
          <path d="M5 2.5v2.5M5 13v2.5M13 4v2M13 12.5V16" {...stroke} />
          <rect x="3" y="5" width="4" height="8" rx="1" {...stroke} />
          <rect x="11" y="6" width="4" height="6.5" rx="1" fill="currentColor" {...stroke} />
        </>
      )}
      {type === "line" && <path d="M2 13.5l4-4.5 3.5 3L16 4.5" {...stroke} />}
      {type === "area" && (
        <>
          <path d="M2 13l4-4.5 3.5 3L16 4v11.5H2V13z" fill="currentColor" opacity="0.3" />
          <path d="M2 13l4-4.5 3.5 3L16 4" {...stroke} />
        </>
      )}
    </svg>
  );
}

export function FullscreenIcon({ exit }: { exit: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      {exit ? (
        <path
          d="M6 1v5H1M10 1v5h5M6 15v-5H1M10 15v-5h5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M1 6V1h5M15 6V1h-5M1 10v5h5M15 10v5h-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function ChartSkeleton() {
  // Faint candles rising and falling, so the loading state already reads as a chart.
  const heights = [38, 52, 44, 61, 57, 70, 63, 49, 58, 72, 66, 80, 74, 69, 83, 77, 88, 81];
  return (
    <div
      className="absolute inset-0 flex items-end gap-[3%] px-6 pb-10 pt-12 overflow-hidden"
      aria-busy
    >
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-1 bg-tertiary-bg animate-pulse"
          style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

export const EMPTY_ICONS: Record<"chart" | "candle" | "pool" | "warning", React.ReactNode> = {
  chart: <path d="M4 17l5-5 4 3 7-8M4 21h16" />,
  candle: (
    <>
      <path d="M8 3v3M8 16v5M16 5v4M16 16v3" />
      <rect x="5.5" y="6" width="5" height="10" rx="1" />
      <rect x="13.5" y="9" width="5" height="7" rx="1" />
    </>
  ),
  pool: (
    <>
      <circle cx="9" cy="12" r="5" />
      <circle cx="15" cy="12" r="5" />
    </>
  ),
  warning: <path d="M12 4l9 16H3l9-16zM12 10v4M12 17.5v.01" />,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: keyof typeof EMPTY_ICONS;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
      <span className="w-12 h-12 rounded-full bg-tertiary-bg flex items-center justify-center text-tertiary-text">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {EMPTY_ICONS[icon]}
        </svg>
      </span>
      <p className="text-16 text-primary-text font-medium">{title}</p>
      {description && <p className="text-14 text-tertiary-text max-w-[380px]">{description}</p>}
      {action}
    </div>
  );
}
