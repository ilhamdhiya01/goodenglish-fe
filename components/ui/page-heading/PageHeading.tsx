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
      "m-0 text-2xl leading-[30px] font-black tracking-[-0.02em] text-ink md:text-[30px] md:leading-9",
      className,
    )}
    {...rest}
  >
    {children}
  </h2>
));

PageHeading.displayName = "PageHeading";

export default PageHeading;
