import { create } from "zustand";

import { load, save, STORAGE_KEYS } from "@/lib/helpers/storage.helper";
import type { RuleStats } from "@/lib/types/ask-practice.types";

// Statistik latihan "Bertanya" per rumus (vocab-askprac-v1 — bentuk lama dipertahankan).

const EMPTY: RuleStats = { done: {}, seen: 0, right: 0, wrong: 0 };

interface AskPracticeState {
  stats: Record<string, RuleStats>;
  updateRule: (rule: string, f: (cur: RuleStats) => RuleStats) => void;
  resetRule: (rule: string) => void;
  hydrate: () => void;
}

export const useAskPracticeStore = create<AskPracticeState>((set) => ({
  stats: load(STORAGE_KEYS.askprac, {}),
  hydrate: () => set({ stats: load(STORAGE_KEYS.askprac, {}) }),

  updateRule: (rule, f) =>
    set((s) => {
      const stats = {
        ...s.stats,
        [rule]: f(s.stats[rule] || { ...EMPTY, done: {} }),
      };
      save(STORAGE_KEYS.askprac, stats);
      return { stats };
    }),

  resetRule: (rule) =>
    set((s) => {
      const stats = { ...s.stats };
      delete stats[rule];
      save(STORAGE_KEYS.askprac, stats);
      return { stats };
    }),
}));
