import { idOf } from "@/lib/content";
import { mulberry, shuffle } from "@/lib/helpers/bank-practice.helper";
import type { LevelData } from "@/lib/helpers/level-data.helper";
import type { ListeningItem } from "@/lib/types/listening.types";
import type { Scenario } from "@/lib/types/scenario.types";

// "Menyimak": the question pools. Dictation sentences come from the course
// content (Kosakata example sentences of weeks 1..active week, plus the
// Skenario dialogue lines of the level); "Dengar & jawab" items come from the
// server's published bank. Everything here is pure, so the placement test and
// the end-of-level exam can reuse it.

export type DictationStage = 1 | 2 | 3;

export interface DictationSentence {
  /** Stable id (hash of the text) for "already done" tracking. */
  id: string;
  text: string;
  /** Indonesian meaning, when known. */
  meaning: string;
  source: "kosakata" | "skenario";
  week: number;
  words: number;
  /** Reduced forms like gonna / wanna: always the hardest stage. */
  fast: boolean;
}

/** Words of a stage: ≤7, 8–12, longer (or fast speech). */
export const STAGE_RULES: Record<DictationStage, string> = {
  1: "Kalimat pendek (≤ 7 kata), suara agak pelan",
  2: "Kalimat sedang (8–12 kata), suara normal",
  3: "Kalimat panjang atau ucapan cepat (gonna, wanna), suara normal/cepat",
};

export const DICTATION_PER_SET = 10;
export const PASS_RATE = 0.8;

const FAST_SPEECH =
  /\b(gonna|wanna|gotta|kinda|sorta|lemme|gimme|dunno|outta|y'all|ya know)\b/i;

/** djb2 → short base-36 id. */
const hashId = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return "d" + (h >>> 0).toString(36);
};

