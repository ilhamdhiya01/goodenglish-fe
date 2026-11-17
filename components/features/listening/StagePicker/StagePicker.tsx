import classNames from "classnames";
import React from "react";
import { LuLock } from "react-icons/lu";

export interface StageInfo {
  n: number;
  label: string;
  desc: string;
}

interface StagePickerProps {
  stages: StageInfo[];
  /** Highest open stage. */
  unlocked: number;
  current: number;
  onPick: (n: number) => void;
  disabled?: boolean;
}

// Stage choice: open stages are buttons, locked ones say what opens them.
const StagePicker = ({
  stages,
  unlocked,
  current,
  onPick,
  disabled,
}: StagePickerProps) => (
  <div
    role="radiogroup"
    aria-label="Tahap"
    className="grid gap-2 md:grid-cols-3"
  >
    {stages.map((s) => {
      const locked = s.n > unlocked;
      const on = s.n === current;
      return (
        <button
          key={s.n}
          type="button"
          role="radio"
          aria-checked={on}
          aria-disabled={locked || disabled || undefined}
          onClick={() => !locked && !disabled && onPick(s.n)}
          className={classNames(
            "flex min-h-11 flex-col items-start gap-0.5 rounded-xl border-2 px-3.5 py-2.5 text-left focus-ring",
            locked
              ? "cursor-not-allowed border-dashed border-control bg-transparent text-ink-3"
              : on
                ? "cursor-pointer border-accent-line bg-accent-tint text-accent-edge"
                : "cursor-pointer border-line bg-surface text-ink hover:bg-sunken",
          )}
        >
          <span className="flex items-center gap-1.5 text-[13.5px] font-black">
            {locked && <LuLock aria-hidden size={13} />}
            Tahap {s.n} · {s.label}
          </span>
          <span className="text-[12.5px] leading-[17px] font-semibold text-ink-2">
            {locked
              ? "Terbuka setelah akurasi ≥ 80% di tahap sebelumnya."
              : s.desc}
          </span>
        </button>
      );
    })}
  </div>
);

export default StagePicker;
