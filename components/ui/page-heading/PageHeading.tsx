import classNames from "classnames";
import React, { forwardRef } from "react";

// Large page title.
const PageHeading = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ children, className, ...rest }, ref) => (
  <h2
    ref={ref}
    className={classNames(
      "m-0 text-[30px] font-bold tracking-[-0.015em]",
      className,
    )}
    {...rest}
  >
    {children}
  </h2>
));

PageHeading.displayName = "PageHeading";

export default PageHeading;
