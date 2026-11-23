import { LEVELS } from "@/const/levels.constant";
import { VERB_FORMS } from "@/lib/content";
import { baseForms } from "@/lib/helpers/lemma.helper";
import {
  flatten,
  type LevelData,
  sameMeaning,
} from "@/lib/helpers/level-data.helper";
import { itemKey } from "@/lib/helpers/storage.helper";
import { targetCandidates } from "@/lib/helpers/target.helper";
import { formsOf, type VerbForms } from "@/lib/helpers/verb-forms.helper";
import type {
  GlossaryEntry,
  ReadingQuestion,
  ReadingText,
  ReadingWarning,
} from "@/lib/types/reading.types";
import type { Item } from "@/lib/types/vocab.types";

// "Bacaan": splitting a text into sentences and tappable words, marking the
// week's Kosakata in it (phrases too: "woke up", "ran out of"), and finding
// what a tapped word means.

/** Reading speed used for "± N menit". */
export const WPM = 130;
export const readingMinutes = (words: number) =>
  Math.max(1, Math.round(words / WPM));

/** Sentences of a paragraph, punctuation and trailing quotes kept. */
export const splitSentences = (p: string): string[] =>
  (p.match(/[^.!?]+(?:[.!?]+["”’)]*|$)/g) ?? [])
    .map((s) => s.trim())
    .filter(Boolean);

export type Piece =
  | { kind: "text"; text: string }
  | { kind: "word"; text: string }
  /** A Kosakata item of the text's week, possibly several words. */
  | { kind: "target"; text: string; item: Item };

const WORD = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Forms of a card; phrases without their own entry borrow the irregular
// forms of their first word ("wake up" → "woke up").
const cardForms = (it: Item, en: string): VerbForms | null => {
  const f = formsOf(it);
  if (f) return f;
  const irr = VERB_FORMS.IRREG[en.toLowerCase().split(/\s+/)[0]];
  return irr
    ? {
        v2: irr[0],
        v3: irr[1],
        irregular: true,
        same: false,
        ing: irr[2] ?? "",
      }
    : null;
};

// Regex of one card's forms; built once per item.
const targetRe = new WeakMap<Item, RegExp | null>();
const reOf = (it: Item): RegExp | null => {
  if (targetRe.has(it)) return targetRe.get(it)!;
  // "sb/sth/…" placeholders can't be matched literally: skip those cards.
  const en = it[1].replace(/\([^)]*\)/g, "").trim();
  const ok = en && !/…|\.\.\.|\+|\b(sb|sth|someone|something)\b/i.test(en);
  const alt = ok
    ? targetCandidates(en, cardForms(it, en)).map(escape).join("|")
    : "";
  const re = alt
    ? new RegExp(`(^|[^\\p{L}'])(${alt})(?![\\p{L}])`, "giu")
    : null;
  targetRe.set(it, re);
  return re;
};

/** [start, end, item] of every week item in the sentence, longest first,
 * no overlaps. */
export const targetSpans = (
  sentence: string,
  items: Item[],
): [number, number, Item][] => {
  const found: [number, number, Item][] = [];
  items.forEach((it) => {
    const re = reOf(it);
    if (!re) return;
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sentence))) {
      const start = m.index + m[1].length;
      found.push([start, start + m[2].length, it]);
      if (re.lastIndex === m.index) re.lastIndex++;
    }
  });
  found.sort((a, b) => b[1] - b[0] - (a[1] - a[0]) || a[0] - b[0]);
  const kept: [number, number, Item][] = [];
  found.forEach((f) => {
    if (!kept.some((k) => f[0] < k[1] && k[0] < f[1])) kept.push(f);
  });
  return kept.sort((a, b) => a[0] - b[0]);
};

/** A sentence as text, plain words and marked week items. */
export const pieces = (sentence: string, items: Item[]): Piece[] => {
  const spans = targetSpans(sentence, items);
  const out: Piece[] = [];
  let at = 0;
  const words = (s: string) => {
    let last = 0;
    for (const m of s.matchAll(WORD)) {
      if (m.index > last)
        out.push({ kind: "text", text: s.slice(last, m.index) });
      out.push({ kind: "word", text: m[0] });
      last = m.index + m[0].length;
    }
    if (last < s.length) out.push({ kind: "text", text: s.slice(last) });
  };
  spans.forEach(([s, e, item]) => {
    words(sentence.slice(at, s));
    out.push({ kind: "target", text: sentence.slice(s, e), item });
    at = e;
  });
  words(sentence.slice(at));
  return out;
};

