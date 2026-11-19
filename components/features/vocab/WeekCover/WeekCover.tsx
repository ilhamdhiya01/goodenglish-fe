"use client";

import React, { useEffect, useState } from "react";
import { LuChevronDown } from "react-icons/lu";

import ExamCard from "@/components/features/tests/ExamCard";
import WeekSidebar from "@/components/features/vocab/WeekSidebar/WeekSidebar";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import Pill from "@/components/ui/pill";
import ProgressBar from "@/components/ui/progress-bar";
import SectionLabel from "@/components/ui/section-label";
import Sheet from "@/components/ui/sheet";
import { levelName } from "@/const/levels.constant";
import type { LevelData } from "@/lib/helpers/level-data.helper";
import { itemKey, today } from "@/lib/helpers/storage.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import { laporAktivitas } from "@/lib/rencana/lapor";
import type { PlanRow } from "@/lib/types/vocab.types";
import { useLaporanStore } from "@/stores/useLaporanStore";
import { useQuizStore } from "@/stores/useQuizStore";

interface Props {
  data: LevelData;
}

// Cover of the open week: label, title, topic, known / total, and the
// "Tes cepat" launcher (this week or every week). Below 1100px the week list
// opens from "Minggu ▾" here instead of the right column.
const WeekCover = React.memo(({ data }: Props) => {
  const { level, week, all, known } = useShellData();
  const scope = useQuizStore((s) => s.scope);
  const setScope = useQuizStore((s) => s.setScope);
  const startQuiz = useQuizStore((s) => s.start);
  const [weeks, setWeeks] = useState(false);

  const d = data.V[String(week)];
  const pl: PlanRow = data.plan[week - 1] || [week, "—", "—", "—"];
  const items = d?.items || [];
  const kn = items.filter(
    (it) => known[itemKey(level, week, it[0], it[1])],
  ).length;

  // Rencana: how many words of this week are left (once a day per week).
  // Only a state, never a tick: it lets Rencana offer "Lewati" when the
  // week is already all marked.
  useEffect(() => {
    if (!items.length) return;
    const T = today();
    const sent = useLaporanStore
      .getState()
      .items.some(
        (l) =>
          l.jenis === "status_kata_minggu" &&
          l.day === T &&
          l.level === level &&
          l.week === week,
      );
    if (!sent)
      laporAktivitas("status_kata_minggu", {
        level,
        week,
        data: { sisa: items.length - kn, total: items.length },
      });
  }, [level, week, kn, items.length]);

  // A week with too few words is tested over every week, and logged so.
  const start = () =>
    scope === "week"
      ? startQuiz(
          all.filter((x) => x.w === week),
          "week",
          all,
        )
      : startQuiz(all, "all");

  return (
    <Card pad="lg" className="gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <SectionLabel>
            Minggu {week} · {levelName(level)}
            {d ? ` · ${items.length} item` : " · segera"}
          </SectionLabel>
          <h2 className="m-0 text-2xl leading-[30px] font-black tracking-[-0.02em] text-ink md:text-[30px] md:leading-9">
            {d?.title || pl[1]}
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          aria-haspopup="dialog"
          onClick={() => setWeeks(true)}
          className="@min-[56rem]:hidden"
        >
          Minggu
          <LuChevronDown aria-hidden size={14} />
        </Button>
      </div>
      {d ? (
        <>
          <Lead>{d.topic}</Lead>
          <ProgressBar
            pct={items.length ? (kn / items.length) * 100 : 0}
            label={`${kn} dari ${items.length} hafal`}
            className="max-w-[420px]"
          />
        </>
      ) : (
        <Lead>
          Fokus tense: <b>{pl[2]}</b> · Kata sambung: {pl[3]}. Materi minggu ini
          belum tersedia di level ini. Topik, tense, dan kata sambung di atas
          adalah rencananya.
        </Lead>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button variant="green" onClick={start}>
          Tes cepat · 20 soal
        </Button>
        <Pill
          size="sm"
          on={scope === "week"}
          title="Soal hanya dari minggu yang sedang dibuka"
          onClick={() => setScope("week")}
        >
          Minggu ini
        </Pill>
        <Pill
          size="sm"
          on={scope === "all"}
          title="Soal dari semua minggu di level ini"
          onClick={() => setScope("all")}
        >
          Semua
        </Pill>
      </div>
      <ExamCard compact />
      {weeks && (
        <Sheet label="Pilih minggu" onClose={() => setWeeks(false)}>
          <WeekSidebar data={data} bare onPicked={() => setWeeks(false)} />
        </Sheet>
      )}
    </Card>
  );
});

WeekCover.displayName = "WeekCover";

export default WeekCover;
