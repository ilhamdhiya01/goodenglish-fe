import classNames from "classnames";
import React, { forwardRef } from "react";

// Round 36px icon button (export / import / voice picker in the header).
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ active = false, className, type = "button", children, ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={classNames(
        "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] bg-card transition-colors",
        active
          ? "border-green text-green"
          : "border-line-2 text-ink hover:border-green",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  ),
);

IconButton.displayName = "IconButton";

export default IconButton;
