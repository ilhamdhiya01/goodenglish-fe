import { create } from "zustand";

import type { Flat } from "@/lib/helpers/level-data.helper";
import { buildQuiz } from "@/lib/helpers/quiz.helper";
import type { QuizScope, QuizState } from "@/lib/types/quiz.types";
import { useLevelStore } from "@/stores/useLevelStore";
import { usePlanStore } from "@/stores/usePlanStore";

// Sesi "Tes cepat" 20 soal. Panelnya hidup di halaman Kosakata, tapi pemicunya
// (scope + tombol mulai) ada di navigasi global — makanya state-nya di store.

interface QuizStoreState {
  session: QuizState | null;
  scope: QuizScope;
  setScope: (s: QuizScope) => void;
  /** pool = kata sumber sesuai scope (minggu ini / semua minggu). */
  start: (pool: Flat[]) => void;
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

    setScope: (scope) => set({ scope }),

    start: (pool) => {
      lastPool = pool;
      set({ session: buildQuiz(pool) });
    },

    pick: (opt) =>
      set((s) => {
        const q = s.session;
        if (!q || q.picked !== null || q.done) return {};
        const cur = q.qs[q.i];
        return {
          session: {
            ...q,
            picked: opt,
            score: opt === cur.ans ? q.score + 1 : q.score,
          },
        };
      }),

    next: () => {
      const q = get().session;
      if (!q || q.picked === null) return;
      if (q.i === q.qs.length - 1) {
        const { level, week } = useLevelStore.getState();
        usePlanStore.getState().logQuiz(q.score, get().scope, level, week);
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
