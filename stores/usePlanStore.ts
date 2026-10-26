import { create } from "zustand";

import { load, save, STORAGE_KEYS, today } from "@/lib/helpers/storage.helper";
import type { PlanData } from "@/lib/types/plan.types";

// Rencana belajar harian: checklist 3 blok (dicentang otomatis), checkpoint
// mingguan, riwayat tes. Kunci: vocab-plan-v1 (sama dengan versi HTML).

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
  /** Tulis status blok hari ini (hasil hitungan PlanAutoCheck), hanya jika berubah. */
  setDayBlocks: (flags: Record<string, boolean>) => void;
  /** Tambah hitungan aktivitas hari ini (by negatif saat dibatalkan). */
  bumpTally: (k: "known" | "ask" | "pron", by?: number) => void;
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

  // Menimpa total isi hari ini, jadi centang manual lama (termasuk "b4")
  // tidak ikut terbawa.
  setDayBlocks: (flags) => {
    const key = String(today());
    const cur = get().plan.days?.[key] || {};
    const same =
      Object.keys(cur).length === Object.keys(flags).length &&
      Object.entries(flags).every(([id, on]) => cur[id] === on);
    if (same) return;
    get().setPlan((p) => ({
      ...p,
      days: { ...(p.days || {}), [key]: flags },
    }));
  },

  bumpTally: (k, by = 1) =>
    get().setPlan((p) => {
      const T = today();
      const cur = p.tally?.day === T ? p.tally : { day: T };
      return {
        ...p,
        tally: { ...cur, [k]: Math.max(0, (cur[k] || 0) + by) },
      };
    }),

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

  // Blok 3 hari genap (Pelafalan) tidak punya sinyal selesai sendiri, jadi
  // "sudah, lanjut" sekaligus dihitung sebagai tanda blok itu dikerjakan.
  advancePron: () => {
    get().setPlan((p) => ({ ...p, pronIdx: (p.pronIdx || 0) + 1 }));
    get().bumpTally("pron");
  },

  reset: () => get().setPlan(() => ({})),
}));