const countWords = (s: string) =>
  (s.match(/[A-Za-z0-9]+(?:['’][A-Za-z]+)?/g) ?? []).length;

/**
 * A sentence fit to be dictated, cleaned; null if it can't be: two
 * alternatives (" / "), trailing "…", dashes, or under 3 words.
 */
export const cleanSentence = (raw: string): string | null => {
  if (!raw || /\s\/\s|…|\.\.\.|—|–/.test(raw)) return null;
  const s = raw
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!/[A-Za-z]/.test(s) || countWords(s) < 3) return null;
  return s;
};

export const stageOf = (s: Pick<DictationSentence, "words" | "fast">) =>
  (s.fast || s.words > 12 ? 3 : s.words >= 8 ? 2 : 1) as DictationStage;

/**
 * Playback speed of a dictation sentence for its stage. Stage 3: genuinely
 * long sentences (> 12 words) at Normal; everything else there (fast speech,
 * or the 10–12 word sentences that fill the stage, since the course has few
 * longer ones) at Cepat, so the stage stays harder than stage 2.
 */
export const dictationSpeed = (
  stage: DictationStage,
  s: Pick<DictationSentence, "fast" | "words">,
) =>
  stage === 1
    ? 0.78
    : stage === 2
      ? 0.95
      : !s.fast && s.words > 12
        ? 0.95
        : 1.2;

/** All dictation sentences of a level up to (and including) `upToWeek`. */
export const dictationPool = (
  data: LevelData,
  scenarios: Scenario[],
  level: string,
  upToWeek: number,
): DictationSentence[] => {
  const out = new Map<string, DictationSentence>();
  const add = (
    raw: string,
    source: DictationSentence["source"],
    week: number,
    meaning = "",
  ) => {
    const text = cleanSentence(raw);
    if (!text) return;
    const id = hashId(text.toLowerCase());
    if (out.has(id)) return;
    out.set(id, {
      id,
      text,
      meaning: meaning || idOf(text) || "",
      source,
      week,
      words: countWords(text),
      fast: FAST_SPEECH.test(text),
    });
  };
  Object.values(data.V)
    .filter((w) => w.week <= upToWeek)
    .forEach((w) => w.items.forEach((it) => add(it[4], "kosakata", w.week)));
  scenarios
    .filter((sc) => sc.level === level)
    .forEach((sc) => sc.lines.forEach((l) => add(l[1], "skenario", 0, l[2])));
  return [...out.values()];
};

/** An Indonesian meaning of a dictation sentence (a word example or a
 * scenario line), or "" when the content has none. A sentence in both may
 * have two wordings; either is right. */
export const dictationMeaning = (text: string, scenarios: Scenario[]) =>
  idOf(text) ||
  scenarios
    .flatMap((sc) => sc.lines)
    .find((l) => cleanSentence(l[1]) === text)?.[2] ||
  "";

/**
 * `n` sentences for a stage: unseen first, then the rest, shuffled with a
 * seed. If the stage has fewer than `n`, the nearest lengths fill it up
 * (stage 3 takes the longest sentences available).
 */
export const pickDictation = (
  pool: DictationSentence[],
  stage: DictationStage,
  seen: Record<string, unknown>,
  seed: number,
  n = DICTATION_PER_SET,
  /** Sentences of this week first (pilot urutan 7). */
  activeWeek?: number,
): DictationSentence[] => {
  const r = mulberry(seed || 1);
  const inStage = pool.filter((s) => stageOf(s) === stage);
  const thisWeekFirst = (list: DictationSentence[]) =>
    activeWeek === undefined
      ? list
      : [
          ...list.filter((s) => s.week === activeWeek),
          ...list.filter((s) => s.week !== activeWeek),
        ];
  const fresh = thisWeekFirst(
    shuffle(
      r,
      inStage.filter((s) => !seen[s.id]),
    ),
  );
  const old = thisWeekFirst(
    shuffle(
      r,
      inStage.filter((s) => seen[s.id]),
    ),
  );
  let picked = [...fresh, ...old].slice(0, n);
  if (picked.length < n) {
    const have = new Set(picked.map((s) => s.id));
    const target = stage === 1 ? 5 : stage === 2 ? 10 : 99;
    const rest = pool
      .filter((s) => !have.has(s.id))
      .sort((a, b) => Math.abs(a.words - target) - Math.abs(b.words - target));
    picked = [...picked, ...rest.slice(0, n - picked.length)];
  }
  return picked;
};

/** Published items of weeks ≤ active week, unseen first. */
export const pickListenItem = (
  items: ListeningItem[],
  upToWeek: number,
  seen: Record<string, unknown>,
  seed: number,
): ListeningItem | null => {
  const r = mulberry(seed || 1);
  const usable = items.filter((i) => i.week <= upToWeek);
  const fresh = shuffle(
    r,
    usable.filter((i) => !seen[i.id]),
  );
  const old = shuffle(
    r,
    usable.filter((i) => seen[i.id]),
  );
  return fresh[0] ?? old[0] ?? null;
};

/**
 * Listening questions of a level for the placement test and the end-of-level
 * exam: `dictation` sentences spread over the stages and `listen` published
 * "Dengar & jawab" items. Deterministic for a seed.
 */
export const pickListeningQuestions = (opts: {
  data: LevelData;
  scenarios: Scenario[];
  level: string;
  items: ListeningItem[];
  upToWeek?: number;
  dictation: number;
  listen: number;
  seed: number;
}): { dictation: DictationSentence[]; items: ListeningItem[] } => {
  const upTo = opts.upToWeek ?? 99;
  const pool = dictationPool(opts.data, opts.scenarios, opts.level, upTo);
  const r = mulberry(opts.seed || 1);
  const byStage = ([1, 2, 3] as DictationStage[]).map((st) =>
    shuffle(
      r,
      pool.filter((s) => stageOf(s) === st),
    ),
  );
  const dictation: DictationSentence[] = [];
  for (let i = 0; dictation.length < opts.dictation && i < pool.length; i++) {
    const s = byStage[i % 3].shift();
    if (s) dictation.push(s);
    if (byStage.every((b) => !b.length)) break;
  }
  const items = shuffle(
    r,
    opts.items.filter((i) => i.week <= upTo),
  ).slice(0, opts.listen);
  return { dictation, items };
};

/**
 * Second voice for speaker B of a dialogue: the other gender, same accent as
 * the learner's chosen voice (Kokoro ids start with a|b = US|UK, f|m).
 */
export const contrastVoice = (voice: string): string => {
  const uk = voice.startsWith("b");
  const female = voice[1] === "f";
  if (uk) return female ? "bm_george" : "bf_emma";
  return female ? "am_michael" : "af_heart";
};
