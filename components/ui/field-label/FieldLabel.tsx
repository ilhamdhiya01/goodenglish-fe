import classNames from "classnames";
import React, { forwardRef } from "react";

interface FieldLabelProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

const FieldLabel = forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ label, children, className }, ref) => (
    <label
      ref={ref}
      className={classNames(
        "flex flex-col gap-1 text-xs text-muted",
        className,
      )}
    >
      {label}
      {children}
    </label>
  ),
);

FieldLabel.displayName = "FieldLabel";

export default FieldLabel;
