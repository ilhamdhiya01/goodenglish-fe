import classNames from "classnames";
import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

// Chunky button: 2px line with a thicker bottom edge that flattens when
// pressed. dark / green / accent are all the primary (blue) button — use at
// most one per screen.
const PRIMARY =
  "border-accent-edge bg-accent text-on-accent [--edge:var(--color-accent-edge)] hover:bg-accent-edge";

const button = tv({
  base: "inline-flex press cursor-pointer items-center justify-center gap-2 rounded-lg border-2 text-center font-extrabold tracking-[0.06em] uppercase edge focus-ring select-none disabled:cursor-not-allowed disabled:border-line disabled:bg-sunken disabled:text-ink-3 disabled:shadow-none",
  variants: {
    variant: {
      dark: PRIMARY,
      green: PRIMARY,
      accent: PRIMARY,
      outline:
        "border-control bg-surface text-ink-2 [--edge:var(--color-control)] hover:bg-sunken",
      danger:
        "border-bad-edge bg-bad text-on-accent [--edge:var(--color-bad-edge)] hover:bg-bad-edge",
    },
    size: {
      sm: "min-h-9 rounded-md px-3 py-1.5 text-xs leading-4",
      md: "min-h-11 px-4 py-2.5 text-[13.5px] leading-5",
      lg: "min-h-[52px] px-5 py-3 text-[13.5px] leading-5 max-md:w-full",
    },
  },
  defaultVariants: { variant: "outline", size: "md" },
});

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "dark" | "green" | "outline" | "accent" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, type = "button", ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={classNames(button({ variant, size }), className)}
      {...rest}
    />
  ),
);

Button.displayName = "Button";

export default Button;
