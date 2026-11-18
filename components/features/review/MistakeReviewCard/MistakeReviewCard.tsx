"use client";

import type { AxiosError } from "axios";
import classNames from "classnames";
import Link from "next/link";
import React, { useState } from "react";
import {
  LuBookOpen,
  LuLoaderCircle,
  LuMic,
  LuPlay,
  LuSnail,
  LuSquare,
} from "react-icons/lu";

import WordMarks from "@/components/shared/patterns/word-marks";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import IconButton from "@/components/ui/icon-button";
import Input from "@/components/ui/input";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import { accessErrorText } from "@/const/access.constant";
import { categoryOf, learnHref } from "@/const/mistake-categories.constant";
import { GAPS } from "@/const/srs.constant";
import { checkDictation } from "@/lib/helpers/dictation.helper";
import { normSentence } from "@/lib/helpers/mistakes.helper";
import { releaseSpeech, speak } from "@/lib/helpers/speech.helper";
import {
  extensionOf,
  type RecordedClip,
  useVoiceRecorder,
} from "@/lib/hooks/useVoiceRecorder";
import type { ErrorResponse } from "@/lib/types/api.types";
import type { MistakeRecord } from "@/lib/types/mistake.types";
import { transcribeAudio } from "@/services/stt.service";

const MIC_HELP = {
  denied:
    "Izin mikrofon ditolak. Izinkan mikrofon untuk situs ini di pengaturan browser, atau ketik jawabanmu.",
  "no-speech": "Suaramu tidak terdengar, coba lagi ya.",
  "no-mic": "Mikrofon tidak ditemukan. Ketik jawabanmu, ya.",
  other: "Mikrofon sedang bermasalah. Coba lagi, atau ketik jawabanmu.",
} as const;

interface Props {
  m: MistakeRecord;
  revealed: boolean;
  onReveal: () => void;
  /** Lupa / Ragu / Ingat, shared with word cards. */
  answers: React.ReactNode;
}

const SLOW = 0.6;

