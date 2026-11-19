import { create } from "zustand";

import type { Flat } from "@/lib/helpers/level-data.helper";
import { buildQuiz } from "@/lib/helpers/quiz.helper";
import type { QuizScope, QuizState } from "@/lib/types/quiz.types";
import { useLevelStore } from "@/stores/useLevelStore";
import { usePlanStore } from "@/stores/usePlanStore";

// Sesi "Tes cepat" 20 soal. Dimulai dari kartu sampul minggu di Kosakata dan
// tampil sebagai dialog; pemilih level juga menutupnya — makanya di store.

interface QuizStoreState {
  session: QuizState | null;
  /** What the learner picked on the week cover. */
  scope: QuizScope;
  /** What the running test really covers: a week with too few words is
   * tested (and logged) as "all weeks". */
  runScope: QuizScope;
  setScope: (s: QuizScope) => void;
  /** pool = kata sumber sesuai scope; fallback = semua minggu, dipakai bila
   * minggu ini terlalu sedikit kata. */
  start: (pool: Flat[], scope?: QuizScope, fallback?: Flat[]) => void;
  pick: (opt: string) => void;
  next: () => void;
  restart: () => void;
  close: () => void;
}

export const useQuizStore = create<QuizStoreState>((set, get) => {
  let lastPool: Flat[] = [];
  return {
    session: null,
    scope: "week",
    runScope: "week",

    setScope: (scope) => set({ scope }),

    start: (pool, scope = get().scope, fallback) => {
      let session = buildQuiz(pool);
      let runScope = scope;
      lastPool = pool;
      if (!session && fallback) {
        session = buildQuiz(fallback);
        runScope = "all";
        lastPool = fallback;
      }
      set({ session, runScope });
    },

    pick: (opt) =>
      set((s) => {
        const q = s.session;
        if (!q || q.picked !== null || q.done) return {};
        const cur = q.qs[q.i];
        const right = opt === cur.ans;
        return {
          session: {
            ...q,
            picked: opt,
            score: right ? q.score + 1 : q.score,
            misses: right
              ? q.misses
              : [
                  ...(q.misses || []),
                  { word: cur.word, ans: cur.ans, picked: opt },
                ],
          },
        };
      }),

    next: () => {
      const q = get().session;
      if (!q || q.picked === null) return;
      if (q.i === q.qs.length - 1) {
        const { level, week } = useLevelStore.getState();
        usePlanStore
          .getState()
          .logQuiz(q.score, get().runScope, level, week, q.qs.length);
        set({ session: { ...q, done: true } });
      } else {
        set({ session: { ...q, i: q.i + 1, picked: null } });
      }
    },

    restart: () => {
      if (lastPool.length) set({ session: buildQuiz(lastPool) });
    },

    close: () => set({ session: null }),
  };
});