export interface VocabHit {
  lid: string;
  w: number;
  it: Item;
  key: string;
}

/** Every Kosakata card by its lower-case word (all levels). */
export const vocabIndex = (allLevels: Record<string, LevelData>) => {
  const m = new Map<string, VocabHit[]>();
  LEVELS.forEach(([lid]) => {
    const d = allLevels[lid];
    if (!d) return;
    flatten(d.V).forEach(({ w, it }) => {
      const k = it[1].toLowerCase().trim();
      m.set(k, [
        ...(m.get(k) ?? []),
        { lid, w, it, key: itemKey(lid, w, it[0], it[1]) },
      ]);
    });
  });
  return m;
};

/**
 * The Kosakata card for a word in the text: the word itself or its base
 * form, preferring `level` (then `week`), then the other levels in order.
 * With `meaning`, only a card with the same meaning counts ("watch" =
 * menonton is not the card "watch" = jam tangan).
 */
export const findVocab = (
  index: Map<string, VocabHit[]>,
  word: string,
  level: string,
  week?: number,
  meaning?: string,
): VocabHit | null => {
  for (const base of baseForms(word)) {
    const hits = (index.get(base) ?? []).filter(
      (h) => !meaning || sameMeaning(h.it[3], meaning),
    );
    if (!hits.length) continue;
    const rank = (h: VocabHit) =>
      (h.lid === level ? 0 : 10 + LEVELS.findIndex((l) => l[0] === h.lid)) +
      (h.lid === level && h.w === week ? -1 : 0);
    return [...hits].sort((a, b) => rank(a) - rank(b))[0];
  }
  return null;
};

/** The text's glossary entry for a tapped word (any inflection). */
export const findGlossary = (
  glossary: GlossaryEntry[],
  word: string,
): GlossaryEntry | null => {
  const mine = new Set(baseForms(word));
  return (
    glossary.find((g) => {
      const gw = g.word.toLowerCase().trim();
      return mine.has(gw) || baseForms(gw).some((b) => mine.has(b));
    }) ?? null
  );
};

/** Find-the-word answer: the same word or another form of it. */
export const findWordCorrect = (input: string, answer: string): boolean => {
  const a = new Set(baseForms(answer));
  const b = baseForms(input.trim().split(/\s+/)[0] ?? "");
  return b.some((x) => a.has(x));
};

export type Answer = number | boolean | string | null;

export const isCorrect = (q: ReadingQuestion, a: Answer): boolean => {
  if (a === null) return false;
  if (q.type === "mcq") return a === q.answerIndex;
  if (q.type === "true_false") return a === q.answer;
  return typeof a === "string" && findWordCorrect(a, q.answer);
};

/** Texts grouped by week: the active week first, then earlier weeks (newest
 * first), then later ones. */
export const groupByWeek = (
  texts: ReadingText[],
  activeWeek: number,
): { week: number; texts: ReadingText[] }[] => {
  const m = new Map<number, ReadingText[]>();
  texts.forEach((t) => m.set(t.week, [...(m.get(t.week) ?? []), t]));
  const order = (w: number) =>
    w === activeWeek ? -1e6 : w < activeWeek ? -w : 1e3 + w;
  return [...m.entries()]
    .sort((a, b) => order(a[0]) - order(b[0]))
    .map(([week, ts]) => ({
      week,
      texts: [...ts].sort((a, b) => a.slot.localeCompare(b.slot)),
    }));
};

/** A Bacaan harian's day for its card: "Hari ini", "Kemarin" or the date.
 * Days are WIB, as the server makes them. */
export const dailyLabel = (day: string, now = new Date()): string => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(now);
  const ago = (Date.parse(today) - Date.parse(day)) / 86_400_000;
  if (ago === 0) return "Hari ini";
  if (ago === 1) return "Kemarin";
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
};

/** A draft's warning for the admin, in Indonesian. */
export const warningText = (w: ReadingWarning): string => {
  switch (w.code) {
    case "word_count":
      return `Panjang teks ${w.count} kata (seharusnya ${w.min}–${w.max}).`;
    case "few_target_words":
      return `Hanya ${w.found} kosakata minggu ini yang muncul di teks (minimal ${w.min}).`;
    case "targets_not_in_text":
      return `Disebut sebagai kata target tapi tidak ada di teks: ${w.words.join(", ")}.`;
    case "find_word_not_in_text":
      return `Jawaban soal "temukan kata" ("${w.word}") tidak ada di teks.`;
  }
};
