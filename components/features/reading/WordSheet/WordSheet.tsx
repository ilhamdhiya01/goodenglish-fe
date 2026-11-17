"use client";

import React, { useState } from "react";
import { LuCircleCheck, LuRotateCcw } from "react-icons/lu";

import Button from "@/components/ui/button";
import Sheet from "@/components/ui/sheet";
import SpeakButton from "@/components/ui/speak-button";
import { LEVELS } from "@/const/levels.constant";
import type { LevelData } from "@/lib/helpers/level-data.helper";
import {
  findGlossary,
  findVocab,
  type VocabHit,
} from "@/lib/helpers/reading.helper";
import { itemKey } from "@/lib/helpers/storage.helper";
import {
  saveToReview,
  type SaveWordResult,
} from "@/lib/helpers/word-card.helper";
import { useWordLookup } from "@/lib/hooks/reading/useReading";
import type { ReadingText } from "@/lib/types/reading.types";
import type { Item } from "@/lib/types/vocab.types";
import { useProgressStore } from "@/stores/useProgressStore";
import { lookupKey, useReadingStore } from "@/stores/useReadingStore";

export interface TappedWord {
  /** As written in the text ("went", "woke up"). */
  word: string;
  sentence: string;
  /** The week's Kosakata item when a marked phrase/word was tapped. */
  item?: Item;
}

interface WordSheetProps {
  tap: TappedWord;
  text: ReadingText;
  index: Map<string, VocabHit[]>;
  allLevels: Record<string, LevelData>;
  onSaved: (r: SaveWordResult) => void;
  onClose: () => void;
}

const levelName = (lid: string) =>
  (LEVELS.find((l) => l[0] === lid) || [])[1] || lid;

// Meaning of a tapped word: Kosakata first (any level), then the text's
// glossary, then the server (Gemini once, cached for everyone). With sound
// and "Simpan ke Ulang".
const WordSheet = ({
  tap,
  text,
  index,
  allLevels,
  onSaved,
  onClose,
}: WordSheetProps) => {
  const vocab: VocabHit | null = tap.item
    ? {
        lid: text.level,
        w: text.week,
        it: tap.item,
        key: itemKey(text.level, text.week, tap.item[0], tap.item[1]),
      }
    : findVocab(index, tap.word, text.level, text.week);
  const gloss = vocab ? null : findGlossary(text.glossary, tap.word);
  const cached = useReadingStore(
    (s) => s.lookups[lookupKey(text.level, tap.word)],
  );
  const lookup = useWordLookup(
    text.level,
    tap.word,
    tap.sentence,
    !vocab && !gloss && !cached,
  );
  const ai = vocab || gloss ? null : (cached ?? lookup.result ?? null);
  // "went" looked up → lemma "go", which may be a Kosakata card after all.
  const aiVocab =
    ai && ai.lemma ? findVocab(index, ai.lemma, text.level, text.week) : null;
  const v = vocab ?? aiVocab;

  const headword = v
    ? v.it[1]
    : gloss
      ? gloss.word.toLowerCase()
      : (ai?.lemma ?? tap.word);
  const meaning = v ? v.it[3] : (gloss?.meaningId ?? ai?.meaningId ?? "");
  const pron = v ? v.it[2] : (ai?.pron ?? "");
  const source = v
    ? `Kosakata · ${levelName(v.lid)} minggu ${v.w}`
    : gloss
      ? "Glosarium bacaan ini"
      : ai
        ? "Arti dari AI"
        : "";

  const knownBefore = useProgressStore((s) => !!(v && s.known[v.key]));
  const [saved, setSaved] = useState<SaveWordResult | null>(null);

  const save = () => {
    const r = saveToReview(
      {
        en: headword,
        meaningId: meaning,
        pron,
        example: tap.sentence,
        source: `Bacaan: ${text.title}`,
        level: text.level,
        week: text.week,
        key: v?.key,
      },
      allLevels,
    );
    setSaved(r);
    onSaved(r);
  };

  return (
    <Sheet label={`Arti kata "${tap.word}"`} onClose={onClose}>
      <div className="flex flex-col gap-3 px-1 pb-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[28px] leading-9 font-black wrap-anywhere text-ink">
            {headword}
          </span>
          <SpeakButton text={headword} />
        </div>
        {headword.toLowerCase() !== tap.word.toLowerCase() && (
          <span className="text-[13.5px] font-bold text-ink-2">
            Di teks: &quot;{tap.word}&quot;
          </span>
        )}
        {!!pron && (
          <span className="text-[15px] font-semibold text-ink-2">/{pron}/</span>
        )}

        {meaning ? (
          <span className="text-lg leading-6 font-extrabold text-ink">
            {meaning}
          </span>
        ) : lookup.isLoading ? (
          <span role="status" className="text-[15px] font-bold text-ink-2">
            Mencari arti…
          </span>
        ) : lookup.error ? (
          <div role="alert" className="flex flex-col items-start gap-2">
            <span className="text-[15px] font-bold text-bad">
              {lookup.error}
            </span>
            <Button size="sm" onClick={lookup.retry}>
              <LuRotateCcw aria-hidden size={14} />
              Coba lagi
            </Button>
          </div>
        ) : null}
        {!!source && (
          <span className="text-[12.5px] font-extrabold tracking-[0.04em] text-ink-2">
            {source}
          </span>
        )}

        <p className="m-0 rounded-lg bg-sunken px-3 py-2 text-[14.5px] leading-[21px] font-semibold text-ink-2">
          {tap.sentence}
        </p>

        {saved ? (
          <span
            role="status"
            className="inline-flex items-center gap-1.5 text-[15px] font-extrabold text-ok"
          >
            <LuCircleCheck aria-hidden size={18} />
            {saved.status === "already"
              ? "Sudah ada di Ulang."
              : saved.created
                ? "Disimpan sebagai kartu pribadi. Muncul di Ulang besok."
                : "Ditandai hafal. Muncul di Ulang besok."}
          </span>
        ) : knownBefore ? (
          <span className="inline-flex items-center gap-1.5 text-[15px] font-extrabold text-ok">
            <LuCircleCheck aria-hidden size={18} />
            Sudah ada di Ulang.
          </span>
        ) : (
          <Button
            variant="green"
            className="self-start"
            disabled={!meaning}
            onClick={save}
          >
            Simpan ke Ulang
          </Button>
        )}
      </div>
    </Sheet>
  );
};

export default WordSheet;
