import classNames from "classnames";
import React, { forwardRef } from "react";

import { typeDef } from "@/const/vocab-types.constant";

// Word-type badge (Kata dasar / Phrasal verb / ...): one neutral chip for
// every type, named by its label.
interface TypeBadgeProps {
  type: string;
  className?: string;
}

const TypeBadge = forwardRef<HTMLSpanElement, TypeBadgeProps>(
  ({ type, className }, ref) => {
    const t = typeDef(type);
    return (
      <span
        ref={ref}
        className={classNames(
          "rounded-[7px] px-2 py-0.5 text-[11.5px] leading-4 font-extrabold whitespace-nowrap",
          t.chip,
          className,
        )}
      >
        {t.label}
      </span>
    );
  },
);

TypeBadge.displayName = "TypeBadge";

export default TypeBadge;
