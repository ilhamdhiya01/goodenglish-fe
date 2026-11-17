import { create } from "zustand";

import { load, save, STORAGE_KEYS } from "@/lib/helpers/storage.helper";
import type {
  ReadingData,
  ReadingResult,
  WordMeaning,
} from "@/lib/types/reading.types";

// "Bacaan" progress (doc `reading`, included in Export/Import): results per
// finished text, which texts are done, and word meanings already looked up
// (so the same word never asks the server twice).

export const READING_RESULTS_MAX = 300;
export const LOOKUPS_MAX = 500;

const EMPTY: ReadingData = { results: [], done: {}, lookups: {} };

const validResult = (r: unknown): r is ReadingResult => {
  const x = r as Partial<ReadingResult> | null;
  return (
    !!x &&
    typeof x.id === "string" &&
    typeof x.date === "string" &&
    typeof x.textId === "string" &&
    typeof x.score === "number" &&
    typeof x.total === "number"
  );
};

const validMeaning = (m: unknown): m is WordMeaning => {
  const x = m as Partial<WordMeaning> | null;
  return !!x && typeof x.meaningId === "string" && typeof x.lemma === "string";
};

const obj = <T>(v: unknown, d: T): T =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as T) : d;

/** Data read from storage or a file, with defaults for anything missing. */
export const normalizeReading = (raw: unknown): ReadingData => {
  const d = obj<Partial<ReadingData>>(raw, {});
  const done: Record<string, string> = {};
  Object.entries(obj<Record<string, unknown>>(d.done, {})).forEach(([k, v]) => {
    if (typeof v === "string") done[k] = v;
  });
  const lookups: Record<string, WordMeaning> = {};
  Object.entries(obj<Record<string, unknown>>(d.lookups, {})).forEach(
    ([k, v]) => {
      if (validMeaning(v)) lookups[k] = v;
    },
  );
  return {
    results: Array.isArray(d.results) ? d.results.filter(validResult) : [],
    done,
    lookups,
  };
};

const read = () => normalizeReading(load<unknown>(STORAGE_KEYS.reading, EMPTY));

/** Keep the newest LOOKUPS_MAX entries (insertion order). */
const trimLookups = (l: Record<string, WordMeaning>) => {
  const keys = Object.keys(l);
  if (keys.length <= LOOKUPS_MAX) return l;
  const out: Record<string, WordMeaning> = {};
  keys.slice(-LOOKUPS_MAX).forEach((k) => (out[k] = l[k]));
  return out;
};

/** Combine two copies (import): results by id, the earliest "done" date. */
export const mergeReading = (
  cur: ReadingData,
  incoming: unknown,
): ReadingData => {
  const inc = normalizeReading(incoming);
  const have = new Set(cur.results.map((r) => r.id));
  const results = [
    ...cur.results,
    ...inc.results.filter((r) => !have.has(r.id)),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, READING_RESULTS_MAX);
  const done = { ...inc.done };
  Object.entries(cur.done).forEach(([k, v]) => {
    if (!done[k] || v < done[k]) done[k] = v;
  });
  return {
    results,
    done,
    lookups: trimLookups({ ...inc.lookups, ...cur.lookups }),
  };
};

export const lookupKey = (level: string, word: string) =>
  `${level}|${word.toLowerCase()}`;

const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

interface ReadingState extends ReadingData {
  /** Save a finished text and mark it done. */
  finish: (r: Omit<ReadingResult, "id" | "date">) => ReadingResult;
  cacheLookup: (level: string, word: string, m: WordMeaning) => void;
  setAll: (f: (cur: ReadingData) => ReadingData) => void;
  hydrate: () => void;
}

const pick = (s: ReadingData): ReadingData => ({
  results: s.results,
  done: s.done,
  lookups: s.lookups,
});

export const useReadingStore = create<ReadingState>((set, get) => {
  const commit = (next: ReadingData) => {
    save(STORAGE_KEYS.reading, next);
    set(next);
  };
  return {
    ...read(),
    hydrate: () => set(read()),
    finish: (r) => {
      const cur = pick(get());
      const result: ReadingResult = {
        ...r,
        id: uid(),
        date: new Date().toISOString(),
      };
      commit({
        ...cur,
        results: [result, ...cur.results].slice(0, READING_RESULTS_MAX),
        done: cur.done[r.textId]
          ? cur.done
          : { ...cur.done, [r.textId]: result.date },
      });
      return result;
    },
    cacheLookup: (level, word, m) => {
      const cur = pick(get());
      commit({
        ...cur,
        lookups: trimLookups({ ...cur.lookups, [lookupKey(level, word)]: m }),
      });
    },
    setAll: (f) => commit(f(pick(get()))),
  };
});
