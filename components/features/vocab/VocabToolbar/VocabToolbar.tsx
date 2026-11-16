"use client";

import classNames from "classnames";
import React, { useState } from "react";
import { LuSearch } from "react-icons/lu";

import WordForm from "@/components/features/vocab/WordForm/WordForm";
import Button from "@/components/ui/button";
import Pill from "@/components/ui/pill";
import Sheet from "@/components/ui/sheet";
import { TYPES } from "@/const/vocab-types.constant";
import type { LevelData } from "@/lib/helpers/level-data.helper";
import type { PlanRow } from "@/lib/types/vocab.types";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

interface Props {
  searching: boolean;
  counts: Record<string, number>;
  resultCount: number;
  plan: PlanRow[];
  data: LevelData;
}

// One on/off row in the "Mode" sheet; the box shows ✓ when on.
const ModeRow = ({
  on,
  title,
  hint,
  onClick,
}: {
  on: boolean;
  title: string;
  hint?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    className={classNames(
      "flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-lg border-2 px-3.5 py-2.5 text-left focus-ring",
      on
        ? "border-accent-line bg-accent-tint"
        : "border-line bg-surface hover:bg-sunken",
    )}
  >
    <span
      aria-hidden
      className={classNames(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-black",
        on
          ? "border-accent-edge bg-accent text-on-accent"
          : "border-control bg-surface",
      )}
    >
      {on ? "✓" : ""}
    </span>
    <span className="flex min-w-0 flex-col">
      <span
        className={classNames(
          "text-[15px] font-extrabold",
          on ? "text-accent-edge" : "text-ink",
        )}
      >
        {title}
      </span>
      {hint && (
        <span className="text-[13px] leading-[18px] font-semibold text-ink-2">
          {hint}
        </span>
      )}
    </span>
  </button>
);

// Kosakata controls: search this week, "Mode · N" (test mode, direction,
// typing mode, hide known) and "Jenis" (word-type filter) in sheets, and a
// line naming what is active. Sticks under the top bar while scrolling;
// the Kataku edit form stays outside the sticky part so it never covers the
// screen. New words are added by an admin (Admin › Kosakata), not here.
const VocabToolbar = React.memo(
  ({ searching, counts, resultCount, plan, data }: Props) => {
    const q = useVocabUiStore((s) => s.q);
    const type = useVocabUiStore((s) => s.type);
    const hideKnown = useVocabUiStore((s) => s.hideKnown);
    const quiz = useVocabUiStore((s) => s.quiz);
    const flip = useVocabUiStore((s) => s.flip);
    const recall = useVocabUiStore((s) => s.recall);
    const form = useVocabUiStore((s) => s.form);
    const ui = useVocabUiStore.getState;
    const [sheet, setSheet] = useState<"mode" | "type" | null>(null);

    const quizTitle = flip
      ? "Mode tes · sembunyikan kata Inggris"
      : "Mode tes · sembunyikan arti";
    const modeCount = [quiz, flip, recall, hideKnown].filter(Boolean).length;
    const active = [
      quiz && quizTitle,
      flip && "Indo → Inggris",
      recall && "Mode ketik · recall",
      hideKnown && "Sembunyikan yang hafal",
      type !== "all" && TYPES[type]?.label,
    ].filter(Boolean) as string[];

    return (
      <>
        <div
          data-vocab-toolbar
          className="sticky top-[var(--shell-top,0px)] z-20 -mx-4 flex flex-col gap-2 border-b-2 border-line bg-paper px-4 py-2.5 md:mx-0 md:px-0"
        >
          <div className="flex items-center gap-2">
            <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border-2 border-control bg-sunken px-3 transition-colors focus-within:border-accent focus-within:bg-surface">
              <LuSearch aria-hidden size={18} className="shrink-0 text-ink-2" />
              <input
                value={q}
                onChange={(e) => ui().setQ(e.target.value)}
                aria-label="Cari kata atau arti di minggu ini"
                placeholder="Cari kata atau arti di minggu ini…"
                className="min-w-0 flex-1 border-none bg-transparent text-base font-bold text-ink outline-none"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              aria-haspopup="dialog"
              onClick={() => setSheet("mode")}
              className="min-h-11 shrink-0"
            >
              Mode · {modeCount}
            </Button>
            <Button
              size="sm"
              variant="outline"
              aria-haspopup="dialog"
              onClick={() => setSheet("type")}
              className="min-h-11 shrink-0"
            >
              Jenis
            </Button>
          </div>
          {(active.length > 0 || searching) && (
            <span className="text-[13px] leading-[18px] font-bold text-ink-2">
              {searching && (
                <>
                  {resultCount} hasil untuk &quot;{q}&quot; di minggu ini
                  {active.length > 0 && " · "}
                </>
              )}
              {active.join(" · ")}
            </span>
          )}
        </div>

        {sheet === "mode" && (
          <Sheet label="Mode belajar" onClose={() => setSheet(null)}>
            <div className="flex flex-col gap-2 pb-2">
              <ModeRow
                on={quiz}
                title={quizTitle}
                onClick={() => ui().setQuiz(!quiz)}
              />
              <ModeRow
                on={flip}
                title={flip ? "Indo → Inggris" : "Inggris → Indo"}
                hint="Balik arah: arti Indonesia jadi judul, kata Inggris di bawah. Melatih mengeluarkan kata saat bicara."
                onClick={() => ui().setFlip(!flip)}
              />
              <ModeRow
                on={recall}
                title="Mode ketik · recall"
                hint="Lihat arti Indonesia, ketik kata Inggrisnya. Melatih mengeluarkan kata, bukan hanya mengenali."
                onClick={() => {
                  const on = !recall;
                  ui().setRecall(on);
                  if (on) {
                    if (!flip) ui().setFlip(true);
                    if (!quiz) ui().setQuiz(true);
                  }
                  ui().clearRevealed();
                }}
              />
              <ModeRow
                on={hideKnown}
                title="Sembunyikan yang hafal"
                onClick={() => ui().setHideKnown(!hideKnown)}
              />
            </div>
          </Sheet>
        )}

        {sheet === "type" && (
          <Sheet label="Jenis kata" onClose={() => setSheet(null)}>
            <div className="flex flex-wrap gap-2 pb-2">
              {([["all", "Semua"]] as [string, string][])
                .concat(
                  Object.keys(TYPES).map(
                    (k) => [k, TYPES[k].label] as [string, string],
                  ),
                )
                .map(([k, label]) => (
                  <Pill
                    key={k}
                    on={type === k}
                    onClick={() => {
                      ui().setType(k);
                      setSheet(null);
                    }}
                  >
                    {label}
                    <span className="text-xs font-bold tabular-nums">
                      {counts[k] || 0}
                    </span>
                  </Pill>
                ))}
            </div>
          </Sheet>
        )}

        {form && <WordForm plan={plan} data={data} />}
      </>
    );
  },
);

VocabToolbar.displayName = "VocabToolbar";

export default VocabToolbar;
