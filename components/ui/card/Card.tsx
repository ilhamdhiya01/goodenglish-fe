import classNames from "classnames";
import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

// 2px line with a thicker bottom edge. ink = the card whose turn it is
// (blue wash), done = finished / known, greenBg / redBg = right / wrong.
const card = tv({
  base: "flex flex-col gap-3 rounded-xl border-2 edge-card",
  variants: {
    tone: {
      ink: "border-accent-line bg-accent-wash [--edge:var(--color-accent-line)]",
      line: "border-line bg-surface",
      green: "border-ok-line bg-ok-bg [--edge:var(--color-ok-line)]",
      greenBg: "border-ok-line bg-ok-bg [--edge:var(--color-ok-line)]",
      redBg: "border-bad-line bg-bad-bg [--edge:var(--color-bad-line)]",
      dashed: "border-dashed border-control bg-transparent shadow-none",
      done: "border-line bg-sunken",
    },
    pad: {
      sm: "p-3",
      md: "px-[18px] py-4",
      lg: "px-6 py-5 max-md:px-[18px] max-md:py-4",
    },
  },
  defaultVariants: { tone: "line", pad: "md" },
});

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "ink" | "line" | "green" | "greenBg" | "redBg" | "dashed" | "done";
  pad?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ tone, pad, className, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={classNames(card({ tone, pad }), className)}
      {...rest}
    >
      {children}
    </div>
  ),
);

Card.displayName = "Card";

export default Card;
