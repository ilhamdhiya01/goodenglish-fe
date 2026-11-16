"use client";

import React, { useEffect, useState } from "react";

import Jalak from "@/components/brand/Jalak";
import TenseIntro from "@/components/features/vocab/TenseIntro/TenseIntro";
import VocabToolbar from "@/components/features/vocab/VocabToolbar/VocabToolbar";
import WeekCover from "@/components/features/vocab/WeekCover/WeekCover";
import WeekSidebar from "@/components/features/vocab/WeekSidebar/WeekSidebar";
import WordCard from "@/components/features/vocab/WordCard/WordCard";
import Card from "@/components/ui/card";
import type { Flat } from "@/lib/helpers/level-data.helper";
import { itemKey } from "@/lib/helpers/storage.helper";
import { formsOf, formsSearchText } from "@/lib/helpers/verb-forms.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

const FIRST_CARDS = 40;
const MORE_CARDS = 60;

// Halaman Kosakata: sampul minggu (dengan Tes cepat) + toolbar + daftar kartu;
// di layar lebar kolom kanan berisi fokus tense, kata sambung, dan daftar minggu.
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

  // A week can hold 350 cards: show the first ones at once and add the rest
  // in chunks over the next frames, so the page is usable sooner. Restarts
  // when the list changes; always reaches a card jumped to from search.
  const listKey = [level, week, ql, type, hideKnown].join("|");
  const [shown, setShown] = useState({ key: listKey, n: FIRST_CARDS });
  if (shown.key !== listKey) setShown({ key: listKey, n: FIRST_CARDS });
  const focusAt = focusKey
    ? list.findIndex((x) => itemKey(level, x.w, x.it[0], x.it[1]) === focusKey)
    : -1;
  const limit = Math.max(shown.n, focusAt + 1);
  useEffect(() => {
    if (limit >= list.length) return;
    const id = requestAnimationFrame(() =>
      setShown((s) => ({ ...s, n: Math.max(s.n, limit) + MORE_CARDS })),
    );
    return () => cancelAnimationFrame(id);
  }, [limit, list.length]);

  return (
    <div className="grid items-start gap-6 @min-[56rem]:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        <WeekCover data={data} />

        {/* Below 1100px the tense focus folds into one row under the cover. */}
        {d && !searching && (
          <details className="group rounded-xl border-2 border-line bg-surface @min-[56rem]:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-[18px] py-3 text-sm font-extrabold text-ink focus-ring">
              <span>
                <span className="text-ink-2">Fokus tense · </span>
                {d.tense?.name}
              </span>
              <span
                aria-hidden
                className="text-ink-2 transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <div className="flex flex-col gap-3 px-3 pb-3">
              <TenseIntro d={d} />
            </div>
          </details>
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
              {list.slice(0, limit).map((x) => {
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
              {list.length === 0 &&
                (!searching && hideKnown ? (
                  <Card tone="greenBg" className="flex-row items-center gap-4">
                    <Jalak mood="senang" />
                    <span className="text-[15px] font-bold text-ink">
                      ✓ Semua item di filter ini sudah hafal. Lanjut ke minggu
                      berikutnya.
                    </span>
                  </Card>
                ) : (
                  <Card tone="dashed" className="items-center py-8 text-center">
                    {/* Search or a type filter came up empty. */}
                    {(searching || type !== "all") && <Jalak mood="berpikir" />}
                    <span className="text-[15px] font-bold text-ink-2">
                      {searching
                        ? "Tidak ada kata yang cocok."
                        : "Belum ada item."}
                    </span>
                  </Card>
                ))}
            </div>
          </>
        )}
      </div>

      <aside
        aria-label="Minggu ini"
        className="hidden flex-col gap-4 @min-[56rem]:sticky @min-[56rem]:top-[calc(var(--shell-top)+24px)] @min-[56rem]:flex @min-[56rem]:max-h-[calc(100dvh-var(--shell-top)-48px)] @min-[56rem]:overflow-y-auto @min-[56rem]:pb-2"
      >
        {d && <TenseIntro d={d} />}
        <Card className="gap-1">
          <WeekSidebar data={data} />
        </Card>
      </aside>
    </div>
  );
});

VocabPage.displayName = "VocabPage";

export default VocabPage;
