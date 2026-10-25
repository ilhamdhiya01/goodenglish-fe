import classNames from "classnames";
import React, { forwardRef } from "react";

// Intro paragraph under a page title.
const Lead = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ children, className, ...rest }, ref) => (
  <p
    ref={ref}
    className={classNames(
      "m-0 max-w-[760px] text-[15px] leading-[1.55] text-pretty text-ink-3",
      className,
    )}
    {...rest}
  >
    {children}
  </p>
));

Lead.displayName = "Lead";

export default Lead;
