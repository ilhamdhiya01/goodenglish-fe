"use client";

import type { AxiosError } from "axios";
import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import {
  LuLoaderCircle,
  LuMic,
  LuPlay,
  LuSnail,
  LuSquare,
} from "react-icons/lu";

import { judgeTyped } from "@/components/features/vocab/KnownProof";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import IconButton from "@/components/ui/icon-button";
import Input from "@/components/ui/input";
import SpeakButton from "@/components/ui/speak-button";
import TextButton from "@/components/ui/text-button";
import { accessErrorText } from "@/const/access.constant";
import { categoryOf } from "@/const/mistake-categories.constant";
import { VOCAB_SCEN } from "@/lib/content";
import { checkDictation, type WordMark } from "@/lib/helpers/dictation.helper";
import { dictationMeaning } from "@/lib/helpers/listening.helper";
import { practiceOf } from "@/lib/helpers/practice-ref.helper";
import { releaseSpeech, speak } from "@/lib/helpers/speech.helper";
import type { SrsAnswer } from "@/lib/helpers/srs.helper";
import { useGradeOnLeave } from "@/lib/hooks/useGradeOnLeave";
import {
  extensionOf,
  type RecordedClip,
  useVoiceRecorder,
} from "@/lib/hooks/useVoiceRecorder";
import type { ErrorResponse } from "@/lib/types/api.types";
import type { MistakeRecord } from "@/lib/types/mistake.types";
import type { Scenario } from "@/lib/types/scenario.types";
import { transcribeAudio } from "@/services/stt.service";
import { useAccessStore } from "@/stores/useAccessStore";
import { useAiChatStore } from "@/stores/useAiChatStore";

import RuleSheet, { sectionOfMistake } from "../RuleSheet";

const MIC_HELP = {
  denied:
    "Izin mikrofon ditolak. Izinkan mikrofon untuk situs ini di pengaturan browser, atau ketik jawabanmu.",
  "no-speech": "Suaramu tidak terdengar, coba lagi ya.",
  "no-mic": "Mikrofon tidak ditemukan. Ketik jawabanmu, ya.",
  other: "Mikrofon sedang bermasalah. Coba lagi, atau ketik jawabanmu.",
} as const;

const SLOW = 0.6;
// A corrected sentence takes a few seconds to say; stop by itself after this.
const SAY_MAX_SEC = 12;
// Recorded on after "Berhenti", so the last word isn't cut off.
const TAIL_MS = 400;
// Share of a dictated sentence's words that still counts as "hampir".
const NEAR_SCORE = 80;

type Result = "ok" | "near" | "bad";
const HOW: Record<Result, SrsAnswer> = {
  ok: "good",
  near: "hard",
  bad: "forgot",
};

const RESULT_TEXT: Record<Result, string> = {
  ok: "Tepat",
  near: "Hampir",
  bad: "Belum tepat",
};

const word = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");

// Letters first (a typo in a short answer is "almost"), then words: a long
// sentence is "almost" with at most 1 word in 6 off, however long that word
// is. Contractions count as their full form (checkDictation normalises them).
const judgeSentence = (answer: string, typed: string): Result => {
  const byLetters = judgeTyped(answer, typed);
  if (byLetters !== "bad") return byLetters;
  const { marks, total } = checkDictation(answer, typed);
  const off = marks.filter((x) => x.kind !== "correct").length;
  return off <= Math.floor(total / 6) ? "near" : "bad";
};

/** The wrong sentence's words, those that differ from the right one marked
 * (so the learner knows what to fix). Words only missing can't be marked. */
/** What the learner types to correct `m`. Ujian records vocabulary as word
 * pairs ("sepeda = bicycle"): only the answer half is asked for. */
export const answerOf = (m: Pick<MistakeRecord, "source" | "correct">) => {
  const pair = m.source === "Ujian" ? m.correct.split(" = ") : [];
  return pair.length === 2 ? pair[1] : m.correct;
};

export const markWrong = (wrong: string, correct: string) => {
  const bad: string[] = [];
  for (const m of checkDictation(correct, wrong).marks)
    if (m.kind === "wrong" || m.kind === "extra") bad.push(word(m.word));
  return wrong.split(/(\s+)/).map((t) => {
    const at = bad.indexOf(word(t));
    if (!t.trim() || at < 0) return { t, bad: false };
    bad.splice(at, 1);
    return { t, bad: true };
  });
};

