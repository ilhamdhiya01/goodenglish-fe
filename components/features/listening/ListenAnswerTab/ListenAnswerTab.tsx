"use client";

import React, { useMemo, useState } from "react";

import Jalak from "@/components/brand/Jalak";
import AnswerOption from "@/components/shared/patterns/answer-option";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import { mulberry, shuffle } from "@/lib/helpers/bank-practice.helper";
import { contrastVoice } from "@/lib/helpers/listening.helper";
import { speak, speakAll, stopSpeaking } from "@/lib/helpers/speech.helper";
import { useListeningItems } from "@/lib/hooks/listening/useListening";
import { useShellData } from "@/lib/hooks/useShellData";
import type { ListeningItem } from "@/lib/types/listening.types";
import type { LevelId } from "@/lib/types/session.types";
import { unlockedStage, useListeningStore } from "@/stores/useListeningStore";
import { useTtsStore } from "@/stores/useTtsStore";

import PlayButtons from "../PlayButtons";
import SetResult from "../SetResult";
import StagePicker from "../StagePicker";

// Up to 2 items (6 questions) per set, so 80% can be reached with one slip.
const ITEMS_PER_SET = 2;
const MAX_PLAYS_STAGE3 = 2;
const SLOW = 0.6;
const LETTERS = ["A", "B", "C", "D"];

const STAGES = [
  { n: 1, label: "Agak pelan", desc: "Suara agak pelan, putar ulang sesukamu" },
  { n: 2, label: "Normal", desc: "Suara normal, putar ulang sesukamu" },
  {
    n: 3,
    label: "Seperti aslinya",
    desc: `Suara normal, maksimal ${MAX_PLAYS_STAGE3}× putar`,
  },
];

