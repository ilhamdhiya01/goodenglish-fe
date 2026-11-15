import classNames from "classnames";
import React from "react";

// Small pieces shared by the sidebar, icon rail and bottom nav.

/** "GoodEnglish": "Good" in ink, "English" in the accent. */
export const Wordmark = ({ className }: { className?: string }) => (
  <span
    className={classNames(
      "text-2xl leading-none font-black tracking-[-0.02em] text-ink",
      className,
    )}
  >
    Good<span className="text-accent">English</span>
  </span>
);

/** Square "ge" mark for the narrow icon rail. */
export const LogoMark = () => (
  <span
    aria-label="GoodEnglish"
    role="img"
    className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent text-lg leading-none font-black text-on-accent"
  >
    ge
  </span>
);

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
