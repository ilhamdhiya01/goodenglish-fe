import classNames from "classnames";
import React, { forwardRef } from "react";

// Toggle chip (word-type filters, level choice, sub-tabs, ...). Active =
// blue tint + blue line; with `check`, an on toggle also shows a ✓ so the
// state never relies on color alone. `tone` is kept for callers but both
// tones look the same in this theme.
interface PillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  on?: boolean;
  tone?: "ink" | "green";
  size?: "sm" | "md";
  /** Prefix ✓ while on (for on/off toggles, not for pick-one lists). */
  check?: boolean;
  children: React.ReactNode;
}

const Pill = forwardRef<HTMLButtonElement, PillProps>(
  (
    {
      on = false,
      // Not a DOM attribute; both tones render the same.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tone,
      size = "md",
      check = false,
      className,
      type = "button",
      children,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={on}
      className={classNames(
        "hit-44 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 font-extrabold focus-ring transition-colors disabled:cursor-not-allowed disabled:border-line disabled:bg-sunken disabled:text-ink-3",
        size === "sm"
          ? "min-h-[34px] px-3 text-[13px]"
          : "min-h-[38px] px-4 text-sm",
        on
          ? "border-accent-line bg-accent-tint text-accent-edge"
          : "border-control bg-surface text-ink hover:bg-sunken",
        className,
      )}
      {...rest}
    >
      {on && check && <span aria-hidden>✓</span>}
      {children}
    </button>
  ),
);

Pill.displayName = "Pill";

export default Pill;