// "Betulkan kalimat": the learner's old wrong sentence; they say or type
// the right one, open the answer (Space / Enter), then rate it like a word
// card. Not graded automatically: the learner compares and decides.
// A Dikte mistake was misheard, so its card is "dengar & tulis ulang": the
// sentence is played (not shown), and the answer is marked word by word.
const MistakeReviewCard = ({ m, revealed, onReveal, answers }: Props) => {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);

  const writeDown = async (clip: RecordedClip) => {
    setBusy(true);
    setSttError(null);
    try {
      const r = await transcribeAudio(
        clip.blob,
        "answer." + extensionOf(clip.mimeType),
        "en",
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
  const listen = m.source === "Dikte" || m.category === "menyimak";
  const [plays, setPlays] = useState(0);
  const play = (slow: boolean) => {
    speak(m.correct, slow ? { speed: SLOW } : undefined);
    setPlays((n) => n + 1);
  };
  const micNote = rec.error ? MIC_HELP[rec.error] : sttError;
  const same =
    !!typed.trim() && normSentence(typed) === normSentence(m.correct);
  const cat = categoryOf(m.category);

  return (
    <Card pad="lg" className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <SectionLabel tone="red">
          {listen ? "DENGAR & TULIS ULANG" : "BETULKAN KALIMAT"} · {cat.label}
        </SectionLabel>
        <span className="flex items-center gap-2.5 text-[13.5px] font-bold text-ink-2">
          Tahap {m.srs.st + 1} dari {GAPS.length}
          <span aria-hidden className="flex gap-1">
            {GAPS.map((_, i) => (
              <span
                key={i}
                className={classNames(
                  "h-1.5 w-5 rounded-full",
                  i <= m.srs.st ? "bg-accent" : "bg-track",
                )}
              />
            ))}
          </span>
        </span>
      </div>

      {listen ? (
        <div className="flex flex-col gap-2.5">
          <span className="text-[13.5px] leading-[19px] font-bold text-ink-2">
            Kalimat ini pernah salah kamu tulis di Dikte
            {m.count > 1 ? ` (${m.count} kali)` : ""}. Dengarkan lagi.
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
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-ink-2">
            Kalimat ini salah ({m.source}
            {m.count > 1 ? `, terjadi ${m.count} kali` : ""}):
          </span>
          <p className="m-0 text-2xl leading-8 font-black wrap-anywhere text-ink md:text-[28px] md:leading-9">
            <span aria-hidden className="mr-2 text-bad">
              ✕
            </span>
            {m.wrong}
          </p>
        </div>
      )}

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          // Out of the field, so 1 / 2 / 3 answer right away.
          (document.activeElement as HTMLElement | null)?.blur();
          if (!revealed) onReveal();
        }}
      >
        <label
          htmlFor={`fix-${m.id}`}
          className="text-sm font-semibold text-ink-2"
        >
          {listen
            ? "Tulis yang kamu dengar, lalu buka jawaban."
            : "Ucapkan atau ketik versi yang benar, lalu buka jawaban."}
        </label>
        <div className="flex items-start gap-2">
          <Input
            id={`fix-${m.id}`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={listen ? "Tulis yang kamu dengar…" : "Versi benarmu…"}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            readOnly={revealed}
          />
          {rec.supported && !revealed && !listen && (
            <IconButton
              aria-label={
                busy
                  ? "Menuliskan suaramu…"
                  : rec.recording
                    ? "Berhenti merekam"
                    : "Jawab dengan suara"
              }
              disabled={busy}
              onClick={() => {
                setSttError(null);
                if (rec.recording) rec.stop();
                else void rec.start();
              }}
              className={classNames(
                "h-11 w-11 shrink-0",
                rec.recording && "border-bad-line! bg-bad-bg! text-bad!",
              )}
            >
              {busy ? (
                <LuLoaderCircle
                  aria-hidden
                  size={20}
                  className="animate-spin"
                />
              ) : rec.recording ? (
                <LuSquare aria-hidden size={18} />
              ) : (
                <LuMic aria-hidden size={20} />
              )}
            </IconButton>
          )}
        </div>
        {rec.recording && (
          <span role="status" className="text-[13px] font-bold text-bad">
            Merekam… {rec.seconds} detik. Tekan lagi untuk berhenti.
          </span>
        )}
        {micNote && (
          <span role="status" className="text-[13px] font-bold text-ink-2">
            {micNote}
          </span>
        )}
        {!revealed && (
          <Button
            type="submit"
            variant="green"
            size="lg"
            aria-keyshortcuts="Space"
            className="md:w-full"
          >
            Buka jawaban
          </Button>
        )}
      </form>

      {revealed && (
        <>
          <div className="flex flex-col gap-2 border-t-2 border-dashed border-line pt-4">
            <span className="flex items-start gap-2 text-xl leading-7 font-black text-ink">
              <span aria-hidden className="text-ok">
                ✓
              </span>
              <span className="sr-only">Yang benar: </span>
              <span className="min-w-0 flex-1">{m.correct}</span>
              <SpeakButton text={m.correct} />
            </span>
            {!!m.explanation_id && (
              <span className="text-[14.5px] leading-[21px] text-ink">
                {m.explanation_id}
              </span>
            )}
            {listen && !!typed.trim() && (
              <div className="flex flex-col gap-1">
                <span className="text-[12.5px] font-extrabold tracking-[0.06em] text-ink-2">
                  TULISANMU SEKARANG
                </span>
                <WordMarks marks={checkDictation(m.correct, typed).marks} />
              </div>
            )}
            {listen && (
              <span className="text-[13.5px] text-ink-2">
                <span className="font-extrabold">Tulisanmu dulu: </span>
                <s className="decoration-bad decoration-2">{m.wrong}</s>
              </span>
            )}
            {!listen && !!typed.trim() && (
              <span className="text-[13.5px] text-ink-2">
                <span className="font-extrabold">Jawabanmu: </span>
                {typed.trim()}
                {same && (
                  <span className="ml-1.5 font-extrabold text-ok">
                    · ✓ sama dengan jawaban benar
                  </span>
                )}
              </span>
            )}
            <Link
              href={learnHref(m.category)}
              className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-extrabold text-accent-edge focus-ring hover:underline"
            >
              <LuBookOpen aria-hidden size={15} />
              Pelajari aturannya
            </Link>
          </div>
          {answers}
        </>
      )}
    </Card>
  );
};

export default MistakeReviewCard;
