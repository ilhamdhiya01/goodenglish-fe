import classNames from "classnames";
import React, { forwardRef } from "react";

interface ProgressBarProps {
  pct: number;
  tone?: "green" | "mint";
  className?: string;
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ pct, tone = "green", className }, ref) => (
    <div
      ref={ref}
      className={classNames(
        "h-[3px] overflow-hidden rounded-sm bg-track",
        className,
      )}
    >
      <div
        className={classNames(
          "h-full transition-[width] duration-300",
          tone === "green" ? "bg-green" : "bg-mint",
        )}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  ),
);

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
