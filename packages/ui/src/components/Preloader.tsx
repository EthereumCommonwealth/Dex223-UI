import { useMemo } from "react";
import clsx from "clsx";

interface Props {
  size?: number;
  type?: "circular" | "linear" | "awaiting";
  color?: "green" | "black";
  smallDots?: boolean;
  className?: string;
}

export default function Preloader({
  size = 24,
  type = "circular",
  color = "green",
  smallDots = false,
  className,
}: Props) {
  const internalSize = useMemo(() => {
    return size / Math.sqrt(2);
  }, [size]);

  switch (type) {
    case "circular":
      return (
        <div
          style={{ width: size, height: size }}
          className={clsx("ui-flex ui-items-center ui-justify-center ui-relative", className)}
        >
          <div
            style={{ borderWidth: size > 50 ? 4 : 2 }}
            className={clsx(
              "ui-rounded-full ui-border-4 ui-border-transparent ui-top-0 ui-left-0 ui-w-full ui-h-full ui-bg-transparent ui-animate-spin",
              color === "green" && "ui-border-t-green ui-border-l-green ui-border-r-green",
              color === "black" &&
                "ui-border-t-secondary-bg ui-border-l-secondary-bg ui-border-r-secondary-bg",
            )}
          />
        </div>
      );
    case "linear":
      return (
        <div className={clsx("ui-flex ui-items-center ui-gap-[5px]", className)} style={{ height: size }}>
          <span
            className={clsx(
              "ui-block ui-rounded-full ui-animate-flicker1 ui-bg-green",
              smallDots ? "ui-w-[6px] ui-h-[6px]" : "ui-w-2 ui-h-2 ",
            )}
          />
          <span
            className={clsx(
              "ui-block ui-rounded-full ui-animate-flicker2 ui-bg-green",
              smallDots ? "ui-w-[6px] ui-h-[6px]" : "ui-w-2 ui-h-2 ",
            )}
          />
          <span
            className={clsx(
              "ui-block ui-rounded-full ui-animate-flicker3 ui-bg-green",
              smallDots ? "ui-w-[6px] ui-h-[6px]" : "ui-w-2 ui-h-2 ",
            )}
          />
        </div>
      );
    case "awaiting":
      return (
        <div className={clsx("ui-flex ui-items-center ui-justify-center", className)} style={{ width: size, height: size }}>
          <div
            style={{ width: internalSize, height: internalSize }}
            className={`ui-rotate-45 ui-relative`}
          >
            {[0, 1, 2, 3, 4].map((v) => {
              return (
                <div
                  key={v}
                  className="ui-absolute ui-animate-orbit ui-w-full ui-h-full"
                  style={{ animationDelay: `${v * 100}ms`, opacity: 1 - 0.2 * (v + 1), zIndex: v }}
                >
                  <div
                    style={{
                      width: internalSize / 5,
                      height: internalSize / 5,
                      boxShadow: `0px 0px ${internalSize / 2.5}px 2px #3ae374`,
                    }}
                    className="ui-absolute ui-top-0 ui-left-0 ui-shadow-orbit ui-w-[10px] ui-h-[10px] ui-bg-green ui-rounded-full"
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
  }
}

export function CircularProgress({ size = 24, className }: Props) {
  return (
    <div
      className={clsx("MuiCircularProgressIndeterminate", className)}
      role="progressbar"
      style={{
        width: size,
        height: size,
      }}
    >
      <svg viewBox="22 22 44 44">
        <circle
          className="MuiCircularProgressCircleIndeterminate stroke-green"
          cx="44"
          cy="44"
          r="20.2"
          fill="none"
          strokeWidth="3.6"
        />
      </svg>
    </div>
  );
}
