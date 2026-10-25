import classNames from "classnames";
import React, { forwardRef } from "react";

// Toggle chip (word-type filters, level choice, sub-tabs, ...).
interface PillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  on?: boolean;
  tone?: "ink" | "green";
  size?: "sm" | "md";
  children: React.ReactNode;
}

const Pill = forwardRef<HTMLButtonElement, PillProps>(
  (
    {
      on = false,
      tone = "ink",
      size = "md",
      className,
      type = "button",
      children,
      ...rest
    },
    ref,
  ) => {
    const active =
      tone === "green"
        ? "border-green bg-green text-card"
        : "border-ink bg-ink text-paper";
    const idle =
      tone === "green"
        ? "border-green bg-card text-green"
        : "border-line-2 bg-card text-ink hover:border-ink";
    return (
      <button
        ref={ref}
        type={type}
        className={classNames(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] font-semibold transition-colors",
          size === "sm" ? "px-3 py-1 text-[13px]" : "px-4 py-2 text-sm",
          on ? active : idle,
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Pill.displayName = "Pill";

export default Pill;
