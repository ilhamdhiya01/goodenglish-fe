import classNames from "classnames";
import React, { forwardRef } from "react";

// Small uppercase section label ("RENCANA BELAJAR · PRE", ...).
interface SectionLabelProps {
  children: React.ReactNode;
  tone?: "muted" | "green" | "red" | "faint";
  className?: string;
}

const SectionLabel = forwardRef<HTMLSpanElement, SectionLabelProps>(
  ({ children, tone = "muted", className }, ref) => {
    const c =
      tone === "green"
        ? "text-accent-edge"
        : tone === "red"
          ? "text-bad"
          : "text-ink-3";
    return (
      <span
        ref={ref}
        className={classNames(
          "text-[12.5px] leading-[18px] font-extrabold tracking-[0.07em] uppercase",
          c,
          className,
        )}
      >
        {children}
      </span>
    );
  },
);

SectionLabel.displayName = "SectionLabel";

export default SectionLabel;
