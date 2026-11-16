import classNames from "classnames";
import React, { forwardRef } from "react";

export type AnswerState = "idle" | "correct" | "wrong" | "dimmed";

interface AnswerOptionProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  /** A, B, C, D. */
  letter: string;
  /** idle before answering; afterwards correct (the right one), wrong (the
   * learner's wrong pick) or dimmed (the rest). */
  state?: AnswerState;
  children: React.ReactNode;
  /** Shown under the option once answered (why it's right / wrong). */
  note?: React.ReactNode;
}

const TONE: Record<AnswerState, string> = {
  idle: "border-control bg-surface text-ink [--edge:var(--color-control)] hover:bg-sunken",
  correct: "border-ok-line bg-ok-bg text-ink [--edge:var(--color-ok-line)]",
  wrong:
    "border-bad-line bg-bad-bg text-ink [--edge:var(--color-bad-line)] animate-[nudge_240ms_ease-in-out]",
  // Faded by color, not opacity, so the text still passes contrast.
  dimmed: "border-line bg-surface text-ink-3 [--edge:var(--color-line)]",
};

// One answer of a multiple-choice question. After answering, the result is
// spelled out ("✓ Benar" / "✕ Pilihanmu"), never shown by color alone.
const AnswerOption = forwardRef<HTMLButtonElement, AnswerOptionProps>(
  (
    {
      letter,
      state = "idle",
      note,
      children,
      className,
      type = "button",
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={classNames(
        "flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border-2 px-3.5 py-3 text-left text-[15px] leading-[22px] font-bold edge focus-ring transition-colors disabled:cursor-default",
        state === "idle" && "press",
        TONE[state],
        className,
      )}
      {...rest}
    >
      <span className="flex w-full items-center gap-3">
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 border-line bg-surface text-xs font-black text-ink-2"
        >
          {letter}
        </span>
        <span className="min-w-0 flex-1">{children}</span>
        {state === "correct" && (
          <span className="shrink-0 text-[13px] font-extrabold text-ok">
            ✓ Benar
          </span>
        )}
        {state === "wrong" && (
          <span className="shrink-0 text-[13px] font-extrabold text-bad">
            ✕ Pilihanmu
          </span>
        )}
      </span>
      {note != null && state !== "idle" && (
        <span className="pl-10 text-[13px] leading-[19px] font-semibold text-ink-2">
          {note}
        </span>
      )}
    </button>
  ),
);

AnswerOption.displayName = "AnswerOption";

export default AnswerOption;
