"use client";

import type { AxiosError } from "axios";
import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import { LuLoaderCircle, LuMic, LuSquare } from "react-icons/lu";

import TargetMark from "@/components/shared/patterns/target-mark";
import WordMarks from "@/components/shared/patterns/word-marks";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import SpeakButton from "@/components/ui/speak-button";
import TextButton from "@/components/ui/text-button";
import { accessErrorText } from "@/const/access.constant";
import {
  checkDictation,
  normalizeTokens,
  same,
} from "@/lib/helpers/dictation.helper";
import { releaseSpeech, speak } from "@/lib/helpers/speech.helper";
import {
  extensionOf,
  type RecordedClip,
  useVoiceRecorder,
} from "@/lib/hooks/useVoiceRecorder";
import type { ErrorResponse } from "@/lib/types/api.types";
import { transcribeAudio } from "@/services/stt.service";
import { useAccessStore } from "@/stores/useAccessStore";

// Saying an expression takes a few seconds; stop by itself after this.
const SAY_MAX_SEC = 8;
// Recorded on after Berhenti, so the last word isn't cut off.
const TAIL_MS = 400;

export type ProofMode = "type" | "say";

/** Words are typed; expressions and openers are said aloud, or typed
 * ("Ketik saja"). */
export const proofMode = (type: string, en: string): ProofMode =>
  type === "ex" || type === "st" || !/[a-z]/i.test(en) ? "say" : "type";

/** The answer with its final full stop etc. dropped, for "Jawabannya X." */
const bare = (en: string) => en.replace(/[.!?…]+$/, "");

// Letters and digits only: "I'll be there." → "illbethere".
const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

const editDistance = (a: string, b: string) => {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    prev = row;
  }
  return prev[b.length];
};

