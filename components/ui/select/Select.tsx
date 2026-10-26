import classNames from "classnames";
import React, { forwardRef } from "react";

import { FIELD_CLASS } from "../input/Input";

// The native arrow ignores padding and hugs the right edge differently per
// browser, so it is hidden (appearance-none) and drawn here at a fixed inset.
export const SelectChevron = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...rest }, ref) => (
  <div className="relative w-full min-w-0">
    <select
      ref={ref}
      className={classNames(
        FIELD_CLASS,
        "h-[38px] cursor-pointer appearance-none pr-8",
        className,
      )}
      {...rest}
    />
    <SelectChevron />
  </div>
));

Select.displayName = "Select";

export default Select;
