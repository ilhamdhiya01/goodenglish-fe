"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import Jalak from "@/components/brand/Jalak";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import { levelName } from "@/const/levels.constant";
import { PRACTICE_CATEGORY } from "@/const/mistake-categories.constant";
import { checkDictation, explainMarks } from "@/lib/helpers/dictation.helper";
import { nextLevel, unlockedLevels } from "@/lib/helpers/exam.helper";
import { levelData } from "@/lib/helpers/level-data.helper";
import {
  examPassed,
  examQuestions,
  isRight,
  pctOf,
  scoreSections,
  sectionsBelow,
  totalOf,
} from "@/lib/helpers/test-engine.helper";
import {
  type ExamAttempt,
  SECTION_LABEL,
  type SectionId,
  type TestAnswer,
  type TestQuestion,
} from "@/lib/types/exam.types";
import type { MistakeInput } from "@/lib/types/mistake.types";
import type { LevelId } from "@/lib/types/session.types";
import { useAccessStore } from "@/stores/useAccessStore";
import { useExamStore } from "@/stores/useExamStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { useMistakeStore } from "@/stores/useMistakeStore";

import { downloadCertificate, printCertificate } from "./certificate";
import TestRunner from "./TestRunner";
import { type Gens, useGrammarGens, useListenItems } from "./useTestContent";

const PRACTICE_LINK: Record<SectionId, [string, string]> = {
  vocab: ["/vocab", "Latih Kosakata"],
  grammar: ["/grammar/tense", "Latihan Panduan grammar"],
  listening: ["/listening/dikte", "Latih Menyimak › Dikte"],
};

/** Wrong exam answers for Buku kesalahanku (listen comprehension is left
 * out: it's about the story, not a language mistake). */
export const examMistakes = (
  qs: TestQuestion[],
  answers: TestAnswer[],
  gens: Gens,
): MistakeInput[] =>
  qs.flatMap((q, i): MistakeInput[] => {
    const a = answers[i] ?? null;
    if (a === null || isRight(q, a, gens)) return [];
    const base = { source: "Ujian" as const, level: q.level, refId: q.id };
    switch (q.kind) {
      case "vocab-mc":
        return [
          {
            ...base,
            wrong: `${q.word} = ${a}`,
            correct: `${q.word} = ${q.meaning}`,
            explanation_id: `"${q.word}" artinya ${q.meaning}.`,
            category: "kesalahan",
          },
        ];
      case "vocab-rev":
      case "vocab-type":
        return [
          {
            ...base,
            wrong: `${q.meaning} = ${a}`,
            correct: `${q.meaning} = ${q.word}`,
            explanation_id: `Bahasa Inggris "${q.meaning}" adalah ${q.word}.`,
            category: "kesalahan",
          },
        ];
      case "grammar": {
        const g = gens[q.topic];
        return [
          {
            ...base,
            wrong: g?.full ? g.full(q.q, String(a), q.stage) : String(a),
            correct: q.q.ans,
            explanation_id: g
              ? g.explain(q.q, String(a), q.stage).replace(/^Benar: /, "")
              : q.q.why,
            category: PRACTICE_CATEGORY[q.topic],
          },
        ];
      }
      case "dictation":
        return [
          {
            ...base,
            wrong: String(a),
            correct: q.sentence.text,
            explanation_id: explainMarks(
              checkDictation(q.sentence.text, String(a)).marks,
            ),
            category: "menyimak",
          },
        ];
      case "listen":
        return [];
    }
  });