// Phone keyboards make apostrophes a chore: a typed "ill" / "dont" / "im"
// counts as the answer's "I'll" / "don't" / "I'm".
const withApostrophes = (en: string, typed: string) => {
  const short = new Map(
    en
      .toLowerCase()
      .replace(/[‘’`]/g, "'")
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9']/g, ""))
      .filter((w) => w.includes("'"))
      .map((w) => [w.replace(/'/g, ""), w] as const),
  );
  return typed
    .split(/\s+/)
    .map((w) => short.get(w.toLowerCase().replace(/[^a-z0-9]/g, "")) ?? w)
    .join(" ");
};

// The blank of a pattern card ("What does … mean?", "My name is …").
const SLOT = /…|\.{3}/;

// Typed words = the pattern's words around each blank, in order, with any
// words (or none) in the blanks.
const fillsSlots = (en: string, typed: string) => {
  const parts = en.split(SLOT).map(normalizeTokens);
  const words = normalizeTokens(typed);
  const fits = (k: number, from: number): boolean => {
    const part = parts[k];
    const last = k === parts.length - 1;
    for (let at = from; at + part.length <= words.length; at++) {
      if (part.every((t, n) => same(t, words[at + n])))
        if (
          last
            ? at + part.length === words.length
            : fits(k + 1, at + part.length)
        )
          return true;
      if (k === 0) return false;
    }
    return false;
  };
  return fits(0, 0);
};

export type TypedResult = "ok" | "near" | "bad";

/**
 * ok: every word right, ignoring case and punctuation (checkDictation also
 * takes I'm = I am and 10 = ten); a "…" may be filled with any words or left
 * out. near: a slip, one letter per 12 ("leson"), none under 5 letters.
 * bad: anything else.
 */
export const judgeTyped = (en: string, typed: string): TypedResult => {
  if (SLOT.test(en)) {
    if (fillsSlots(en, withApostrophes(en, typed))) return "ok";
    // shortcut: a slip next to a filled blank ("what dose it mean") is bad,
    // not near; align the words first if learners hit that.
    en = en.split(SLOT).join(" ");
  }
  const { marks } = checkDictation(en, withApostrophes(en, typed));
  if (marks.length && marks.every((m) => m.kind === "correct")) return "ok";
  const want = flat(en);
  const slips = want.length >= 5 ? Math.ceil(want.length / 12) : 0;
  return editDistance(want, flat(typed)) <= slips ? "near" : "bad";
};

// Words Whisper writes one way for the same sound: not the learner's fault.
const HOMOPHONES = [
  ["there", "their", "theyre"],
  ["to", "too", "two"],
  ["your", "youre"],
  ["here", "hear"],
  ["know", "no"],
  ["right", "write"],
  ["where", "wear"],
  ["weather", "whether"],
  ["by", "buy", "bye"],
  ["for", "four"],
  ["one", "won"],
  ["meet", "meat"],
  ["week", "weak"],
  ["see", "sea"],
  ["new", "knew"],
  ["hour", "our"],
];
const soundsSame = (heard: string, expected: string) => {
  const a = flat(heard);
  const b = flat(expected);
  if (a === b) return true;
  if (HOMOPHONES.some((g) => g.includes(a) && g.includes(b))) return true;
  // One letter off in a longer word ("lot" must stay exact, "minutes" may
  // come back as "minute").
  return b.length >= 4 && editDistance(a, b) <= 1;
};

/** Whether what Whisper heard is the expression: every one of its words,
 * as strict as typing it ("work" for "worked" fails). Homophones and
 * one-letter slips in longer words count as right, since those are how
 * Whisper mishears; extra words (the expression said in a sentence) are fine. */
export const heardRight = (en: string, heard: string) => {
  if (!heard.trim()) return false;
  const { marks } = checkDictation(en, heard);
  return (
    marks.some((m) => m.kind !== "extra") &&
    marks.every(
      (m) =>
        m.kind === "correct" ||
        m.kind === "extra" ||
        (m.kind === "wrong" && soundsSame(m.word, m.expected)),
    )
  );
};

const MIC_HELP = {
  denied: "Izin mikrofon ditolak.",
  "no-speech": "Suaramu tidak terdengar, coba lagi ya.",
  "no-mic": "Mikrofon tidak ditemukan.",
  other: "Mikrofon sedang bermasalah.",
} as const;

interface Props {
  en: string;
  /** Indonesian meaning: the prompt. */
  id: string;
  type: string;
  ex?: string;
  /** Where the word sits in `ex` ([start, end]), blanked out while asking. */
  target?: [number, number] | null;
  exId?: string;
  /** Proved: mark the word known. */
  onDone: () => void;
  onCancel: () => void;
}

const msgClass = "text-[13px] leading-[18px]";

/** Where the answer sits in the example when the card's own match missed
 * it: "What's the weather like?" in "What's the weather like in Bandung?"
 * (case, curly apostrophes and the answer's final ?/./! ignored). */
export const looseTarget = (
  ex: string | undefined,
  en: string,
): [number, number] | null => {
  if (!ex) return null;
  const norm = (s: string) => s.toLowerCase().replace(/[‘’`]/g, "'");
  const want = norm(en.trim().replace(/[.!?…,]+$/, ""));
  const at = want ? norm(ex).indexOf(want) : -1;
  return at < 0 ? null : [at, at + want.length];
};

// The example sentence with the word blanked out (showing what is being
// typed), or marked once proved. Without a blank to make it is left out
// until proved: shown whole it would give the answer away.
const Example = ({
  ex,
  target,
  proved,
  fill,
}: Pick<Props, "ex" | "target"> & { proved: boolean; fill?: string }) =>
  !ex || (!target && !proved) ? null : (
    <p className="m-0 text-[14px] leading-[20px] text-pretty text-ink-2">
      {target ? (
        <>
          {ex.slice(0, target[0])}
          {proved ? (
            <TargetMark sweep>{ex.slice(target[0], target[1])}</TargetMark>
          ) : (
            <span
              aria-hidden={!!fill}
              aria-label={fill ? undefined : "kosong"}
              className="inline-block min-w-[3.2em] border-b-2 border-dashed border-accent align-baseline font-extrabold text-accent-edge"
            >
              {fill || " "}
            </span>
          )}
          {ex.slice(target[1])}
        </>
      ) : (
        ex
      )}
    </p>
  );

// The word card's two grid cells: content (left) and actions (right).
const Layout = ({
  head,
  id,
  ex,
  target,
  exId,
  proved,
  fill,
  message,
  actions,
}: Pick<Props, "id" | "ex" | "target" | "exId"> & {
  head: React.ReactNode;
  proved: boolean;
  fill?: string;
  message: React.ReactNode;
  actions: React.ReactNode;
}) => (
  <>
    <div className="flex min-w-0 flex-col gap-1.5 md:gap-2">
      <div className="flex min-h-10 flex-wrap items-center gap-x-2.5 gap-y-1">
        {head}
      </div>
      <p className="m-0 text-[15px] leading-[22px] font-extrabold text-pretty text-ink">
        {id}
      </p>
      <Example ex={ex} target={target} proved={proved} fill={fill} />
      {!!exId && proved && (
        <span className="-mt-1 text-[13.5px] leading-[19px] text-pretty text-ink-2">
          {exId}
        </span>
      )}
      <div role="status" className="min-h-[18px]">
        {message}
      </div>
    </div>
    <div className="flex flex-row-reverse items-center justify-between gap-2 md:col-start-2 md:row-start-1 md:flex-col md:items-stretch">
      {actions}
    </div>
  </>
);

const Covered = () => (
  <span className="inline-flex h-9 items-center gap-2 rounded-md bg-chip px-3.5 text-sm font-extrabold text-ink-3">
    <span aria-hidden="true" className="tracking-[0.25em]">
      ●●●
    </span>
    Kata Inggrisnya?
  </span>
);

const Shown = ({ en }: { en: string }) => (
  <>
    <span className="text-xl leading-[26px] font-black wrap-anywhere text-ink">
      {en}
    </span>
    <SpeakButton text={en} />
  </>
);

// Typed into one field where the word's title was, checked with Enter or
// Cek. What is typed shows up in the example's blank as it is typed.
// `switchLink` is SayProof's "Pakai suara".
const TypeProof = ({
  switchLink,
  ...props
}: Props & { switchLink?: React.ReactNode }) => {
  const { en, id, onDone, onCancel } = props;
  const phrase = /\s/.test(en.trim());
  const first = en.trim()[0] ?? "";
  const hasDigits = /\d/.test(en);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<TypedResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneTimer = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
    return () => clearTimeout(doneTimer.current);
  }, []);

  const check = () => {
    if (!typed.trim() || result) return;
    const r = judgeTyped(en, typed);
    setResult(r);
    if (r === "bad") return;
    speak(en);
    doneTimer.current = window.setTimeout(onDone, r === "near" ? 1600 : 900);
  };
  const retry = () => {
    setTyped("");
    setResult(null);
    inputRef.current?.focus();
  };
  const proved = result === "ok" || result === "near";

  return (
    <Layout
      {...props}
      head={
        <form
          className="w-full max-w-[420px]"
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
        >
          <Input
            ref={inputRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            readOnly={!!result}
            placeholder={
              phrase ? "Ketik ungkapan Inggrisnya…" : "Ketik kata Inggrisnya…"
            }
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label={`Ketik ${phrase ? "ungkapan" : "kata"} Inggris untuk "${id}"`}
            aria-invalid={result === "bad"}
            className={classNames(
              result === "bad" && "animate-[nudge_240ms_ease-in-out]",
              proved && "border-ok bg-ok-bg",
            )}
          />
        </form>
      }
      proved={proved}
      fill={result ? undefined : typed}
      message={
        result === "bad" ? (
          <div className="flex flex-col gap-1">
            {phrase && <WordMarks marks={checkDictation(en, typed).marks} />}
            <span className={classNames(msgClass, "font-bold text-bad")}>
              Jawabannya <b className="font-extrabold">{bare(en)}</b>.{" "}
              <TextButton tone="red" onClick={retry}>
                Coba lagi
              </TextButton>
            </span>
          </div>
        ) : result === "near" ? (
          <span className={classNames(msgClass, "font-bold text-ok")}>
            ✓ Hampir, ejaannya <b className="font-extrabold">{bare(en)}</b>.
          </span>
        ) : result === "ok" ? (
          <span className={classNames(msgClass, "font-extrabold text-ok")}>
            ✓ Tepat!
          </span>
        ) : (
          <span className={classNames(msgClass, "font-semibold text-ink-2")}>
            Diawali &ldquo;{first}&rdquo;.{" "}
            {hasDigits && "Angka boleh ditulis 10 atau ten. "}
            {switchLink}
          </span>
        )
      }
      actions={
        <>
          <Button
            size="sm"
            variant="accent"
            className="max-md:flex-1"
            disabled={!typed.trim() || !!result}
            onClick={check}
          >
            Cek
          </Button>
          <TextButton onClick={onCancel} className="self-center">
            Batal
          </TextButton>
        </>
      }
    />
  );
};

