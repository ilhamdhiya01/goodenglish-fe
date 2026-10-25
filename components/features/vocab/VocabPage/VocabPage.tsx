"use client";

import React from "react";

import TenseIntro from "@/components/features/vocab/TenseIntro/TenseIntro";
import VocabToolbar from "@/components/features/vocab/VocabToolbar/VocabToolbar";
import WeekSidebar from "@/components/features/vocab/WeekSidebar/WeekSidebar";
import WordCard from "@/components/features/vocab/WordCard/WordCard";
import type { Flat } from "@/lib/helpers/level-data.helper";
import { itemKey } from "@/lib/helpers/storage.helper";
import { formsOf, formsSearchText } from "@/lib/helpers/verb-forms.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import type { PlanRow } from "@/lib/types/vocab.types";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

// Halaman Kosakata: sidebar rencana minggu + intro tense + toolbar filter + daftar kartu.
const VocabPage = React.memo(() => {
  const { level, week, data, known } = useShellData();
  const q = useVocabUiStore((s) => s.q);
  const type = useVocabUiStore((s) => s.type);
  const hideKnown = useVocabUiStore((s) => s.hideKnown);
  const focusKey = useVocabUiStore((s) => s.focusKey);

  const { plan, V } = data;
  const d = V[String(week)];
  const ql = q.trim().toLowerCase();
  const searching = ql.length > 0;
  // Cocok dengan kata, arti, atau bentuk V2/V3-nya (mencari "rode" menemukan ride).
  const match = (x: Flat) =>
    x.it[1].toLowerCase().includes(ql) ||
    x.it[3].toLowerCase().includes(ql) ||
    formsSearchText(formsOf(x.it)).includes(ql);
  const weekItems: Flat[] = d ? d.items.map((it) => ({ w: week, it })) : [];
  const src: Flat[] = searching ? weekItems.filter(match) : weekItems;

  const counts: Record<string, number> = { all: src.length };
  src.forEach((x) => {
    counts[x.it[0]] = (counts[x.it[0]] || 0) + 1;
  });
  let list = src.filter((x) => type === "all" || x.it[0] === type);
  if (hideKnown)
    list = list.filter((x) => !known[itemKey(level, x.w, x.it[0], x.it[1])]);

  const pl: PlanRow = plan[week - 1] || [week, "—", "—", "—"];

  return (
    <div className="flex flex-wrap items-start gap-7">
      <WeekSidebar data={data} />

      <main className="flex min-w-0 flex-[999_1_480px] flex-col gap-5.5">
        {d && !searching && <TenseIntro d={d} />}

        {!d && !searching && (
          <section className="flex flex-col gap-2 rounded-[10px] border-[1.5px] border-dashed border-faint bg-card p-7">
            <span className="font-mono text-xs tracking-[0.06em] text-muted">
              MINGGU {String(pl[0]).padStart(2, "0")} · SEGERA
            </span>
            <span className="text-2xl font-bold">{pl[1]}</span>
            <span className="text-sm leading-[1.5] text-ink-3">
              Fokus tense: <b>{pl[2]}</b> · Kata sambung: {pl[3]}
            </span>
            <span className="text-[13px] text-muted">
              Materi minggu ini belum tersedia di level ini. Topik, tense, dan
              kata sambung di atas adalah rencananya.
            </span>
          </section>
        )}

        {(d || searching) && (
          <>
            <VocabToolbar
              searching={searching}
              counts={counts}
              resultCount={list.length}
              plan={plan}
              data={data}
            />
            <div className="flex flex-col gap-2.5">
              {list.map((x) => {
                const ik = itemKey(level, x.w, x.it[0], x.it[1]);
                return (
                  <WordCard
                    key={ik}
                    k={ik}
                    it={x.it}
                    focused={focusKey === ik}
                  />
                );
              })}
              {list.length === 0 && (
                <div className="rounded-[10px] border-[1.5px] border-dashed border-line-2 px-5 py-10 text-center text-sm text-muted">
                  {searching
                    ? "Tidak ada kata yang cocok."
                    : hideKnown
                      ? "Semua item di filter ini sudah hafal. Lanjut ke minggu berikutnya."
                      : "Belum ada item."}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
});

VocabPage.displayName = "VocabPage";

export default VocabPage;
