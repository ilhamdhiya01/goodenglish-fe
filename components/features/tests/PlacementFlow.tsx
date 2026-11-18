"use client";

import React, { useEffect, useMemo, useState } from "react";

import Jalak from "@/components/brand/Jalak";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import { levelName, LEVELS } from "@/const/levels.constant";
import { unlockedLevels } from "@/lib/helpers/exam.helper";
import { levelData } from "@/lib/helpers/level-data.helper";
import {
  pctOf,
  placementGoesUp,
  placementQuestions,
  recommendPlacement,
  scoreSections,
  totalOf,
} from "@/lib/helpers/test-engine.helper";
import {
  SECTION_LABEL,
  type SectionId,
  type SectionScores,
  type TestQuestion,
} from "@/lib/types/exam.types";
import type { LevelId } from "@/lib/types/session.types";
import { useAccessStore } from "@/stores/useAccessStore";
import { useExamStore } from "@/stores/useExamStore";
import { useLevelStore } from "@/stores/useLevelStore";

import TestRunner from "./TestRunner";
import { useGrammarGens, useListenItems } from "./useTestContent";

const weeksOf = (l: LevelId) => levelData(l, []).plan.length;
const ORDER = LEVELS.map((l) => l[0] as LevelId);

// Tes penempatan: level by level from the lowest one the token allows (4
// vocab + 4 grammar + 2 listening each); up at ≥ 70%, stop below. Never
// marks any word as memorised.
const PlacementFlow = ({ onClose }: { onClose: () => void }) => {
  const session = useAccessStore((s) => s.session);
  const allowed = useMemo(
    () => ORDER.filter((l) => session?.levels.includes(l)),
    [session],
  );
  const { gens, error } = useGrammarGens();
  const listenItems = useListenItems();
  const [seed] = useState(() => Date.now() % 2147483647);
  const [step, setStep] = useState(0);
  // Questions of the level being tested (stale ones count as loading).
  const [batch, setBatch] = useState<{
    step: number;
    qs: TestQuestion[];
  } | null>(null);
  const [perLevel, setPerLevel] = useState<
    Partial<Record<LevelId, SectionScores>>
  >({});
  const [result, setResult] = useState<{ level: LevelId; week: number } | null>(
    null,
  );
  const [choosing, setChoosing] = useState(false);
  const level = allowed[step];

  // Questions for the level being tested.
  useEffect(() => {
    if (!gens || !level || result) return;
    let alive = true;
    void listenItems(level).then((items) => {
      if (!alive) return;
      const qs = placementQuestions({
        data: levelData(level, []),
        level,
        gens,
        items,
        seed: seed + step * 101,
      });
      setBatch({ step, qs });
    });
    return () => {
      alive = false;
    };
  }, [gens, level, step, seed, listenItems, result]);

  const finish = (scores: Partial<Record<LevelId, SectionScores>>) => {
    const rec = recommendPlacement(allowed, scores, weeksOf);
    useExamStore.getState().setPlacement({
      status: "done",
      date: new Date().toISOString(),
      perLevel: scores,
      recommended: rec,
    });
    setResult(rec);
  };

  const start = (l: LevelId, week: number) => {
    const lv = useLevelStore.getState();
    lv.setLevel(l);
    lv.setWeek(week);
    useExamStore.getState().setBase(l);
    onClose();
  };

  if (error) {
    return (
      <Card tone="redBg" className="items-start">
        <span className="text-[15px] font-bold text-ink">
          Soal tes belum bisa dimuat. Periksa koneksi, lalu coba lagi.
        </span>
        <Button onClick={onClose}>Tutup</Button>
      </Card>
    );
  }

  if (result) {
    // Strong and weak parts over every level tried.
    const sum: SectionScores = {};
    Object.values(perLevel).forEach((s) =>
      (Object.keys(s!) as SectionId[]).forEach((k) => {
        const t = (sum[k] ??= { right: 0, total: 0 });
        t.right += s![k]!.right;
        t.total += s![k]!.total;
      }),
    );
    const parts = (Object.keys(sum) as SectionId[]).sort(
      (a, b) => pctOf(sum[b]!) - pctOf(sum[a]!),
    );
    const choices = unlockedLevels({
      allowed,
      requireExam: !!session?.requireExam,
      exam: { ...useExamStore.getState(), base: result.level },
      current: result.level,
    });
    return (
      <div className="flex flex-col gap-4">
        <Card
          tone="done"
          pad="lg"
          className="flex-row items-start gap-4"
          role="status"
        >
          <Jalak mood="senang" className="shrink-0" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <SectionLabel tone="ok">HASIL TES PENEMPATAN</SectionLabel>
            <span className="text-2xl font-black text-ink">
              {levelName(result.level)} · minggu {result.week}
            </span>
            <span className="text-sm leading-5 text-ink-2">
              {result.week > 1
                ? "Kamu sudah menguasai sebagian besar level ini, jadi mulai dari pertengahannya."
                : "Mulai dari awal level ini supaya fondasinya kuat."}
            </span>
          </div>
        </Card>
        <Card className="gap-2">
          <SectionLabel>PER LEVEL</SectionLabel>
          {(Object.keys(perLevel) as LevelId[]).map((l) => {
            const t = totalOf(perLevel[l]!);
            return (
              <span key={l} className="text-sm font-bold text-ink">
                {levelName(l)}: {t.right}/{t.total} benar ({pctOf(t)}%)
              </span>
            );
          })}
          {parts.length > 1 && (
            <span className="pt-1 text-sm leading-5 text-ink-2">
              Paling kuat: <b>{SECTION_LABEL[parts[0]]}</b> (
              {pctOf(sum[parts[0]]!)}%). Perlu dilatih:{" "}
              <b>{SECTION_LABEL[parts.at(-1)!]}</b> (
              {pctOf(sum[parts.at(-1)!]!)}%).
            </span>
          )}
        </Card>
        {choosing ? (
          <Card className="gap-2">
            <SectionLabel>PILIH LEVEL</SectionLabel>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Level"
            >
              {choices.map((l) => (
                <Pill key={l} onClick={() => start(l, 1)}>
                  {levelName(l)}
                </Pill>
              ))}
            </div>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="green"
              onClick={() => start(result.level, result.week)}
            >
              Mulai di sini
            </Button>
            <Button onClick={() => setChoosing(true)}>Pilih lain</Button>
          </div>
        )}
      </div>
    );
  }

  const qs = batch?.step === step ? batch.qs : null;
  if (!gens || !qs || !level) {
    return (
      <span role="status" className="text-[15px] font-bold text-ink-2">
        Menyiapkan soal…
      </span>
    );
  }

  return (
    <TestRunner
      key={level}
      title={`TES PENEMPATAN · ${levelName(level).toUpperCase()}`}
      questions={qs}
      gens={gens}
      onQuit={onClose}
      onDone={(answers) => {
        const s = scoreSections(qs, answers, gens);
        const scores = { ...perLevel, [level]: s };
        setPerLevel(scores);
        if (placementGoesUp(s) && step + 1 < allowed.length) setStep(step + 1);
        else finish(scores);
      }}
    />
  );
};

export default PlacementFlow;
