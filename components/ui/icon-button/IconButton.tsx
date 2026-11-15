import classNames from "classnames";
import React, { forwardRef } from "react";

// 38px square icon button with the chunky bottom edge; touch area 44px.
// Always give it an aria-label (or a title) — the icon alone has no name.
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
        "hit-44 inline-flex h-[38px] w-[38px] shrink-0 press cursor-pointer items-center justify-center rounded-md border-2 edge focus-ring disabled:cursor-not-allowed disabled:border-line disabled:bg-sunken disabled:text-ink-3 disabled:shadow-none",
        active
          ? "border-accent-line bg-accent-tint text-accent-edge [--edge:var(--color-accent-line)]"
          : "border-control bg-surface text-ink-2 [--edge:var(--color-control)] hover:bg-sunken",
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
