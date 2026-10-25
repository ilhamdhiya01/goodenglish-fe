import classNames from "classnames";
import React, { forwardRef } from "react";

import { typeDef } from "@/const/vocab-types.constant";

// Word-type badge (Kata dasar / Phrasal verb / ...) colored per type.
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
          "rounded px-2 py-0.5 font-mono text-[11px]",
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
