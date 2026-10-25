import classNames from "classnames";
import React, { forwardRef } from "react";

export const FIELD_CLASS =
  "w-full min-w-0 rounded-md border-[1.5px] border-line-2 bg-card px-2.5 py-2 text-sm text-ink outline-none transition-colors focus:border-green";

const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...rest }, ref) => (
  <input ref={ref} className={classNames(FIELD_CLASS, className)} {...rest} />
));

Input.displayName = "Input";

export default Input;
