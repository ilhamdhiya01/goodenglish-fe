"use client";

import classNames from "classnames";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { LuChevronDown, LuLoaderCircle, LuMic, LuSquare } from "react-icons/lu";

import Jalak from "@/components/brand/Jalak";
import WordTile from "@/components/shared/patterns/word-tile";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { FIELD_CLASS } from "@/components/ui/input/Input";
import Menu from "@/components/ui/menu";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import TextButton from "@/components/ui/text-button";
import { releaseSpeech } from "@/lib/helpers/speech.helper";
import {
  type RoleplayError,
  type useRoleplaySession,
} from "@/lib/hooks/roleplay/useRoleplaySession";
import { type SttLanguage, useSttLanguage } from "@/lib/hooks/useSttLanguage";
import {
  extensionOf,
  MAX_RECORD_SEC,
  type RecordedClip,
  type RecorderError,
  useInsecurePage,
  useVoiceRecorder,
} from "@/lib/hooks/useVoiceRecorder";
import type { Scenario } from "@/lib/types/scenario.types";

import MissionSteps from "../MissionSteps";

type Session = ReturnType<typeof useRoleplaySession>;

interface RoleplayChatProps {
  scenario: Scenario;
  session: Session;
  showText: boolean;
  onShowText: (on: boolean) => void;
  online: boolean;
}

const MIC_HELP: Record<Exclude<RecorderError, "denied">, string> = {
  "no-speech": "Suaramu tidak terdengar, coba lagi ya.",
  "no-mic": "Mikrofon tidak ditemukan. Ketik jawabanmu di kotak bawah, ya.",
  other: "Mikrofon sedang bermasalah. Coba lagi, atau ketik jawabanmu.",
};

// Shown when the browser refused the microphone: how to allow it again.
const MicDenied = ({ onClose }: { onClose: () => void }) => (
  <Card tone="dashed" pad="sm" className="gap-2" role="status">
    <span className="text-sm font-extrabold text-ink">
      Izin mikrofon ditolak, jadi sekarang pakai mode ketik.
    </span>
    <span className="text-[13px] leading-[18px] font-semibold text-ink-2">
      Cara mengaktifkannya lagi:
    </span>
    <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[13px] leading-[18px] text-ink-2">
      <li>
        <b>Chrome di komputer:</b> klik ikon di kiri alamat situs (gembok /
        pengaturan) → Mikrofon → Izinkan, lalu muat ulang halaman.
      </li>
      <li>
        <b>Chrome di HP:</b> ketuk ikon di kiri alamat situs → Izin → Mikrofon →
        Izinkan, lalu muat ulang halaman.
      </li>
      <li>
        <b>Safari di iPhone/iPad:</b> ketuk &quot;aA&quot; di kolom alamat →
        Pengaturan Situs Web → Mikrofon → Izinkan, lalu muat ulang halaman.
      </li>
      <li>
        <b>Safari di Mac:</b> Safari › Pengaturan untuk situs ini → Mikrofon →
        Izinkan.
      </li>
    </ul>
    <TextButton onClick={onClose} className="self-start">
      Mengerti
    </TextButton>
  </Card>
);

const clock = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

const LANGUAGE_NAME: Record<SttLanguage, string> = {
  en: "bahasa Inggris",
  id: "bahasa Indonesia",
};

// Pill-shaped button that opens a menu (EN ▾, Bantuan ▾).
const MENU_TRIGGER =
  "hit-44 inline-flex min-h-[38px] shrink-0 cursor-pointer items-center gap-1 rounded-full border-2 border-control bg-surface px-3 text-[13px] font-extrabold text-ink focus-ring hover:bg-sunken aria-expanded:bg-sunken disabled:cursor-not-allowed disabled:border-line disabled:bg-sunken disabled:text-ink-3";

