"use client";

import classNames from "classnames";
import Link from "next/link";
import React, { useMemo, useState } from "react";

import AnswerOption from "@/components/shared/patterns/answer-option";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import {
  buildPairQuestions,
  carrierText,
  PAIR_SPEED,
  type PairQuestion,
  resultsBySound,
  soundGroups,
} from "@/lib/helpers/minimal-pairs.helper";
import { speak, stopSpeaking } from "@/lib/helpers/speech.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import { unlockedStage, useListeningStore } from "@/stores/useListeningStore";

import PlayButtons from "../PlayButtons";
import SetResult from "../SetResult";
import StagePicker from "../StagePicker";

const PER_SET = 20;
const SLOW = 0.6;

const STAGES = [
  {
    n: 1,
    label: "Agak pelan",
    desc: 'Dalam kalimat "Say ___ again.", agak pelan',
  },
  { n: 2, label: "Normal", desc: 'Dalam kalimat "Say ___ again.", normal' },
  { n: 3, label: "Kata saja", desc: "Hanya katanya, kecepatan normal" },
];

// "Menyimak › Bunyi mirip": hear one word of a minimal pair (ship / sip),
// pick which one it was. Results per sound, with a way back to Pelafalan.
const MinimalPairsTab = () => {
  const { level, week } = useShellData();
  const listening = useListeningStore();
  const groups = useMemo(() => soundGroups(), []);
  const unlocked = unlockedStage(listening, "bunyi");
  const [stage, setStage] = useState(unlocked);
  const [qs, setQs] = useState<PairQuestion[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [plays, setPlays] = useState(0);
  const [answers, setAnswers] = useState<{ sound: string; right: boolean }[]>(
    [],
  );
  const [outcome, setOutcome] = useState<{ unlocked: boolean } | null>(null);

  const start = (st: number) => {
    stopSpeaking();
    setStage(st);
    setQs(buildPairQuestions(groups, PER_SET, Date.now() % 2147483647));
    setI(0);
    setPicked(null);
    setPlays(0);
    setAnswers([]);
    setOutcome(null);
  };

  const cur = qs?.[i];
  const play = (slow: boolean, q = cur) => {
    if (!q) return;
    speak(carrierText(q.answer, stage), {
      speed: slow ? SLOW : PAIR_SPEED[stage],
    });
    setPlays((p) => p + 1);
  };

  const choose = (word: string) => {
    if (!cur || picked) return;
    const right = word === cur.answer;
    setPicked(word);
    setAnswers((a) => [...a, { sound: cur.sound, right }]);
    listening.countPair(cur.pair.id, right);
  };

  const next = () => {
    if (!qs) return;
    if (i + 1 < qs.length) {
      setI(i + 1);
      setPicked(null);
      setPlays(1);
      // Inside the click, so the browser lets the audio start.
      play(false, qs[i + 1]);
      return;
    }
    stopSpeaking();
    const right = answers.filter((a) => a.right).length;
    setOutcome(
      listening.finishSet({
        tab: "bunyi",
        stage,
        score: right,
        total: answers.length,
        questions: answers.length,
        level,
        week,
      }),
    );
  };

  if (!qs) {
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
            {PER_SET} soal dari {groups.length} bunyi yang sering tertukar (mis.
            ship / sip, think / sink). Dengarkan, lalu pilih kata yang kamu
            dengar.
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
    const bySound = resultsBySound(groups, answers);
    const right = answers.filter((a) => a.right).length;
    return (
      <SetResult
        score={right}
        total={answers.length}
        detail={`${right} dari ${answers.length} benar`}
        stage={stage}
        unlocked={outcome.unlocked}
        onAgain={() => start(stage)}
        onNext={outcome.unlocked ? () => start(stage + 1) : undefined}
      >
        <Card className="gap-2">
          <SectionLabel>PER BUNYI</SectionLabel>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {bySound.map((s) => (
              <li
                key={s.sound}
                className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-line pt-2 first:border-t-0 first:pt-0"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-[15px] font-black text-ink">
                    {s.sym}
                  </span>
                  <span className="text-[12.5px] font-semibold text-ink-2">
                    {s.sound}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span
                    className={classNames(
                      "text-sm font-black tabular-nums",
                      s.needsWork ? "text-bad" : "text-ok",
                    )}
                  >
                    {s.right}/{s.total}
                  </span>
                  {s.needsWork && (
                    <Link
                      href="/pronunciation?bagian=sounds"
                      className="inline-flex min-h-11 items-center rounded-md text-[13px] font-extrabold text-accent-edge underline focus-ring"
                    >
                      Perlu latihan → Pelafalan
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </SetResult>
    );
  }

  if (!cur) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel tone="green">
          TAHAP {stage} · SOAL {i + 1}/{qs.length}
        </SectionLabel>
        <Button size="sm" onClick={() => setQs(null)}>
          Ganti tahap
        </Button>
      </div>
      <Card pad="lg" className="gap-4">
        <PlayButtons
          plays={plays}
          onPlay={() => play(false)}
          onSlow={() => play(true)}
        />
        <span className="text-sm font-bold text-ink-2">
          Kata mana yang kamu dengar?
        </span>
        <div className="grid grid-cols-2 gap-3">
          {cur.options.map((w, oi) => (
            <AnswerOption
              key={w}
              letter={oi ? "B" : "A"}
              disabled={!plays || !!picked}
              state={
                !picked
                  ? "idle"
                  : w === cur.answer
                    ? "correct"
                    : w === picked
                      ? "wrong"
                      : "dimmed"
              }
              onClick={() => choose(w)}
            >
              <span className="text-lg">{w}</span>
            </AnswerOption>
          ))}
        </div>
        {picked && (
          <div className="flex flex-wrap items-center gap-2" role="status">
            <span className="text-sm font-bold text-ink-2">Bandingkan:</span>
            {[cur.pair.a, cur.pair.b].map((w) => (
              <Button
                key={w}
                size="sm"
                onClick={() =>
                  speak(carrierText(w, stage), { speed: PAIR_SPEED[stage] })
                }
              >
                {w}
              </Button>
            ))}
            <Button variant="green" className="ml-auto" onClick={next}>
              {i + 1 < qs.length ? "Lanjut" : "Lihat hasil"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MinimalPairsTab;
