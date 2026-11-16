import classNames from "classnames";
import React from "react";

interface TargetMarkProps {
  children: React.ReactNode;
  /** Sweep the underline in from the left (marking known, a right answer). */
  sweep?: boolean;
  className?: string;
}

// The target word inside an example: bold with a thick blue underline band.
// Drawn as a background band (not a box-shadow) so it can sweep in and wraps
// cleanly across lines.
const TargetMark = ({
  children,
  sweep = false,
  className,
}: TargetMarkProps) => (
  <span
    className={classNames(
      "bg-[linear-gradient(var(--color-accent-mark),var(--color-accent-mark))] [box-decoration-break:clone] bg-[length:100%_8px] bg-bottom-left bg-no-repeat font-extrabold",
      sweep && "animate-[mark-sweep_220ms_var(--ease-lompat)]",
      className,
    )}
  >
    {children}
  </span>
);

export default TargetMark;