// Expressions and openers: said into the microphone (written down by the
// self-hosted Whisper, POST /stt/transcribe, and matched word by word) or
// typed like any word. Typing is always there: in a crowded place the
// learner picks "Ketik saja" once and it sticks; without a usable microphone
// (no permission, plain http, no Ulang menu for the STT endpoint) it is the
// only way.
const INPUT_KEY = "ge-proof-input";
type SayInput = "voice" | "type";
const savedInput = (): SayInput => {
  try {
    return localStorage.getItem(INPUT_KEY) === "type" ? "type" : "voice";
  } catch {
    return "voice";
  }
};
const saveInput = (v: SayInput) => {
  try {
    localStorage.setItem(INPUT_KEY, v);
  } catch {
    /* private mode — just not remembered */
  }
};

const SayProof = (props: Props) => {
  const { en, onDone, onCancel } = props;
  const canTranscribe = useAccessStore(
    (s) => !!s.session?.menus.includes("review"),
  );
  const [input, setInput] = useState<SayInput>(savedInput);
  const [busy, setBusy] = useState(false);
  // What Whisper wrote down, once matched.
  const [heard, setHeard] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  // Rekam / Berhenti pressed; the states they lead to are derived below.
  const [asked, setAsked] = useState(false);
  const [stopAsked, setStopAsked] = useState(false);
  const doneTimer = useRef(0);
  const tailTimer = useRef(0);

  const match = async (clip: RecordedClip) => {
    setAsked(false);
    setStopAsked(false);
    setBusy(true);
    setSttError(null);
    try {
      const r = await transcribeAudio(
        clip.blob,
        "say." + extensionOf(clip.mimeType),
        "en",
        en,
      );
      const text = r.data.text?.trim() ?? "";
      if (!text) {
        setSttError(accessErrorText("stt_no_speech"));
        return;
      }
      setHeard(text);
      if (heardRight(en, text)) {
        setPassed(true);
        speak(en);
        doneTimer.current = window.setTimeout(onDone, 1400);
      }
    } catch (err) {
      setSttError(
        accessErrorText((err as AxiosError<ErrorResponse>).message ?? ""),
      );
    } finally {
      setBusy(false);
    }
  };
  const rec = useVoiceRecorder({
    onRecorded: (c) => void match(c),
    onBeforeRecord: releaseSpeech,
  });
  const { recording, seconds, stop } = rec;
  useEffect(() => {
    if (recording && seconds >= SAY_MAX_SEC) stop();
  }, [recording, seconds, stop]);
  // Mic asked for but not recording yet: speaking now would be lost.
  const arming = asked && !recording && !rec.error;
  // Berhenti pressed: the tail is still being recorded.
  const stopping = stopAsked && recording;
  useEffect(
    () => () => {
      clearTimeout(doneTimer.current);
      clearTimeout(tailTimer.current);
    },
    [],
  );
  // People stop talking and press Berhenti at the same moment: keep
  // recording a little longer so the last word isn't cut off.
  const finish = () => {
    setStopAsked(true);
    tailTimer.current = window.setTimeout(stop, TAIL_MS);
  };

  const micOk = canTranscribe && rec.supported && !rec.denied;
  const voice = micOk && input === "voice";
  const failed = heard !== null && !passed;

  const switchTo = (v: SayInput) => {
    if (recording) stop();
    saveInput(v);
    setInput(v);
    setHeard(null);
    setSttError(null);
    rec.clearError();
  };

  if (!voice)
    return (
      <TypeProof
        {...props}
        switchLink={
          micOk && (
            <TextButton onClick={() => switchTo("voice")}>
              Pakai suara
            </TextButton>
          )
        }
      />
    );

  const micNote = rec.error ? MIC_HELP[rec.error] : sttError;
  const typeLink = (
    <TextButton onClick={() => switchTo("type")}>Ketik saja</TextButton>
  );
  return (
    <Layout
      {...props}
      head={passed || failed ? <Shown en={en} /> : <Covered />}
      proved={passed}
      message={
        arming ? (
          <span className={classNames(msgClass, "font-semibold text-ink-2")}>
            Menyiapkan mikrofon… tunggu tanda merah.
          </span>
        ) : recording ? (
          <span
            className={classNames(
              msgClass,
              "inline-flex items-center gap-1.5 font-bold text-bad",
            )}
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 animate-pulse rounded-full bg-bad"
            />
            {stopping
              ? "Menyelesaikan rekaman…"
              : `Bicara sekarang · ${seconds} detik. Tekan Berhenti kalau sudah.`}
          </span>
        ) : busy ? (
          <span className={classNames(msgClass, "font-semibold text-ink-2")}>
            Mencocokkan suaramu…
          </span>
        ) : passed ? (
          <span className={classNames(msgClass, "font-extrabold text-ok")}>
            ✓ Tepat! Terdengar &ldquo;{heard}&rdquo;
          </span>
        ) : micNote ? (
          <span className={classNames(msgClass, "font-bold text-ink-2")}>
            {micNote} {typeLink}
          </span>
        ) : failed ? (
          <div className="flex flex-col gap-1">
            <span className={classNames(msgClass, "font-bold text-bad")}>
              Belum cocok. Yang terdengar:
            </span>
            <WordMarks marks={checkDictation(en, heard ?? "").marks} />
          </div>
        ) : (
          <span className={classNames(msgClass, "font-semibold text-ink-2")}>
            Tekan Rekam, tunggu tanda merah, lalu ucapkan ungkapannya. Dekatkan
            HP dan bicara biasa saja. {typeLink}
          </span>
        )
      }
      actions={
        <>
          <Button
            size="sm"
            variant={recording ? "danger" : "accent"}
            className="max-md:flex-1"
            disabled={busy || passed || arming || stopping}
            onClick={() => {
              setSttError(null);
              rec.clearError();
              if (recording) finish();
              else {
                setHeard(null);
                setAsked(true);
                void rec.start();
              }
            }}
          >
            {busy || arming ? (
              <LuLoaderCircle aria-hidden size={16} className="animate-spin" />
            ) : recording ? (
              <LuSquare aria-hidden size={14} />
            ) : (
              <LuMic aria-hidden size={16} />
            )}
            {recording ? "Berhenti" : failed ? "Rekam lagi" : "Rekam"}
          </Button>
          <TextButton
            onClick={onCancel}
            disabled={recording || arming}
            className="self-center"
          >
            Batal
          </TextButton>
        </>
      }
    />
  );
};

// "Tandai hafal" asks first. Fills the word card's two grid cells (content and
// button), so the card keeps its shape and only the word and the button
// change. The English word is hidden; the learner recalls it from the meaning
// and the example sentence.
const KnownProof = (props: Props) => {
  const p = {
    ...props,
    target: props.target ?? looseTarget(props.ex, props.en),
  };
  return proofMode(p.type, p.en) === "type" ? (
    <TypeProof {...p} />
  ) : (
    <SayProof {...p} />
  );
};

export default KnownProof;
