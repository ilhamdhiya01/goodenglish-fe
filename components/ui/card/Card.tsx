import classNames from "classnames";
import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

const card = tv({
  base: "flex flex-col gap-3 rounded-[10px] border-[1.5px]",
  variants: {
    tone: {
      ink: "border-ink bg-card",
      line: "border-line bg-card",
      green: "border-green bg-green-bg",
      greenBg: "border-green-line bg-green-bg",
      redBg: "border-red-line bg-red-bg",
      dashed: "border-dashed border-line-2 bg-transparent",
    },
    pad: {
      sm: "p-3",
      md: "px-5 py-4",
      lg: "px-6 py-5",
    },
  },
  defaultVariants: { tone: "line", pad: "md" },
});

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "ink" | "line" | "green" | "greenBg" | "redBg" | "dashed";
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
