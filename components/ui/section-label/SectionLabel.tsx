import classNames from "classnames";
import React, { forwardRef } from "react";

// Small uppercase mono label ("RENCANA BELAJAR · PRE", ...).
interface SectionLabelProps {
  children: React.ReactNode;
  tone?: "muted" | "green" | "red" | "faint";
  className?: string;
}

const SectionLabel = forwardRef<HTMLSpanElement, SectionLabelProps>(
  ({ children, tone = "muted", className }, ref) => {
    const c =
      tone === "green"
        ? "text-green"
        : tone === "red"
          ? "text-red"
          : tone === "faint"
            ? "text-faint"
            : "text-muted";
    return (
      <span
        ref={ref}
        className={classNames(
          "font-mono text-xs tracking-[0.06em]",
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
