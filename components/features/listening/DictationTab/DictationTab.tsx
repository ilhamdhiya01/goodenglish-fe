"use client";

import classNames from "classnames";
import React, { useMemo, useRef, useState } from "react";

import WordMarks from "@/components/shared/patterns/word-marks";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { FIELD_CLASS } from "@/components/ui/input/Input";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import { VOCAB_SCEN } from "@/lib/content";
import {
  checkDictation,
  type DictationCheck,
  explainMarks,
} from "@/lib/helpers/dictation.helper";
import {
  DICTATION_PER_SET,
  dictationPool,
  type DictationSentence,
  dictationSpeed,
  type DictationStage,
  pickDictation,
  STAGE_RULES,
} from "@/lib/helpers/listening.helper";
import { speak, stopSpeaking } from "@/lib/helpers/speech.helper";
import { useShellData } from "@/lib/hooks/useShellData";
import type { Scenario } from "@/lib/types/scenario.types";
import type { LevelId } from "@/lib/types/session.types";
import { unlockedStage, useListeningStore } from "@/stores/useListeningStore";
import { addMistake } from "@/stores/useMistakeStore";

import PlayButtons from "../PlayButtons";
import SetResult from "../SetResult";
import StagePicker from "../StagePicker";

const STAGES = [
  { n: 1, label: "Pendek", desc: STAGE_RULES[1] },
  { n: 2, label: "Sedang", desc: STAGE_RULES[2] },
  { n: 3, label: "Panjang & cepat", desc: STAGE_RULES[3] },
];
const SLOW = 0.6;

interface Done {
  sentence: DictationSentence;
  check: DictationCheck;
  typed: string;
}

