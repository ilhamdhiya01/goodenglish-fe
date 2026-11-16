import classNames from "classnames";
import React, { forwardRef, useId } from "react";

// 44px field, 16px text (iOS doesn't zoom in on focus). Sunken until focused.
export const FIELD_CLASS =
  "focus-ring min-h-11 w-full min-w-0 rounded-lg border-2 border-control bg-sunken px-3 py-2 text-base font-bold text-ink outline-none transition-colors focus:border-accent focus:bg-surface disabled:cursor-not-allowed disabled:border-line disabled:text-ink-3 aria-invalid:border-bad";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Shown under the field with a ✕; also marks the field invalid. */
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...rest }, ref) => {
    const errorId = useId();
    const input = (
      <input
        ref={ref}
        {...rest}
        aria-invalid={error ? true : rest["aria-invalid"]}
        aria-describedby={error ? errorId : rest["aria-describedby"]}
        className={classNames(FIELD_CLASS, className)}
      />
    );
    if (!error) return input;
    return (
      <span className="flex w-full min-w-0 flex-col gap-1.5">
        {input}
        <span id={errorId} className="text-[13px] font-bold text-bad">
          ✕ {error}
        </span>
      </span>
    );
  },
);

Input.displayName = "Input";

export default Input;
