import classNames from "classnames";
import React, { forwardRef } from "react";

import { FIELD_CLASS } from "../input/Input";

const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...rest }, ref) => (
  <select
    ref={ref}
    className={classNames(FIELD_CLASS, "h-[38px]", className)}
    {...rest}
  />
));

Select.displayName = "Select";

export default Select;