// "Menyimak › Dikte": hear a sentence, type it, see it marked word by word.
const DictationTab = () => {
  const { level, week, data } = useShellData();
  const listening = useListeningStore();
  const unlocked = unlockedStage(listening, "dikte");
  const [stage, setStage] = useState<DictationStage>(
    unlocked as DictationStage,
  );
  const [set, setSet] = useState<DictationSentence[] | null>(null);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [check, setCheck] = useState<DictationCheck | null>(null);
  const [retried, setRetried] = useState(false);
  const [plays, setPlays] = useState(0);
  const [replays, setReplays] = useState(0);
  const [done, setDone] = useState<Done[]>([]);
  const [outcome, setOutcome] = useState<{ unlocked: boolean } | null>(null);
  const boxRef = useRef<HTMLInputElement>(null);

  const pool = useMemo(
    () => dictationPool(data, VOCAB_SCEN as Scenario[], level, week),
    [data, level, week],
  );

  const start = (st: DictationStage) => {
    stopSpeaking();
    setStage(st);
    setSet(
      pickDictation(
        pool,
        st,
        listening.seen,
        Date.now() % 2147483647,
        undefined,
        week,
      ),
    );
    setI(0);
    setTyped("");
    setCheck(null);
    setRetried(false);
    setPlays(0);
    setReplays(0);
    setDone([]);
    setOutcome(null);
  };

  const cur = set?.[i];
  // The answer stays hidden until the one retry is used (or given up).
  const hidden = !!check && check.score < 100 && !retried;
  const play = (slow: boolean) => {
    if (!cur) return;
    speak(cur.text, { speed: slow ? SLOW : dictationSpeed(stage, cur) });
    if (plays > 0) setReplays((r) => r + 1);
    setPlays((p) => p + 1);
    boxRef.current?.focus();
  };

  const submit = () => {
    if (!cur || !typed.trim() || check) return;
    setCheck(checkDictation(cur.text, typed));
  };

  const next = () => {
    if (!cur || !check || !set) return;
    const all = [...done, { sentence: cur, check, typed }];
    if (check.score < 100) {
      addMistake({
        source: "Dikte",
        wrong: typed.trim(),
        correct: cur.text,
        explanation_id: explainMarks(check.marks),
        category: "menyimak",
        level: level as LevelId,
      });
    }
    stopSpeaking();
    setDone(all);
    setTyped("");
    setCheck(null);
    setRetried(false);
    setPlays(0);
    if (i + 1 < set.length) {
      setI(i + 1);
      return;
    }
    const score = all.reduce((n, d) => n + d.check.correct, 0);
    const total = all.reduce((n, d) => n + d.check.total, 0);
    listening.markSeen(all.map((d) => d.sentence.id));
    setOutcome(
      listening.finishSet({
        tab: "dikte",
        stage,
        score,
        total,
        questions: all.length,
        level,
        week,
        replays,
      }),
    );
  };

  if (!set) {
    return (
      <div className="flex flex-col gap-4">
        <StagePicker
          stages={STAGES}
          unlocked={unlocked}
          current={stage}
          onPick={(n) => setStage(n as DictationStage)}
        />
        <Card className="gap-3">
          <span className="text-sm leading-5 text-ink-2">
            {DICTATION_PER_SET} kalimat dari contoh Kosakata minggu 1–{week} dan
            dialog Skenario levelmu. Dengarkan, lalu tulis persis yang kamu
            dengar. Boleh diputar ulang sesukamu.
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
    const perfect = done.filter((d) => d.check.score === 100).length;
    return (
      <SetResult
        score={done.reduce((n, d) => n + d.check.correct, 0)}
        total={done.reduce((n, d) => n + d.check.total, 0)}
        detail={`${perfect} dari ${done.length} kalimat sempurna · diputar ulang ${replays}×`}
        stage={stage}
        unlocked={outcome.unlocked}
        onAgain={() => start(stage)}
        onNext={
          outcome.unlocked
            ? () => start((stage + 1) as DictationStage)
            : undefined
        }
      >
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {done.map((d) => (
            <li
              key={d.sentence.id}
              className="flex items-start gap-3 rounded-xl border-2 border-line bg-surface px-3.5 py-2.5"
            >
              <span
                className={classNames(
                  "w-12 shrink-0 pt-0.5 text-sm font-black tabular-nums",
                  d.check.score === 100 ? "text-ok" : "text-ink-2",
                )}
              >
                {d.check.score}%
              </span>
              <span className="min-w-0 flex-1 text-[14.5px] leading-5 font-bold text-ink">
                {d.sentence.text}
              </span>
              <SpeakButton text={d.sentence.text} size={30} icon={14} />
            </li>
          ))}
        </ol>
      </SetResult>
    );
  }

  if (!cur) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel tone="green">
          TAHAP {stage} · KALIMAT {i + 1}/{set.length}
        </SectionLabel>
        <Button size="sm" onClick={() => setSet(null)}>
          Ganti tahap
        </Button>
      </div>
      <Card pad="lg" className="gap-4">
        <PlayButtons
          plays={plays}
          onPlay={() => play(false)}
          onSlow={() => play(true)}
        />
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            ref={boxRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            readOnly={!!check}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Tulis yang kamu dengar"
            placeholder={plays ? "Tulis yang kamu dengar…" : "Tekan Putar dulu"}
            className={classNames(FIELD_CLASS, "flex-1")}
          />
          <Button
            type="submit"
            variant="green"
            disabled={!typed.trim() || !!check}
          >
            Periksa
          </Button>
        </form>

        {check && (
          <div className="flex flex-col gap-3" role="status">
            <div className="flex items-baseline gap-2">
              <span
                className={classNames(
                  "text-xl font-black tabular-nums",
                  check.score === 100 ? "text-ok" : "text-ink",
                )}
              >
                {check.score}%
              </span>
              <span className="text-[13px] font-bold text-ink-2">
                {check.correct} dari {check.total} kata benar
              </span>
            </div>
            {/* Before the one retry (pilot urutan 7) only where the mistakes
                are is shown, not the sentence. */}
            <WordMarks marks={check.marks} hideAnswer={hidden} />
            {hidden ? (
              <span className="text-[13.5px] font-semibold text-ink-2">
                Kata yang merah salah, ___ = ada yang terlewat. Dengar lagi lalu
                coba sekali lagi.
              </span>
            ) : (
              <div className="flex items-start gap-2 rounded-lg bg-sunken px-3 py-2">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] leading-[21px] font-extrabold text-ink">
                    {cur.text}
                  </span>
                  {cur.meaning && (
                    <span className="text-[13px] leading-[18px] text-ink-2">
                      {cur.meaning}
                    </span>
                  )}
                </div>
                <SpeakButton text={cur.text} size={30} icon={14} />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {hidden ? (
                <>
                  <Button
                    variant="green"
                    onClick={() => {
                      setRetried(true);
                      setCheck(null);
                      setTyped("");
                      boxRef.current?.focus();
                    }}
                  >
                    Coba lagi
                  </Button>
                  <Button onClick={() => setRetried(true)}>
                    Lihat jawaban
                  </Button>
                </>
              ) : (
                <Button variant="green" onClick={next}>
                  {i + 1 < set.length ? "Lanjut" : "Lihat hasil"}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
      <span className="text-[12.5px] font-semibold text-ink-3">
        Huruf besar, tanda baca, singkatan (I&apos;m = I am) dan angka (5 =
        five) tidak dihitung salah.
      </span>
    </div>
  );
};

export default DictationTab;
