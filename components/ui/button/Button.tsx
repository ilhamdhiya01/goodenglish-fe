import classNames from "classnames";
import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";

const button = tv({
  base: "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] font-semibold transition-colors select-none",
  variants: {
    variant: {
      dark: "border-ink bg-ink text-paper hover:bg-ink-2",
      green: "border-green bg-green text-card hover:bg-green-deep",
      outline: "border-ink bg-transparent text-ink hover:bg-sand",
      accent: "border-green bg-card text-green hover:bg-green-bg",
      danger: "border-red bg-transparent text-red hover:bg-red-bg",
    },
    size: {
      sm: "px-3 py-1.5 text-[13px]",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-[15px]",
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