// "Menyimak › Dengar & jawab": a short dialogue or announcement from the
// shared bank, 3 multiple-choice questions, then the transcript.
const ListenAnswerTab = () => {
  const { level, week } = useShellData();
  const { items, isLoading, isError, refetch } = useListeningItems(
    level as LevelId,
  );
  const listening = useListeningStore();
  const voice = useTtsStore((s) => s.voice);
  const userSpeed = useTtsStore((s) => s.speed);
  const unlocked = unlockedStage(listening, "dengar");
  const [stage, setStage] = useState(unlocked);
  const [set, setSet] = useState<ListeningItem[] | null>(null);
  const [k, setK] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [plays, setPlays] = useState(0);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [outcome, setOutcome] = useState<{ unlocked: boolean } | null>(null);

  const available = useMemo(
    () => (items ?? []).filter((i) => i.week <= week),
    [items, week],
  );

  const start = (st: number) => {
    stopSpeaking();
    const r = mulberry(Date.now() % 2147483647);
    const fresh = shuffle(
      r,
      available.filter((i) => !listening.seen[i.id]),
    );
    const old = shuffle(
      r,
      available.filter((i) => listening.seen[i.id]),
    );
    setStage(st);
    setSet([...fresh, ...old].slice(0, ITEMS_PER_SET));
    setK(0);
    setAnswers({});
    setChecked(false);
    setPlays(0);
    setScore({ right: 0, total: 0 });
    setOutcome(null);
  };

  const cur = set?.[k];
  const voiceOf = (speaker: "A" | "B") =>
    speaker === "B" ? contrastVoice(voice) : voice;
  const speedOf = (slow: boolean) =>
    slow ? SLOW : stage === 1 ? Math.min(0.78, userSpeed) : userSpeed;
  const limitReached = stage === 3 && plays >= MAX_PLAYS_STAGE3 && !checked;

  const play = (slow: boolean) => {
    if (!cur || limitReached) return;
    setPlays((p) => p + 1);
    void speakAll(
      cur.lines.map((l) => ({
        text: l.text,
        voice: voiceOf(l.speaker),
        speed: speedOf(slow),
      })),
    );
  };

  const checkAnswers = () => {
    if (!cur) return;
    const right = cur.questions.filter(
      (q, i) => answers[i] === q.answerIndex,
    ).length;
    setScore((s) => ({
      right: s.right + right,
      total: s.total + cur.questions.length,
    }));
    setChecked(true);
  };

  const next = () => {
    if (!set || !cur) return;
    stopSpeaking();
    if (k + 1 < set.length) {
      setK(k + 1);
      setAnswers({});
      setChecked(false);
      setPlays(0);
      return;
    }
    listening.markSeen(set.map((i) => i.id));
    setOutcome(
      listening.finishSet({
        tab: "dengar",
        stage,
        score: score.right,
        total: score.total,
        questions: score.total,
        level,
        week,
      }),
    );
  };

  if (isLoading) {
    return <span className="text-sm font-bold text-ink-2">Memuat soal…</span>;
  }
  if (isError) {
    return (
      <Card tone="redBg" pad="sm" className="gap-2" role="alert">
        <span className="text-sm font-bold text-ink">
          Soal belum bisa dimuat. Periksa koneksi, lalu coba lagi.
        </span>
        <Button size="sm" className="self-start" onClick={() => void refetch()}>
          Coba lagi
        </Button>
      </Card>
    );
  }
  if (!available.length) {
    return (
      <Card tone="dashed" className="flex-row items-center gap-3">
        <Jalak mood="biasa" />
        <span className="text-sm leading-5 font-bold text-ink-2">
          Belum ada soal Dengar &amp; jawab untuk minggu 1–{week} di levelmu.
          Soal baru muncul setiap hari; coba lagi nanti, ya.
        </span>
      </Card>
    );
  }

  if (!set) {
    return (
      <div className="flex flex-col gap-4">
        <StagePicker
          stages={STAGES}
          unlocked={unlocked}
          current={stage}
          onPick={setStage}
        />
        <Card className="gap-3">
          <span className="text-sm leading-5 text-ink-2">
            Dengarkan percakapan atau pengumuman singkat, lalu jawab 3 soal.
            Teksnya baru muncul setelah kamu menjawab. {available.length} soal
            tersedia untuk minggu 1–{week}.
          </span>
          <Button
            variant="green"
            className="self-start"
            onClick={() => start(stage)}
          >
            Mulai tahap {stage}
          </Button>
        </Card>
      </div>
    );
  }

  if (outcome) {
    return (
      <SetResult
        score={score.right}
        total={score.total}
        detail={`${score.right} dari ${score.total} soal benar`}
        stage={stage}
        unlocked={outcome.unlocked}
        onAgain={() => start(stage)}
        onNext={outcome.unlocked ? () => start(stage + 1) : undefined}
      />
    );
  }

  if (!cur) return null;
  const allAnswered = cur.questions.every((_, i) => answers[i] !== undefined);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel tone="green">
          TAHAP {stage} · SOAL {k + 1}/{set.length} ·{" "}
          {cur.type === "dialog" ? "PERCAKAPAN" : "PENGUMUMAN / PESAN"}
        </SectionLabel>
        <Button size="sm" onClick={() => setSet(null)}>
          Ganti tahap
        </Button>
      </div>
      <Card pad="lg" className="gap-3">
        <PlayButtons
          plays={plays}
          disabled={limitReached}
          onPlay={() => play(false)}
          onSlow={() => play(true)}
        />
        {stage === 3 && !checked && (
          <span className="text-[12.5px] font-bold text-ink-2">
            Sisa putar: {Math.max(0, MAX_PLAYS_STAGE3 - plays)}
          </span>
        )}
      </Card>

      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {cur.questions.map((q, qi) => (
          <li key={qi} className="flex flex-col gap-2">
            <span className="text-[15px] leading-[21px] font-extrabold text-ink">
              {qi + 1}. {q.question}
            </span>
            <div className="grid gap-2 md:grid-cols-2">
              {q.options.map((o, oi) => {
                const picked = answers[qi] === oi;
                // Before checking, a pick is only "selected" (blue), never
                // shown as right or wrong.
                const state = !checked
                  ? "idle"
                  : oi === q.answerIndex
                    ? "correct"
                    : picked
                      ? "wrong"
                      : "dimmed";
                return (
                  <AnswerOption
                    key={oi}
                    letter={LETTERS[oi]}
                    state={state}
                    aria-pressed={picked}
                    disabled={checked}
                    className={
                      !checked && picked
                        ? "border-accent-line! bg-accent-tint! text-accent-edge!"
                        : undefined
                    }
                    onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                  >
                    {o}
                    {!checked && picked && (
                      <span className="sr-only"> (dipilih)</span>
                    )}
                  </AnswerOption>
                );
              })}
            </div>
            {checked && (
              <span className="text-[13.5px] leading-[19px] font-semibold text-ink-2">
                {answers[qi] === q.answerIndex
                  ? "✓ Benar. "
                  : "✕ Kurang tepat. "}
                {q.explanationId}
              </span>
            )}
          </li>
        ))}
      </ol>

      {!checked ? (
        <Button
          variant="green"
          className="self-start"
          disabled={!allAnswered}
          onClick={checkAnswers}
        >
          Periksa jawaban
        </Button>
      ) : (
        <>
          <Card className="gap-2">
            <SectionLabel>TRANSKRIP · {cur.title}</SectionLabel>
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
              {cur.lines.map((l, li) => (
                <li key={li} className="flex items-start gap-2">
                  {cur.type === "dialog" && (
                    <span className="w-5 shrink-0 pt-0.5 text-[13px] font-black text-ink-3">
                      {l.speaker}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 text-[15px] leading-[21px] font-bold text-ink">
                    {l.text}
                  </span>
                  <SpeakButton
                    text={l.text}
                    size={30}
                    icon={14}
                    onClick={() => speak(l.text, { voice: voiceOf(l.speaker) })}
                  />
                </li>
              ))}
            </ol>
          </Card>
          <Button variant="green" className="self-start" onClick={next}>
            {k + 1 < set.length ? "Soal berikutnya" : "Lihat hasil"}
          </Button>
        </>
      )}
    </div>
  );
};

export default ListenAnswerTab;