// Ujian akhir level: 40 questions; pass at ≥ 75% overall and ≥ 60% in every
// section. Passing gives a certificate; failing can be retried in 24 hours.
const ExamFlow = ({
  level,
  onClose,
}: {
  level: LevelId;
  onClose: () => void;
}) => {
  const session = useAccessStore((s) => s.session);
  const { gens, error } = useGrammarGens();
  const listenItems = useListenItems();
  const [qs, setQs] = useState<TestQuestion[] | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);

  useEffect(() => {
    if (!gens) return;
    let alive = true;
    void listenItems(level).then((items) => {
      if (!alive) return;
      const qs = examQuestions({
        data: levelData(level, []),
        level,
        gens,
        items,
        seed: Date.now() % 2147483647,
      });
      setQs(qs);
    });
    return () => {
      alive = false;
    };
  }, [gens, level, listenItems]);

  if (error) {
    return (
      <Card tone="redBg" className="items-start">
        <span className="text-[15px] font-bold text-ink">
          Soal ujian belum bisa dimuat. Periksa koneksi, lalu coba lagi.
        </span>
        <Button onClick={onClose}>Tutup</Button>
      </Card>
    );
  }

  if (attempt) {
    const name = session?.label ?? "";
    const up = nextLevel(level);
    const canUp =
      !!up &&
      unlockedLevels({
        allowed: (session?.levels ?? []) as LevelId[],
        requireExam: !!session?.requireExam,
        exam: useExamStore.getState(),
        current: level,
      }).includes(up);
    const weak = sectionsBelow(attempt.sections);
    return (
      <div className="flex flex-col gap-4">
        <Card
          tone={attempt.passed ? "done" : "line"}
          pad="lg"
          className="flex-row items-start gap-4"
          role="status"
        >
          <Jalak
            mood={attempt.passed ? "bangga" : "biasa"}
            className="shrink-0"
          />
          <div className="flex min-w-0 flex-col gap-1.5">
            <SectionLabel tone={attempt.passed ? "ok" : "muted"}>
              UJIAN AKHIR LEVEL · {levelName(level).toUpperCase()}
            </SectionLabel>
            <span className="text-2xl font-black text-ink">
              {attempt.passed ? "Selamat, kamu lulus!" : "Belum lulus"} ·{" "}
              {attempt.pct}%
            </span>
            <span className="text-sm leading-5 text-ink-2">
              {attempt.passed
                ? "Sertifikatmu sudah siap diunduh."
                : "Syarat lulus: total ≥ 75% dan tiap bagian ≥ 60%. Kamu bisa mengulang setelah 24 jam."}
            </span>
          </div>
        </Card>
        <Card className="gap-2">
          <SectionLabel>SKOR PER BAGIAN</SectionLabel>
          {(Object.keys(attempt.sections) as SectionId[]).map((k) => (
            <span key={k} className="text-sm font-bold text-ink">
              {SECTION_LABEL[k]}: {attempt.sections[k]!.right}/
              {attempt.sections[k]!.total} ({pctOf(attempt.sections[k]!)}%)
              {weak.includes(k) && (
                <span className="text-bad"> · di bawah 60%</span>
              )}
            </span>
          ))}
        </Card>
        {attempt.passed ? (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="green"
              onClick={() => downloadCertificate(attempt, name)}
            >
              Unduh sertifikat (gambar)
            </Button>
            <Button onClick={() => printCertificate(attempt, name)}>
              Cetak / simpan PDF
            </Button>
            {up &&
              (canUp ? (
                <Button
                  onClick={() => {
                    useLevelStore.getState().setLevel(up);
                    onClose();
                  }}
                >
                  Pindah ke {levelName(up)}
                </Button>
              ) : (
                <span className="self-center text-sm font-bold text-ink-2">
                  Minta admin membuka level {levelName(up)}.
                </span>
              ))}
          </div>
        ) : (
          <Card className="gap-2">
            <SectionLabel>LATIHAN YANG DISARANKAN</SectionLabel>
            {(weak.length
              ? weak
              : (Object.keys(attempt.sections) as SectionId[])
            ).map((k) => (
              <Link
                key={k}
                href={PRACTICE_LINK[k][0]}
                onClick={onClose}
                className="text-sm font-extrabold text-accent-edge focus-ring hover:underline"
              >
                {PRACTICE_LINK[k][1]} →
              </Link>
            ))}
            <span className="text-[13px] text-ink-2">
              Jawaban yang salah sudah masuk ke Buku kesalahanku.
            </span>
          </Card>
        )}
        <Button className="self-start" onClick={onClose}>
          Tutup
        </Button>
      </div>
    );
  }

  if (!gens || !qs) {
    return (
      <span role="status" className="text-[15px] font-bold text-ink-2">
        Menyiapkan soal ujian…
      </span>
    );
  }

  return (
    <TestRunner
      title={`UJIAN AKHIR LEVEL · ${levelName(level).toUpperCase()}`}
      questions={qs}
      gens={gens}
      onQuit={onClose}
      onDone={(answers) => {
        const sections = scoreSections(qs, answers, gens);
        const a = useExamStore.getState().addAttempt({
          level,
          sections,
          pct: pctOf(totalOf(sections)),
          passed: examPassed(sections),
        });
        useMistakeStore.getState().addMany(examMistakes(qs, answers, gens));
        setAttempt(a);
      }}
    />
  );
};

export default ExamFlow;
