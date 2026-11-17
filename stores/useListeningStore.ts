import { create } from "zustand";

import { PASS_RATE } from "@/lib/helpers/listening.helper";
import { load, save, STORAGE_KEYS } from "@/lib/helpers/storage.helper";
import type {
  ListeningData,
  ListeningResult,
  ListeningTab,
} from "@/lib/types/listening.types";

// "Menyimak" progress (doc `listening`, included in Export/Import): set
// results for the Progres page, the highest unlocked stage per tab, items
// already done, and minimal-pair stats.

export const LISTENING_RESULTS_MAX = 300;
export const MAX_STAGE = 3;

const EMPTY: ListeningData = { results: [], stages: {}, seen: {}, pairs: {} };

const validResult = (r: unknown): r is ListeningResult => {
  const x = r as Partial<ListeningResult> | null;
  return (
    !!x &&
    typeof x.id === "string" &&
    typeof x.date === "string" &&
    (x.tab === "dikte" || x.tab === "dengar" || x.tab === "bunyi") &&
    typeof x.score === "number" &&
    typeof x.total === "number"
  );
};

const obj = <T>(v: unknown, d: T): T =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as T) : d;

/** Data read from storage or a file, with defaults for anything missing. */
export const normalizeListening = (raw: unknown): ListeningData => {
  const d = obj<Partial<ListeningData>>(raw, {});
  return {
    results: Array.isArray(d.results) ? d.results.filter(validResult) : [],
    stages: obj(d.stages, {}),
    seen: obj(d.seen, {}),
    pairs: obj(d.pairs, {}),
  };
};

const read = () =>
  normalizeListening(load<unknown>(STORAGE_KEYS.listening, EMPTY));

/** Unlocked stage of a tab: 1 at first. */
export const unlockedStage = (d: ListeningData, tab: ListeningTab) =>
  Math.min(MAX_STAGE, Math.max(1, d.stages[tab] ?? 1));

/** Combine two copies (import): results by id, the furthest stage, all seen,
 * and for each pair the side with more answers. */
export const mergeListening = (
  cur: ListeningData,
  incoming: unknown,
): ListeningData => {
  const inc = normalizeListening(incoming);
  const have = new Set(cur.results.map((r) => r.id));
  const results = [
    ...cur.results,
    ...inc.results.filter((r) => !have.has(r.id)),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, LISTENING_RESULTS_MAX);
  const stages = { ...inc.stages };
  (Object.keys(cur.stages) as ListeningTab[]).forEach((t) => {
    stages[t] = Math.max(cur.stages[t] ?? 1, inc.stages[t] ?? 1);
  });
  const pairs = { ...inc.pairs };
  Object.entries(cur.pairs).forEach(([k, v]) => {
    if (!pairs[k] || v.total >= pairs[k].total) pairs[k] = v;
  });
  return { results, stages, seen: { ...inc.seen, ...cur.seen }, pairs };
};

const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

interface ListeningState extends ListeningData {
  /**
   * Save a finished set. At ≥ 80% on the highest unlocked stage, the next
   * stage opens. Returns whether it did.
   */
  finishSet: (r: Omit<ListeningResult, "id" | "date">) => { unlocked: boolean };
  markSeen: (ids: string[]) => void;
  countPair: (pairId: string, right: boolean) => void;
  setAll: (f: (cur: ListeningData) => ListeningData) => void;
  hydrate: () => void;
}

const pick = (s: ListeningData): ListeningData => ({
  results: s.results,
  stages: s.stages,
  seen: s.seen,
  pairs: s.pairs,
});

export const useListeningStore = create<ListeningState>((set, get) => {
  const commit = (next: ListeningData) => {
    save(STORAGE_KEYS.listening, next);
    set(next);
  };
  return {
    ...read(),
    hydrate: () => set(read()),
    finishSet: (r) => {
      const cur = pick(get());
      const top = unlockedStage(cur, r.tab);
      const passed = r.total > 0 && r.score / r.total >= PASS_RATE;
      const unlocked = passed && r.stage === top && top < MAX_STAGE;
      const result: ListeningResult = {
        ...r,
        id: uid(),
        date: new Date().toISOString(),
      };
      commit({
        ...cur,
        results: [result, ...cur.results].slice(0, LISTENING_RESULTS_MAX),
        stages: unlocked ? { ...cur.stages, [r.tab]: top + 1 } : cur.stages,
      });
      return { unlocked };
    },
    markSeen: (ids) => {
      const cur = pick(get());
      const seen = { ...cur.seen };
      ids.forEach((id) => (seen[id] = 1));
      commit({ ...cur, seen });
    },
    countPair: (pairId, right) => {
      const cur = pick(get());
      const p = cur.pairs[pairId] ?? { right: 0, total: 0 };
      commit({
        ...cur,
        pairs: {
          ...cur.pairs,
          [pairId]: { right: p.right + (right ? 1 : 0), total: p.total + 1 },
        },
      });
    },
    setAll: (f) => commit(f(pick(get()))),
  };
});