const Marked = ({ parts }: { parts: { t: string; bad: boolean }[] }) => (
  <>
    {parts.map((p, i) =>
      p.bad ? (
        <span
          key={i}
          className="text-bad underline decoration-bad decoration-wavy decoration-2 underline-offset-[6px]"
        >
          <span className="sr-only">Salah: </span>
          {p.t}
        </span>
      ) : (
        <React.Fragment key={i}>{p.t}</React.Fragment>
      ),
    )}
  </>
);

// What was typed in Dengar & tulis, marked word by word: wrong words with a
// wavy red line, missing ones put back in green, extra ones struck out.
const Yours = ({ marks }: { marks: WordMark[] }) => (
  <p className="m-0 flex flex-wrap gap-x-1.5 text-base leading-7 text-ink">
    {marks.map((m, i) =>
      m.kind === "correct" ? (
        <span key={i}>{m.word}</span>
      ) : m.kind === "wrong" ? (
        <span
          key={i}
          className="text-bad underline decoration-bad decoration-wavy decoration-2 underline-offset-4"
        >
          <span className="sr-only">Salah: </span>
          {m.word}
        </span>
      ) : m.kind === "missing" ? (
        <span key={i} className="font-extrabold text-ok">
          <span className="sr-only">Terlewat: </span>
          {m.expected}
        </span>
      ) : (
        <s key={i} className="text-ink-3 decoration-bad decoration-2">
          <span className="sr-only">Berlebih: </span>
          {m.word}
        </s>
      ),
    )}
  </p>
);

interface Props {
  m: MistakeRecord;
  revealed: boolean;
  onReveal: () => void;
  /** Rates the card (the result of what was typed decides); `typed` is the
   * answer of a sentence card, shown next time while it is still wrong. */
  onGrade: (how: SrsAnswer, typed?: string) => void;
  /** "Muncul lagi …" for an answer. */
  comesBack: (how: SrsAnswer) => string;
}

