import { create } from "zustand";

import { load, save, STORAGE_KEYS, today } from "@/lib/helpers/storage.helper";
import type { PlanData } from "@/lib/types/plan.types";

// Rencana belajar harian: checklist 4 blok, checkpoint mingguan, riwayat tes.
// Kunci: vocab-plan-v1 (sama dengan versi HTML).

interface PlanState {
  plan: PlanData;
  setPlan: (f: (p: PlanData) => PlanData) => void;
  logQuiz: (
    score: number,
    scope: "week" | "all",
    level: string,
    week: number,
  ) => void;
  toggleDayBlock: (dayKey: string, blockId: string) => void;
  toggleWeekCheck: (weekKey: string, k: "rec" | "gpt") => void;
  setRule: (rule: string) => void;
  advancePron: () => void;
  reset: () => void;
  hydrate: () => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plan: load<PlanData>(STORAGE_KEYS.plan, {}),
  hydrate: () => set({ plan: load<PlanData>(STORAGE_KEYS.plan, {}) }),

  setPlan: (f) =>
    set((s) => {
      const plan = f(s.plan);
      save(STORAGE_KEYS.plan, plan);
      return { plan };
    }),

  logQuiz: (score, scope, level, week) =>
    get().setPlan((p) => ({
      ...p,
      quiz: [
        ...(p.quiz || []),
        { d: today(), score, scope, level, week },
      ].slice(-60),
    })),

  toggleDayBlock: (dayKey, blockId) =>
    get().setPlan((p) => ({
      ...p,
      days: {
        ...(p.days || {}),
        [dayKey]: {
          ...(p.days?.[dayKey] || {}),
          [blockId]: !p.days?.[dayKey]?.[blockId],
        },
      },
    })),

  toggleWeekCheck: (weekKey, k) =>
    get().setPlan((p) => ({
      ...p,
      week: {
        ...(p.week || {}),
        [weekKey]: {
          ...(p.week?.[weekKey] || {}),
          [k]: !p.week?.[weekKey]?.[k],
        },
      },
    })),

  setRule: (rule) => get().setPlan((p) => ({ ...p, rule })),

  advancePron: () =>
    get().setPlan((p) => ({ ...p, pronIdx: (p.pronIdx || 0) + 1 })),

  reset: () => get().setPlan(() => ({})),
}));
