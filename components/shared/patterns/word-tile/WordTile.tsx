import classNames from "classnames";
import React, { forwardRef } from "react";

interface WordTileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Already placed in the answer (sentence builder): dashed, no fill. */
  used?: boolean;
  /** A contrast / wrong sound (pronunciation): dashed with a ✕ in front. */
  cross?: boolean;
  /** Picked for swapping. */
  selected?: boolean;
  children: React.ReactNode;
}

// Chunky word tile: sentence-builder cards, key phrases, conjunctions,
// pronunciation targets. Usually speaks or places the word on click.
const WordTile = forwardRef<HTMLButtonElement, WordTileProps>(
  (
    {
      used = false,
      cross = false,
      selected = false,
      className,
      type = "button",
      children,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={classNames(
        "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border-2 px-3.5 py-2 text-[15px] leading-5 font-extrabold focus-ring transition-colors",
        selected
          ? "border-accent bg-accent-tint text-accent-edge edge [--edge:var(--color-accent)]"
          : used || cross
            ? "border-dashed border-control bg-transparent text-ink-2 hover:bg-sunken"
            : "press border-control bg-surface text-ink edge [--edge:var(--color-control)] hover:bg-sunken",
        className,
      )}
      {...rest}
    >
      {cross && (
        <span aria-hidden className="font-black text-bad">
          ✕
        </span>
      )}
      {children}
    </button>
  ),
);

WordTile.displayName = "WordTile";

export default WordTile;
