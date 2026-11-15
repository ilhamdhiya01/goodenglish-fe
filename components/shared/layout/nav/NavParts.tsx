import classNames from "classnames";
import React from "react";

// Small pieces shared by the sidebar, icon rail and bottom nav (the logo is
// components/brand/Logo).

/** Count of words due ("Ulang"); the visible number has a spoken label. */
export const NavBadge = ({
  n,
  className,
}: {
  n: number;
  className?: string;
}) => (
  <span
    className={classNames(
      "inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-ink px-1.5 text-xs leading-none font-extrabold text-on-accent tabular-nums",
      className,
    )}
  >
    {n}
    <span className="sr-only"> kata jatuh tempo</span>
  </span>
);
