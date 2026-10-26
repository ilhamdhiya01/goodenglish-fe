"use client";

import classNames from "classnames";
import React from "react";

import WordForm from "@/components/features/vocab/WordForm/WordForm";
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

// Baris kontrol Kosakata: cari, mode tes, arah kartu, mode ketik, sembunyikan hafal,
// lalu filter jenis kata. Menempel di atas saat scroll (semua ukuran layar;
// di layar kecil tombol & filter jadi satu baris yang bisa digeser supaya tidak memakan layar);
// form ubah Kataku sengaja di luar bagian yang menempel supaya tidak menutupi layar.
// Kata baru ditambah admin lewat dashboard (Admin › Kosakata), bukan di sini.
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

    const toggleBtn = (on: boolean) =>
      classNames(
        "inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg border-[1.5px] px-3.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
        on
          ? "border-ink bg-ink text-paper"
          : "border-ink bg-card text-ink hover:bg-sand",
      );

    return (
      <>
        <div
          data-vocab-toolbar
          className="sticky top-0 z-20 flex flex-col gap-2.5 border-b border-line bg-paper py-2.5 md:gap-3"
        >
          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-2.5">
            <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border-[1.5px] border-ink bg-card px-3 md:flex-[1_1_240px]">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6b665c"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                value={q}
                onChange={(e) => ui().setQ(e.target.value)}
                placeholder="Cari kata atau arti di minggu ini…"
                className="min-w-0 flex-1 border-none bg-transparent font-sans text-sm text-ink outline-none"
              />
            </div>
            {/* Layar kecil: tombol jadi satu baris yang bisa digeser; desktop: ikut membungkus seperti biasa. */}
            <div className="no-scrollbar flex gap-2 overflow-x-auto md:contents">
              <button
                type="button"
                onClick={() => ui().setQuiz(!quiz)}
                className={toggleBtn(quiz)}
              >
                {flip
                  ? "Mode tes · sembunyikan kata Inggris"
                  : "Mode tes · sembunyikan arti"}
              </button>
              <button
                type="button"
                onClick={() => ui().setFlip(!flip)}
                title="Balik arah: arti Indonesia jadi judul, kata Inggris di bawah. Melatih mengeluarkan kata saat bicara."
                className={toggleBtn(flip)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                  <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                {flip ? "Indo → Inggris" : "Inggris → Indo"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const on = !recall;
                  ui().setRecall(on);
                  if (on) {
                    if (!flip) ui().setFlip(true);
                    if (!quiz) ui().setQuiz(true);
                  }
                  ui().clearRevealed();
                }}
                title="Lihat arti Indonesia, ketik kata Inggrisnya. Melatih mengeluarkan kata, bukan hanya mengenali."
                className={classNames(
                  "h-10 shrink-0 cursor-pointer rounded-lg border-[1.5px] border-green px-3.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                  recall
                    ? "bg-green text-card"
                    : "bg-card text-green hover:bg-green-bg",
                )}
              >
                Mode ketik · recall
              </button>
              <button
                type="button"
                onClick={() => ui().setHideKnown(!hideKnown)}
                className={toggleBtn(hideKnown)}
              >
                Sembunyikan yang hafal
              </button>
            </div>
          </div>

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto md:flex-wrap md:overflow-visible">
            {([["all", "Semua"]] as [string, string][])
              .concat(
                Object.keys(TYPES).map(
                  (k) => [k, TYPES[k].label] as [string, string],
                ),
              )
              .map(([k, label]) => {
                const on = type === k;
                return (
                  <button
                    type="button"
                    key={k}
                    onClick={() => ui().setType(k)}
                    className={classNames(
                      "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3 py-[5px] text-[13px] whitespace-nowrap transition-colors",
                      on
                        ? "border-ink bg-ink text-paper"
                        : "border-line-2 bg-card text-ink hover:border-ink",
                    )}
                  >
                    {label}
                    <span className="font-mono text-[11px] opacity-70">
                      {counts[k] || 0}
                    </span>
                  </button>
                );
              })}
          </div>
          {searching && (
            <span className="text-[13px] text-muted">
              {resultCount} hasil untuk &quot;{q}&quot; di minggu ini
            </span>
          )}
        </div>

        {form && <WordForm plan={plan} data={data} />}
      </>
    );
  },
);

VocabToolbar.displayName = "VocabToolbar";

export default VocabToolbar;