// A mistake card in Ulang, laid out like a word card.
// "Betulkan kalimat": the learner's old wrong sentence with the differing
// words marked; they type (or say) the right one. A Dikte mistake was
// misheard, so its card is "dengar & tulis ulang": the sentence is played,
// not shown. Both are graded from the answer against the stored correct
// sentence (the card trains that very point): right → Ingat, almost →
// Ragu, otherwise Lupa.
const MistakeReviewCard = ({
  m,
  revealed,
  onReveal,
  onGrade,
  comesBack,
}: Props) => {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  // Mic button pressed (to start / to stop); what they lead to is derived
  // below, as in Kosakata's KnownProof.
  const [asked, setAsked] = useState(false);
  const [stopAsked, setStopAsked] = useState(false);
  const tailTimer = useRef(0);

  const writeDown = async (clip: RecordedClip) => {
    setAsked(false);
    setStopAsked(false);
    setBusy(true);
    setSttError(null);
    try {
      // The right sentence goes along so the server refuses speech that is
      // clearly not English (Whisper would translate it into the answer).
      const r = await transcribeAudio(
        clip.blob,
        "answer." + extensionOf(clip.mimeType),
        "en",
        answerOf(m),
      );
      if (r.data.text) setTyped(r.data.text);
    } catch (err) {
      setSttError(
        accessErrorText((err as AxiosError<ErrorResponse>).message ?? ""),
      );
    } finally {
      setBusy(false);
    }
  };
  const rec = useVoiceRecorder({
    onRecorded: (c) => void writeDown(c),
    onBeforeRecord: releaseSpeech,
  });
  const { recording, seconds, stop } = rec;
  useEffect(() => {
    if (recording && seconds >= SAY_MAX_SEC) stop();
  }, [recording, seconds, stop]);
  useEffect(() => () => clearTimeout(tailTimer.current), []);
  // Mic asked for but not recording yet: speaking now would be lost.
  const arming = asked && !recording && !rec.error;
  // "Berhenti" pressed: the tail is still being recorded.
  const stopping = stopAsked && recording;
  const listen = m.source === "Dikte" || m.category === "menyimak";
  const [plays, setPlays] = useState(0);
  const play = (slow: boolean) => {
    speak(m.correct, slow ? { speed: SLOW } : undefined);
    setPlays((n) => n + 1);
  };
  const micNote = rec.error ? MIC_HELP[rec.error] : sttError;
  const cat = categoryOf(m.category);
  const section = sectionOfMistake(m);
  // Panduan grammar mistakes: the practice set, else the Cheat sheet section.
  const practice = practiceOf(m);
  const topic = practice
    ? `${practice.subLabel} · ${practice.title}`
    : section?.title;
  // A sentence card answered wrong before shows that last answer: it asks
  // about what is still wrong. Word pairs and listening cards keep `wrong`.
  const sentence = !listen && answerOf(m) === m.correct;
  const shown = (sentence && m.lastTry) || m.wrong;
  const marked = listen ? [] : markWrong(shown, m.correct);
  const anyMarked = marked.some((p) => p.bad);

  const marks = listen ? checkDictation(m.correct, typed).marks : [];
  const slips = marks.filter((x) => x.kind !== "correct").length;
  const result: Result = listen
    ? slips === 0
      ? "ok"
      : checkDictation(m.correct, typed).score >= NEAR_SCORE
        ? "near"
        : "bad"
    : judgeSentence(typed.includes("=") ? m.correct : answerOf(m), typed);
  const how = HOW[result];
  // A listening card shows it after answering only (before, listening would
  // become translating). An Ujian card's meaning is the task: from the start.
  const meaning = !listen
    ? (m.meaning ?? "")
    : revealed
      ? dictationMeaning(m.correct, VOCAB_SCEN as Scenario[])
      : "";
  const hasAi = useAccessStore((s) => !!s.session?.menus.includes("ai"));
  // Tanya AI about this card, after Cek only (before, it would give the
  // answer away). The card goes along as text for the model.
  const askAi = () =>
    useAiChatStore.getState().openWith(
      {
        word: answerOf(m),
        mistake: [
          `Sumber: ${m.source}${listen ? " (dikte: pelajar menulis kalimat yang ia dengar)" : ""}`,
          `${listen ? "Dulu pelajar menulis" : "Kalimat salah"}: ${shown}`,
          `Jawaban pelajar barusan: ${typed.trim()} (dinilai: ${RESULT_TEXT[result]})`,
          `Yang benar: ${m.correct}`,
          meaning && `Arti: ${meaning}`,
          m.explanation_id && `Penjelasan dari aplikasi: ${m.explanation_id}`,
          topic && `Materi: ${topic}`,
        ]
          .filter(Boolean)
          .join("\n")
          .slice(0, 2000),
      },
      {},
    );
  const grade = () => onGrade(how, sentence ? typed.trim() : undefined);
  const settle = useGradeOnLeave(revealed ? m.id : null, grade);

  const ruleLink = !!topic && (
    <TextButton onClick={() => setRuleOpen(true)} className="self-start">
      Lihat aturannya
    </TextButton>
  );

  return (
    <Card pad="lg" className="gap-5">
      <span className="text-[13px] font-semibold text-ink-3">
        Kesalahan{listen ? ` · ${cat.label}` : ""} · dari {m.source}
        {m.count > 1 ? `, ${m.count} kali` : ""}
      </span>

      {revealed ? (
        <>
          <span className="text-[15px] font-bold text-ink-2">
            {listen ? "Kalimat yang diputar" : <Marked parts={marked} />}
          </span>
          <div className="flex items-start gap-3">
            <span className="min-w-0 flex-1 text-[28px] leading-9 font-black tracking-[-0.015em] wrap-anywhere text-ink">
              {m.correct}
            </span>
            <SpeakButton text={m.correct} />
          </div>
          {!!meaning && (
            <span className="-mt-3 text-[15px] text-ink-2">{meaning}</span>
          )}
          <p
            role="status"
            className={classNames(
              "m-0 text-[15px] font-bold",
              result === "bad"
                ? "text-bad"
                : result === "near"
                  ? "text-warn"
                  : "text-ok",
            )}
          >
            {listen ? (
              result === "ok" ? (
                "Tepat. Semua kata benar."
              ) : result === "near" ? (
                `Hampir. ${slips} kata belum tepat.`
              ) : (
                "Belum tepat."
              )
            ) : result === "ok" ? (
              "Tepat."
            ) : (
              <>
                {result === "near" ? "Hampir. " : "Belum tepat. "}Kamu menulis{" "}
                <s className="decoration-2">{typed.trim()}</s>.
              </>
            )}
          </p>
          {listen && result !== "ok" && <Yours marks={marks} />}
          {listen && (
            <p className="m-0 text-[13.5px] text-ink-3">
              Dulu kamu menulis: <s className="decoration-2">{m.wrong}</s>
            </p>
          )}
          {!listen && !!m.explanation_id && (
            <p className="m-0 text-[14.5px] leading-[22px] text-ink">
              {m.explanation_id}
            </p>
          )}
          {!listen && ruleLink}
          {hasAi && (
            <TextButton onClick={askAi} className="self-start">
              Tanya AI soal ini
            </TextButton>
          )}
          {/* On a phone Lanjut stays above the bottom nav. */}
          <div className="flex flex-col gap-2 max-md:sticky max-md:bottom-[calc(76px+env(safe-area-inset-bottom))] max-md:-mx-1 max-md:bg-surface max-md:px-1 max-md:py-2">
            <Button
              variant="green"
              size="lg"
              autoFocus
              onClick={() => settle() && grade()}
              className="w-full"
            >
              Lanjut
            </Button>
            <span className="text-center text-[13px] font-semibold text-ink-3">
              {comesBack(how)}
            </span>
          </div>
        </>
      ) : (
        <>
          {listen ? (
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-semibold text-ink-2">
                Dengarkan, lalu tulis kalimatnya.
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="green" onClick={() => play(false)}>
                  <LuPlay aria-hidden size={16} />
                  {plays ? "Putar lagi" : "Putar"}
                </Button>
                <Button disabled={!plays} onClick={() => play(true)}>
                  <LuSnail aria-hidden size={16} />
                  Pelan
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-bold text-bad">
                {shown !== m.wrong
                  ? anyMarked
                    ? "Jawabanmu terakhir masih salah di bagian yang ditandai"
                    : "Jawabanmu terakhir masih salah"
                  : anyMarked
                    ? "Kalimat ini salah di bagian yang ditandai"
                    : "Kalimat ini salah"}
              </span>
              <p className="m-0 text-[28px] leading-9 font-black tracking-[-0.015em] wrap-anywhere text-ink">
                <Marked parts={marked} />
              </p>
              {!!meaning && (
                <span className="text-[15px] text-ink-2">{meaning}</span>
              )}
              {!!topic && (
                <span className="text-sm font-semibold text-ink-2">
                  Materi: <b className="font-extrabold text-ink">{topic}</b> ·{" "}
                  {ruleLink}
                </span>
              )}
            </div>
          )}

          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim() && !busy && !recording && !arming) onReveal();
            }}
          >
            <label htmlFor={`fix-${m.id}`} className="sr-only">
              {listen
                ? "Tulis yang kamu dengar"
                : "Tulis atau ucapkan versi yang benar"}
            </label>
            <div className="flex items-start gap-2">
              <Input
                id={`fix-${m.id}`}
                autoFocus={!listen}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={
                  listen ? "Tulis yang kamu dengar" : "Tulis versi yang benar"
                }
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
              {rec.supported && !listen && (
                <IconButton
                  aria-label={
                    busy
                      ? "Menuliskan suaramu…"
                      : recording
                        ? "Berhenti merekam"
                        : "Jawab dengan suara"
                  }
                  disabled={busy || arming || stopping}
                  onClick={() => {
                    setSttError(null);
                    if (recording) {
                      setStopAsked(true);
                      tailTimer.current = window.setTimeout(stop, TAIL_MS);
                    } else {
                      setAsked(true);
                      void rec.start();
                    }
                  }}
                  className={classNames(
                    "h-11 w-11 shrink-0",
                    recording && "border-bad-line! bg-bad-bg! text-bad!",
                  )}
                >
                  {busy || arming ? (
                    <LuLoaderCircle
                      aria-hidden
                      size={20}
                      className="animate-spin"
                    />
                  ) : recording ? (
                    <LuSquare aria-hidden size={18} />
                  ) : (
                    <LuMic aria-hidden size={20} />
                  )}
                </IconButton>
              )}
              <Button
                type="submit"
                variant="green"
                disabled={!typed.trim() || busy || recording || arming}
                className="shrink-0"
              >
                Cek
              </Button>
            </div>
            {arming && (
              <span
                role="status"
                className="text-[13px] font-semibold text-ink-2"
              >
                Menyiapkan mikrofon… tunggu tanda merah.
              </span>
            )}
            {recording && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-bad"
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 animate-pulse rounded-full bg-bad"
                />
                {stopping
                  ? "Menyelesaikan rekaman…"
                  : `Bicara sekarang · ${seconds} detik. Tekan lagi untuk berhenti.`}
              </span>
            )}
            {micNote && (
              <span role="status" className="text-[13px] font-bold text-ink-2">
                {micNote}
              </span>
            )}
          </form>
        </>
      )}

      {ruleOpen && <RuleSheet m={m} onClose={() => setRuleOpen(false)} />}
    </Card>
  );
};

export default MistakeReviewCard;
