"use client";

import classNames from "classnames";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { LuArrowLeft, LuLanguages, LuPause, LuPlay } from "react-icons/lu";

import Jalak from "@/components/brand/Jalak";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import PageHeading from "@/components/ui/page-heading";
import SectionLabel from "@/components/ui/section-label";
import { LEVELS } from "@/const/levels.constant";
import {
  pieces,
  readingMinutes,
  splitSentences,
  vocabIndex,
} from "@/lib/helpers/reading.helper";
import { speakAll, stopSpeaking } from "@/lib/helpers/speech.helper";
import type { SaveWordResult } from "@/lib/helpers/word-card.helper";
import { useReadingTexts } from "@/lib/hooks/reading/useReading";
import { useShellData } from "@/lib/hooks/useShellData";
import { useSpeaking } from "@/lib/hooks/useSpeaking";
import type { ReadingResult, ReadingText } from "@/lib/types/reading.types";
import type { LevelId } from "@/lib/types/session.types";
import type { Item } from "@/lib/types/vocab.types";
import { ROUTES } from "@/routes";
import { useReadingStore } from "@/stores/useReadingStore";

import ReadingQuiz from "../ReadingQuiz";
import WordSheet, { type TappedWord } from "../WordSheet";

const WORD_BTN =
  "cursor-pointer rounded-[4px] border-0 bg-transparent p-0 font-[inherit] text-inherit focus-ring hover:bg-sunken";

// One sentence: highlighted while it's being read aloud; every word can be
// tapped, the week's Kosakata is underlined.
const Sentence = ({
  sentence,
  items,
  onTap,
}: {
  sentence: string;
  items: Item[];
  onTap: (t: TappedWord) => void;
}) => {
  const speaking = useSpeaking(sentence);
  const parts = useMemo(() => pieces(sentence, items), [sentence, items]);
  return (
    <span
      className={classNames(
        "rounded-[4px] transition-colors",
        speaking && "bg-accent-tint",
      )}
    >
      {parts.map((p, i) =>
        p.kind === "text" ? (
          <React.Fragment key={i}>{p.text}</React.Fragment>
        ) : p.kind === "target" ? (
          <button
            key={i}
            type="button"
            onClick={() => onTap({ word: p.text, sentence, item: p.item })}
            className={classNames(
              WORD_BTN,
              "font-extrabold underline decoration-accent decoration-2 underline-offset-4",
            )}
          >
            {p.text}
          </button>
        ) : (
          // Plain words stay out of the Tab order (a text has hundreds);
          // the week's words above are reachable by keyboard.
          <button
            key={i}
            type="button"
            tabIndex={-1}
            onClick={() => onTap({ word: p.text, sentence })}
            className={WORD_BTN}
          >
            {p.text}
          </button>
        ),
      )}{" "}
    </span>
  );
};

const Paragraph = ({
  n,
  en,
  id,
  items,
  onTap,
}: {
  n: number;
  en: string;
  id: string;
  items: Item[];
  onTap: (t: TappedWord) => void;
}) => {
  const [tr, setTr] = useState(false);
  const sentences = useMemo(() => splitSentences(en), [en]);
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-[17px] leading-[30px] font-semibold text-ink md:text-lg md:leading-8">
        {sentences.map((s, i) => (
          <Sentence key={i} sentence={s} items={items} onTap={onTap} />
        ))}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          aria-label={`Putar paragraf ${n}`}
          onClick={() => void speakAll(sentences)}
        >
          <LuPlay aria-hidden size={14} />
          Putar
        </Button>
        <Button
          size="sm"
          variant="outline"
          aria-expanded={tr}
          aria-label={`Terjemahan paragraf ${n}`}
          onClick={() => setTr(!tr)}
        >
          <LuLanguages aria-hidden size={14} />
          {tr ? "Tutup terjemahan" : "Terjemahan"}
        </Button>
      </div>
      {tr && (
        <p className="m-0 rounded-lg border-l-4 border-accent-line bg-accent-wash px-3 py-2 text-[15px] leading-[23px] font-semibold text-ink-2">
          {id}
        </p>
      )}
    </div>
  );
};

const Result = ({
  result,
  onAgain,
}: {
  result: ReadingResult;
  onAgain: () => void;
}) => (
  <Card
    tone="done"
    pad="lg"
    className="flex-row items-start gap-4"
    role="status"
  >
    <Jalak
      mood={result.score / result.total >= 0.8 ? "senang" : "biasa"}
      className="shrink-0"
    />
    <div className="flex min-w-0 flex-col gap-1.5">
      <SectionLabel tone="ok">BACAAN SELESAI</SectionLabel>
      <span className="text-2xl font-black text-ink tabular-nums">
        Skor {result.score}/{result.total}
      </span>
      <span className="text-sm font-bold text-ink-2">
        {result.savedWords
          ? `${result.savedWords} kata disimpan ke Ulang. Kata-kata itu muncul di Ulang besok.`
          : "Belum ada kata yang disimpan. Ketuk kata di teks untuk menyimpannya."}
      </span>
      <div className="flex flex-wrap gap-3 pt-1.5">
        <Button variant="green" onClick={onAgain}>
          Baca lagi
        </Button>
        <Link
          href={ROUTES.READING}
          className="inline-flex min-h-11 items-center px-1 text-sm font-extrabold text-accent-edge underline-offset-4 focus-ring hover:underline"
        >
          Kembali ke daftar
        </Link>
      </div>
    </div>
  </Card>
);

