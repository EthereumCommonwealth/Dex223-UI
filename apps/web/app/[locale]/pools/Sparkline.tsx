import { useId } from "react";

const WIDTH = 120;
const HEIGHT = 24;
const PAD = 2;

export default function Sparkline({ values, label }: { values: number[]; label: string }) {
  const gradientId = useId();

  if (values.length < 2) {
    return <span className="text-tertiary-text">{"–"}</span>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const step = (WIDTH - PAD * 2) / (values.length - 1);
  // A flat week draws a flat line through the middle instead of hugging an edge.
  const y = (v: number) =>
    range === 0 ? HEIGHT / 2 : PAD + (HEIGHT - PAD * 2) * (1 - (v - min) / range);
  const points = values.map((v, i) => `${(PAD + i * step).toFixed(1)},${y(v).toFixed(1)}`);
  const area = `M${points[0]} L${points.join(" L")} L${WIDTH - PAD},${HEIGHT} L${PAD},${HEIGHT} Z`;

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={label}
      className="text-green overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
