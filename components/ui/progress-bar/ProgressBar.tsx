import classNames from "classnames";
import React, { forwardRef } from "react";

interface ProgressBarProps {
  pct: number;
  tone?: "green" | "mint";
  /** The number in words beside the bar ("86 dari 214 hafal"); a bar is
   * never the only way to read progress. */
  label?: React.ReactNode;
  /** Accessible name when `label` isn't plain text. */
  name?: string;
  className?: string;
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ pct, tone = "green", label, name, className }, ref) => {
    const value = Math.max(0, Math.min(100, pct));
    return (
      <div
        ref={ref}
        className={classNames("flex items-center gap-3", className)}
      >
        <div
          role="progressbar"
          aria-valuenow={Math.round(value)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={name ?? (typeof label === "string" ? label : "Progres")}
          className="h-3.5 min-w-0 flex-1 overflow-hidden rounded-full bg-track"
        >
          <div
            className={classNames(
              "h-full rounded-full transition-[width] duration-300",
              tone === "green" ? "bg-accent" : "bg-accent-line",
            )}
            style={{ width: `${value}%` }}
          />
        </div>
        {label != null && (
          <span className="shrink-0 text-[13.5px] font-bold text-ink-2 tabular-nums">
            {label}
          </span>
        )}
      </div>
    );
  },
);

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
