"use client";

import React from "react";
import { LuAward, LuLock } from "react-icons/lu";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import { levelName } from "@/const/levels.constant";
import { formatDate } from "@/lib/helpers/date.helper";
import { examOpen, passedAttempt, retryIn } from "@/lib/helpers/exam.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import type { LevelId } from "@/lib/types/session.types";
import { useAccessStore } from "@/stores/useAccessStore";
import { useExamStore } from "@/stores/useExamStore";
import { useTestRunStore } from "@/stores/useTestRunStore";

import { downloadCertificate } from "./certificate";

// "Ujian akhir level" of the active level: locked (with what's missing),
// ready, waiting 24 hours after a failed attempt, or passed.
const ExamCard = ({ compact = false }: { compact?: boolean }) => {
  const { level, week, data, all, knownCount } = useShellData();
  const exam = useExamStore();
  const name = useAccessStore((s) => s.session?.label ?? "");
  const open = useTestRunStore((s) => s.open);
  const lastWeek = data.plan.length;
  const isOpen = examOpen({
    known: knownCount,
    total: all.length,
    week,
    lastWeek,
  });
  const passed = passedAttempt(exam, level);
  const wait = retryIn(exam, level);
  const pct = all.length ? Math.round((knownCount / all.length) * 100) : 0;
  // On the Kosakata cover only once it matters.
  if (compact && !isOpen && !passed) return null;

  return (
    <Card tone={passed ? "done" : "line"} className="gap-2.5">
      <SectionLabel tone={passed ? "ok" : "green"}>
        UJIAN AKHIR LEVEL · {levelName(level).toUpperCase()}
      </SectionLabel>
      {passed ? (
        <>
          <span className="flex items-center gap-2 text-[15px] font-extrabold text-ink">
            <LuAward aria-hidden size={18} className="text-ok" />
            Lulus {formatDate(passed.date)} · skor {passed.pct}%
          </span>
          <Button
            size="sm"
            className="self-start"
            onClick={() => downloadCertificate(passed, name)}
          >
            Unduh sertifikat
          </Button>
        </>
      ) : !isOpen ? (
        <span className="flex items-start gap-2 text-sm leading-5 text-ink-2">
          <LuLock aria-hidden size={16} className="mt-0.5 shrink-0" />
          Terbuka saat 80% kata level ini sudah hafal (sekarang {pct}%), atau di
          minggu {lastWeek} bila sudah 50% hafal.
        </span>
      ) : wait > 0 ? (
        <span className="text-sm leading-5 text-ink-2">
          Belum lulus. Bisa diulang dalam {Math.ceil(wait / 3_600_000)} jam.
          Sambil menunggu, latih bagian yang lemah.
        </span>
      ) : (
        <>
          <span className="text-sm leading-5 text-ink-2">
            40 soal kosakata, grammar, dan menyimak (±25 menit). Lulus kalau
            total ≥ 75% dan tiap bagian ≥ 60%, lalu dapat sertifikat.
          </span>
          <Button
            variant="green"
            size="sm"
            className="self-start"
            onClick={() => open({ kind: "exam", level: level as LevelId })}
          >
            Mulai ujian
          </Button>
        </>
      )}
    </Card>
  );
};

export default ExamCard;
