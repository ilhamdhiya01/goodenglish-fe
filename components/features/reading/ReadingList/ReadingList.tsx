"use client";

import Link from "next/link";
import React, { useMemo } from "react";
import { LuCircleCheck } from "react-icons/lu";

import Jalak from "@/components/brand/Jalak";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SectionLabel from "@/components/ui/section-label";
import { LEVELS } from "@/const/levels.constant";
import { groupByWeek, readingMinutes } from "@/lib/helpers/reading.helper";
import { useReadingTexts } from "@/lib/hooks/reading/useReading";
import { useShellData } from "@/lib/hooks/useShellData";
import { SLOT_WORDS } from "@/lib/types/reading.types";
import type { LevelId } from "@/lib/types/session.types";
import { ROUTES } from "@/routes";
import { useReadingStore } from "@/stores/useReadingStore";

// "Bacaan": the published texts of the active level, the active week first.
const ReadingList = () => {
  const { level, week } = useShellData();
  const levelName = (LEVELS.find((l) => l[0] === level) || [])[1] || level;
  const { texts, isLoading, isError, refetch } = useReadingTexts(
    level as LevelId,
  );
  const done = useReadingStore((s) => s.done);
  const groups = useMemo(() => groupByWeek(texts ?? [], week), [texts, week]);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <SectionLabel tone="green">
          {String(levelName).toUpperCase()} · MINGGU {week}
        </SectionLabel>
        <PageHeading>Bacaan</PageHeading>
        <Lead>
          Temui lagi kosakata minggu ini di dalam cerita pendek. Ketuk kata
          untuk melihat arti dan mendengarnya, simpan kata baru ke Ulang, lalu
          jawab 5 soal pemahaman.
        </Lead>
      </div>

      {isLoading ? (
        <Card tone="dashed" className="py-8 text-center">
          <span className="text-[15px] font-bold text-ink-2">
            Memuat bacaan…
          </span>
        </Card>
      ) : isError ? (
        <Card tone="redBg" className="items-start">
          <span className="text-[15px] font-bold text-ink">
            Bacaan belum bisa dimuat. Periksa koneksi internetmu.
          </span>
          <Button size="sm" onClick={() => void refetch()}>
            Coba lagi
          </Button>
        </Card>
      ) : !groups.length ? (
        <Card tone="dashed" className="items-center py-8 text-center">
          <Jalak mood="berpikir" />
          <span className="text-[15px] font-bold text-ink-2">
            Belum ada bacaan untuk level ini. Admin sedang menyiapkannya.
          </span>
        </Card>
      ) : (
        groups.map((g) => (
          <div key={g.week} className="flex flex-col gap-2.5">
            <h2 className="m-0 text-base font-black text-ink">
              Minggu {g.week}
              {g.week === week && (
                <span className="ml-2 text-[13px] font-extrabold text-accent-edge">
                  · minggu ini
                </span>
              )}
            </h2>
            <ul className="m-0 grid list-none gap-2.5 p-0 md:grid-cols-2">
              {g.texts.map((t) => {
                const isDone = !!done[t.id];
                const [min, max] = SLOT_WORDS[t.slot];
                return (
                  <li key={t.id}>
                    <Link
                      href={ROUTES.readingText(t.id)}
                      className="flex h-full press flex-col gap-1.5 rounded-xl border-2 border-line bg-surface px-4 py-3.5 edge-card focus-ring hover:bg-sunken"
                    >
                      <span className="text-[12.5px] font-extrabold tracking-[0.06em] text-ink-2">
                        TEKS {t.slot} · {min}–{max} KATA
                      </span>
                      <span className="text-[17px] leading-6 font-black text-ink">
                        {t.title}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-bold text-ink-2">
                        <span>± {readingMinutes(t.wordCount)} menit baca</span>
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-ok">
                            <LuCircleCheck aria-hidden size={15} />
                            Selesai
                          </span>
                        ) : (
                          <span>Belum dibaca</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </section>
  );
};

export default ReadingList;