const ReadingBody = ({ text }: { text: ReadingText }) => {
  const { allLevels } = useShellData();
  const finish = useReadingStore((s) => s.finish);
  const doneAt = useReadingStore((s) => s.done[text.id]);
  const items = useMemo(
    () => allLevels[text.level]?.V[String(text.week)]?.items ?? [],
    [allLevels, text.level, text.week],
  );
  const index = useMemo(() => vocabIndex(allLevels), [allLevels]);
  const allSentences = useMemo(
    () => text.paragraphs.flatMap((p) => splitSentences(p.en)),
    [text.paragraphs],
  );

  const [tap, setTap] = useState<TappedWord | null>(null);
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [playing, setPlaying] = useState(false);
  const [stage, setStage] = useState<"read" | "quiz">("read");
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<ReadingResult | null>(null);
  const quizRef = useRef<HTMLDivElement>(null);

  // Leaving the page stops the voice.
  useEffect(() => () => stopSpeaking(), []);

  const playAll = async () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    await speakAll(allSentences);
    setPlaying(false);
  };

  const onSaved = (r: SaveWordResult) => {
    if (r.status === "scheduled") setSaved((s) => new Set(s).add(r.key));
  };

  const levelName =
    (LEVELS.find((l) => l[0] === text.level) || [])[1] || text.level;

  return (
    <section className="flex max-w-[760px] flex-col gap-5">
      <Link
        href={ROUTES.READING}
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-extrabold text-accent-edge focus-ring hover:underline"
      >
        <LuArrowLeft aria-hidden size={16} />
        Semua bacaan
      </Link>
      <div className="flex flex-col gap-1.5">
        <SectionLabel tone="green">
          {String(levelName).toUpperCase()} · MINGGU {text.week} · TEKS{" "}
          {text.slot}
        </SectionLabel>
        <PageHeading>{text.title}</PageHeading>
        <span className="text-sm font-bold text-ink-2">
          {text.wordCount} kata · ± {readingMinutes(text.wordCount)} menit baca
          {doneAt && " · ✓ sudah selesai"}
        </span>
      </div>

      <Card className="gap-2">
        <span className="text-[13.5px] leading-[19px] font-semibold text-ink-2">
          Ketuk kata mana saja untuk melihat arti dan mendengarnya. Kata yang
          digaris bawah adalah kosakata minggu ini.
        </span>
        <Button
          variant={playing ? "outline" : "green"}
          className="self-start"
          onClick={() => void playAll()}
        >
          {playing ? (
            <LuPause aria-hidden size={16} />
          ) : (
            <LuPlay aria-hidden size={16} />
          )}
          {playing ? "Berhenti" : "Putar semua"}
        </Button>
      </Card>

      <article className="flex flex-col gap-5" aria-label={text.title}>
        {text.paragraphs.map((p, i) => (
          <Paragraph
            key={i}
            n={i + 1}
            en={p.en}
            id={p.id}
            items={items}
            onTap={setTap}
          />
        ))}
      </article>

      {stage === "read" ? (
        <Button
          variant="green"
          className="self-start"
          onClick={() => {
            stopSpeaking();
            setStage("quiz");
            setTimeout(
              () => quizRef.current?.scrollIntoView({ block: "start" }),
              0,
            );
          }}
        >
          Selesai membaca · jawab {text.questions.length} soal
        </Button>
      ) : (
        <div ref={quizRef} className="flex scroll-mt-24 flex-col gap-5">
          <ReadingQuiz
            key={round}
            questions={text.questions}
            onChecked={(score) =>
              setResult(
                finish({
                  textId: text.id,
                  title: text.title,
                  level: text.level,
                  week: text.week,
                  score,
                  total: text.questions.length,
                  savedWords: saved.size,
                }),
              )
            }
          />
          {result && (
            <Result
              result={result}
              onAgain={() => {
                setResult(null);
                setStage("read");
                setRound((r) => r + 1);
                window.scrollTo({ top: 0 });
              }}
            />
          )}
        </div>
      )}

      {tap && (
        <WordSheet
          key={`${tap.word}|${tap.sentence}`}
          tap={tap}
          text={text}
          index={index}
          allLevels={allLevels}
          onSaved={onSaved}
          onClose={() => setTap(null)}
        />
      )}
    </section>
  );
};

// /reading/[id]: one text of the active level.
const ReadingView = ({ id }: { id: string }) => {
  const { level } = useShellData();
  const { texts, isLoading, isError, refetch } = useReadingTexts(
    level as LevelId,
  );
  const text = texts?.find((t) => t.id === id);

  if (isLoading) {
    return (
      <Card tone="dashed" className="py-8 text-center">
        <span className="text-[15px] font-bold text-ink-2">Memuat bacaan…</span>
      </Card>
    );
  }
  if (isError) {
    return (
      <Card tone="redBg" className="items-start">
        <span className="text-[15px] font-bold text-ink">
          Bacaan belum bisa dimuat. Periksa koneksi internetmu.
        </span>
        <Button size="sm" onClick={() => void refetch()}>
          Coba lagi
        </Button>
      </Card>
    );
  }
  if (!text) {
    return (
      <Card tone="dashed" className="items-center py-8 text-center">
        <Jalak mood="berpikir" />
        <span className="text-[15px] font-bold text-ink-2">
          Bacaan ini tidak ada di level aktif. Mungkin sudah ditarik admin atau
          kamu baru ganti level.
        </span>
        <Link
          href={ROUTES.READING}
          className="text-sm font-extrabold text-accent-edge focus-ring hover:underline"
        >
          Lihat semua bacaan
        </Link>
      </Card>
    );
  }
  return <ReadingBody key={text.id} text={text} />;
};

export default ReadingView;
