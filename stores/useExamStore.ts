import { create } from "zustand";

import {
  ATTEMPTS_MAX,
  EMPTY_EXAM,
  normalizeExam,
} from "@/lib/helpers/exam.helper";
import { load, save, STORAGE_KEYS } from "@/lib/helpers/storage.helper";
import type {
  ExamAttempt,
  ExamData,
  PlacementResult,
} from "@/lib/types/exam.types";
import type { LevelId } from "@/lib/types/session.types";
import { useActivityStore } from "@/stores/useActivityStore";

// Tes penempatan + ujian akhir level (progress doc `exam`, in Export/Import).

const read = () => normalizeExam(load<unknown>(STORAGE_KEYS.exam, EMPTY_EXAM));

const pick = (s: ExamData): ExamData => ({
  placement: s.placement,
  attempts: s.attempts,
  base: s.base,
});

const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

interface ExamState extends ExamData {
  setPlacement: (p: PlacementResult) => void;
  addAttempt: (a: Omit<ExamAttempt, "id" | "date">) => ExamAttempt;
  /** The level the learner starts at (first time only). */
  setBase: (level: LevelId) => void;
  setAll: (f: (cur: ExamData) => ExamData) => void;
  hydrate: () => void;
}

export const useExamStore = create<ExamState>((set, get) => {
  const commit = (next: ExamData) => {
    save(STORAGE_KEYS.exam, next);
    set(next);
  };
  return {
    ...read(),
    hydrate: () => set(read()),
    setPlacement: (placement) => commit({ ...pick(get()), placement }),
    addAttempt: (a) => {
      const attempt: ExamAttempt = {
        ...a,
        id: uid(),
        date: new Date().toISOString(),
      };
      const cur = pick(get());
      commit({
        ...cur,
        attempts: [attempt, ...cur.attempts].slice(0, ATTEMPTS_MAX),
      });
      useActivityStore.getState().log("exam", {
        meta: { level: a.level, pct: a.pct, passed: a.passed },
      });
      return attempt;
    },
    setBase: (base) => {
      if (!get().base) commit({ ...pick(get()), base });
    },
    setAll: (f) => commit(f(pick(get()))),
  };
});