// The conversation: bubbles (AI left, learner right), the mission checklist,
// then the answer box. The mic records the answer and the self-hosted
// Whisper writes it down verbatim (mistakes included: the summary corrects
// them later). The text lands in the box and is only sent with "Kirim", so
// the learner can read and fix it first; typing always works too.
const RoleplayChat = ({
  scenario,
  session: s,
  showText,
  onShowText,
  online,
}: RoleplayChatProps) => {
  const rp = scenario.roleplay!;
  const [draft, setDraft] = useState("");
  const [revealed, setRevealed] = useState<Record<number, true>>({});
  const listRef = useRef<HTMLOListElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const busy = s.pending !== null;
  const turnsUsedUp = s.userTurns >= s.maxTurns;
  const [language, setLanguage] = useSttLanguage();

  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<RoleplayError | null>(
    null,
  );
  // Kept so "Coba lagi" can resend it without recording again.
  const [lastClip, setLastClip] = useState<RecordedClip | null>(null);

  // Appended after what's already typed, with a space.
  const addToDraft = useCallback((text: string) => {
    setDraft((d) => (d.trim() ? d.trim() + " " : "") + text);
    boxRef.current?.focus();
  }, []);

  const { transcribe } = s;
  const writeDown = useCallback(
    async (clip: RecordedClip) => {
      setLastClip(clip);
      setTranscribeError(null);
      setTranscribing(true);
      try {
        const text = await transcribe(
          clip.blob,
          "answer." + extensionOf(clip.mimeType),
          language,
        );
        if (text) addToDraft(text);
        setLastClip(null);
      } catch (err) {
        setTranscribeError(err as RoleplayError);
      } finally {
        setTranscribing(false);
      }
    },
    [transcribe, addToDraft, language],
  );

  // The AI's voice must not end up in the recording, and on Safari a
  // running audio output can make the microphone record silence.
  const rec = useVoiceRecorder({
    onRecorded: writeDown,
    onBeforeRecord: releaseSpeech,
  });
  const listening = rec.recording;
  const insecure = useInsecurePage();

  // Keep the newest line in view.
  useEffect(() => {
    const el = listRef.current?.lastElementChild;
    el?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [s.transcript.length, s.pending]);

  const toggleMic = () => {
    setTranscribeError(null);
    if (rec.recording) rec.stop();
    else void rec.start();
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || busy || transcribing || listening) return;
    setDraft("");
    await s.send(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter is a new line (same as Tanya AI).
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  };

  const micNote = rec.error;
  const canMic = rec.supported && !rec.denied;
  const micState = transcribing
    ? "processing"
    : listening
      ? "recording"
      : "idle";

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex min-w-0 flex-col gap-4">
        <ol
          ref={listRef}
          aria-label="Percakapan"
          aria-live="polite"
          className="m-0 flex list-none flex-col gap-3 p-0"
        >
          {s.transcript.map((l, i) => {
            const ai = l.role === "ai";
            const hidden = ai && !showText && !revealed[i];
            return (
              <li
                key={i}
                className={classNames(
                  "flex flex-col gap-1",
                  ai ? "items-start" : "items-end",
                )}
              >
                <SectionLabel tone={ai ? "muted" : "green"}>
                  {ai ? "AI" : "KAMU"}
                </SectionLabel>
                <div
                  className={classNames(
                    "flex max-w-[88%] min-w-0 items-start gap-3 rounded-xl border-2 px-4 py-3 md:max-w-[80%]",
                    hidden
                      ? "border-dashed border-control bg-transparent"
                      : ai
                        ? "border-line bg-surface"
                        : "border-accent-line bg-accent-tint",
                  )}
                >
                  {hidden ? (
                    <TextButton
                      onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}
                    >
                      Dengarkan dulu, lalu klik untuk lihat teks
                    </TextButton>
                  ) : (
                    <span className="min-w-0 text-base leading-[22px] font-bold text-ink">
                      {l.text}
                    </span>
                  )}
                  {ai && <SpeakButton text={l.text} />}
                </div>
              </li>
            );
          })}
          {s.pending === "turn" && (
            <li className="flex items-center gap-2 text-sm font-bold text-ink-2">
              <Jalak mood="berpikir" size={48} />
              AI sedang menjawab…
            </li>
          )}
        </ol>

        {s.error && (
          <Card tone="redBg" pad="sm" className="gap-2" role="alert">
            <div className="flex items-center gap-3">
              <Jalak mood="sedih" size={48} className="shrink-0" />
              <span className="text-sm leading-5 font-bold text-ink">
                {s.error.message}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {s.error.retry && (
                <Button
                  size="sm"
                  variant="green"
                  disabled={busy}
                  onClick={s.retry}
                >
                  Coba lagi
                </Button>
              )}
              <Button size="sm" onClick={s.dismissError}>
                Tutup
              </Button>
            </div>
          </Card>
        )}

        {s.suggestions.length > 0 && (
          <Card tone="ink" pad="sm" className="gap-2">
            <SectionLabel tone="green">
              CONTOH JAWABAN · KLIK UNTUK PAKAI
            </SectionLabel>
            {s.suggestions.map((g) => (
              <div key={g.en} className="flex flex-wrap items-center gap-2">
                <WordTile
                  title="Pakai jawaban ini"
                  onClick={() => {
                    setDraft(g.en);
                    boxRef.current?.focus();
                  }}
                >
                  {g.en}
                </WordTile>
                <SpeakButton text={g.en} size={30} icon={14} />
                <span className="text-[13.5px] text-ink-2">{g.id}</span>
              </div>
            ))}
          </Card>
        )}

        {!rec.supported && (
          <span className="text-[13.5px] font-bold text-ink-2" role="status">
            {insecure
              ? "Mic hanya bisa dipakai kalau alamatnya diawali https:// (atau localhost). Buka aplikasi lewat alamat https, atau ketik jawabanmu."
              : "Browser ini belum bisa merekam suara. Ketik jawabanmu, atau buka lewat Chrome / Safari versi terbaru."}
          </span>
        )}
        {micNote === "denied" && <MicDenied onClose={rec.clearError} />}
        {micNote && micNote !== "denied" && (
          <span className="text-[13.5px] font-bold text-ink-2" role="status">
            {MIC_HELP[micNote]}
            {micNote === "other" && rec.errorCode && (
              <span className="font-mono text-[12px] text-ink-3">
                {" "}
                (kode: {rec.errorCode})
              </span>
            )}
          </span>
        )}
        {transcribeError && (
          <Card tone="redBg" pad="sm" className="gap-2" role="alert">
            <span className="text-sm leading-5 font-bold text-ink">
              {transcribeError.message}
            </span>
            <div className="flex flex-wrap gap-2">
              {transcribeError.retry !== null && lastClip && (
                <Button
                  size="sm"
                  variant="green"
                  disabled={transcribing}
                  onClick={() => void writeDown(lastClip)}
                >
                  Coba lagi
                </Button>
              )}
              <Button size="sm" onClick={() => setTranscribeError(null)}>
                Tutup
              </Button>
            </div>
          </Card>
        )}
        {!online && (
          <span className="text-[13.5px] font-bold text-bad" role="status">
            Kamu sedang offline. Percakapanmu tetap tersimpan di layar; kirim
            lagi setelah tersambung.
          </span>
        )}

        <div className="sticky bottom-[calc(84px+env(safe-area-inset-bottom))] z-10 flex flex-col gap-2 rounded-xl border-2 border-line bg-paper p-3 shadow-sm md:bottom-4">
          {/* Top line: progress on the left, ending the session on the right
              (kept visible, not tucked into a menu). */}
          <div className="flex items-center justify-between gap-2">
            {/* The side panel shows it on wide screens. */}
            <span className="text-[12.5px] font-extrabold text-ink-2 tabular-nums lg:invisible">
              Giliran {s.userTurns}/{s.maxTurns}
            </span>
            <TextButton
              disabled={busy}
              onClick={() => void s.end()}
              className="min-h-11"
            >
              {s.pending === "finish" ? "Merangkum…" : "Selesai"}
            </TextButton>
          </div>
          <textarea
            ref={boxRef}
            rows={2}
            value={draft}
            readOnly={listening || transcribing}
            maxLength={600}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={turnsUsedUp}
            aria-label="Jawabanmu"
            placeholder={
              transcribing
                ? "Menuliskan ucapanmu…"
                : listening
                  ? `Mendengarkan… bicara dalam ${LANGUAGE_NAME[language]}`
                  : canMic
                    ? "Tekan mikrofon atau ketik jawabanmu"
                    : "Ketik jawabanmu"
            }
            className={classNames(FIELD_CLASS, "min-h-12 resize-none")}
          />
          <div className="flex items-center gap-2">
            {canMic && (
              <button
                type="button"
                onClick={toggleMic}
                disabled={busy || transcribing || turnsUsedUp}
                aria-pressed={listening}
                aria-busy={transcribing}
                aria-label={
                  micState === "recording"
                    ? "Berhenti merekam"
                    : micState === "processing"
                      ? "Menuliskan ucapanmu"
                      : "Bicara (mikrofon)"
                }
                title={listening ? "Berhenti merekam" : "Bicara"}
                data-state={micState}
                className={classNames(
                  "hit-44 inline-flex h-12 w-12 shrink-0 press cursor-pointer items-center justify-center rounded-full border-2 edge focus-ring disabled:cursor-not-allowed",
                  micState === "recording"
                    ? "animate-pulse border-bad-edge bg-bad text-on-accent [--edge:var(--color-bad-edge)]"
                    : micState === "processing"
                      ? "border-line bg-sunken text-ink-2"
                      : "border-accent-edge bg-accent text-on-accent disabled:opacity-50",
                )}
              >
                {micState === "recording" ? (
                  <LuSquare aria-hidden size={18} />
                ) : micState === "processing" ? (
                  <LuLoaderCircle
                    aria-hidden
                    size={22}
                    className="animate-spin"
                  />
                ) : (
                  <LuMic aria-hidden size={22} />
                )}
              </button>
            )}
            {/* The language spoken into the mic (never auto-detected). */}
            {canMic && (
              <Menu
                label="Bahasa jawaban"
                side="top"
                align="start"
                button={(p) => (
                  <button
                    type="button"
                    {...p}
                    disabled={listening || transcribing}
                    aria-label={`Bahasa jawaban: ${LANGUAGE_NAME[language]}`}
                    title="Bahasa yang kamu ucapkan ke mikrofon"
                    className={MENU_TRIGGER}
                  >
                    {language.toUpperCase()}
                    <LuChevronDown aria-hidden size={14} />
                  </button>
                )}
              >
                <Menu.Item
                  selected={language === "en"}
                  hint="Untuk jawaban dalam bahasa Inggris"
                  onSelect={() => setLanguage("en")}
                >
                  Inggris (EN)
                </Menu.Item>
                <Menu.Item
                  selected={language === "id"}
                  hint="Kalau kamu menjawab dalam bahasa Indonesia"
                  onSelect={() => setLanguage("id")}
                >
                  Indonesia (ID)
                </Menu.Item>
              </Menu>
            )}
            <Menu
              label="Bantuan"
              side="top"
              // Opens leftwards so it stays on screen on narrow phones.
              align="end"
              button={(p) => (
                <button type="button" {...p} className={MENU_TRIGGER}>
                  {s.pending === "help" ? "Mencari…" : "Bantuan"}
                  <LuChevronDown aria-hidden size={14} />
                </button>
              )}
            >
              <Menu.Item
                disabled={busy || s.helpLeft === 0 || turnsUsedUp}
                hint="2 contoh jawaban singkat"
                onSelect={() => void s.help()}
              >
                Bantu aku
              </Menu.Item>
              <Menu.Item
                disabled={!s.lastAi}
                hint="Putar lagi ucapan AI"
                onSelect={() => s.replay()}
              >
                Ulangi
              </Menu.Item>
              <Menu.Item
                disabled={!s.lastAi}
                hint="Putar lagi lebih pelan"
                onSelect={() => s.replay(true)}
              >
                Lebih pelan
              </Menu.Item>
            </Menu>
            <Button
              variant="green"
              className="ml-auto"
              disabled={
                busy ||
                listening ||
                transcribing ||
                !draft.trim() ||
                turnsUsedUp
              }
              onClick={() => void send()}
            >
              Kirim
            </Button>
          </div>
          {listening && (
            <span
              className="flex items-center gap-2 text-[12.5px] font-bold text-ink-2"
              role="status"
            >
              <span
                aria-hidden
                className="h-2 w-2 animate-pulse rounded-full bg-bad"
              />
              <span className="tabular-nums">
                {clock(rec.seconds)} / {clock(MAX_RECORD_SEC)}
              </span>
              Merekam ({LANGUAGE_NAME[language]})… tekan kotak merah kalau sudah
              selesai.
            </span>
          )}
          {transcribing && (
            <span className="text-[12.5px] font-bold text-ink-2" role="status">
              Menuliskan ucapanmu…
            </span>
          )}
          {!listening && !transcribing && draft && canMic && (
            <span className="text-[12.5px] font-semibold text-ink-3">
              Periksa dulu teksnya. Kalau ada kata yang salah dengar, perbaiki
              sebelum dikirim.
            </span>
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--shell-top)+24px)]">
        <Card className="gap-3">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel tone="green">MISI</SectionLabel>
            <span className="text-[12.5px] font-extrabold text-ink-2 tabular-nums">
              Giliran {s.userTurns}/{s.maxTurns}
            </span>
          </div>
          <span className="text-[13.5px] leading-[19px] font-bold text-ink">
            {rp.missionId}
          </span>
          <MissionSteps steps={rp.steps} done={s.stepsDone} />
        </Card>
        <Pill
          size="sm"
          check
          on={showText}
          onClick={() => onShowText(!showText)}
        >
          Tampilkan teks ucapan AI
        </Pill>
        <span className="text-[13px] leading-[18px] font-semibold text-ink-2">
          Peranmu: <b className="text-ink">{rp.roleUser}</b>. AI:{" "}
          <b className="text-ink">{rp.roleAi}</b>.
        </span>
      </aside>
    </div>
  );
};

export default RoleplayChat;
