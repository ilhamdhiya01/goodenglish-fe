import { create } from "zustand";

import { LEVELS } from "@/const/levels.constant";
import { loadStr, saveStr, STORAGE_KEYS } from "@/lib/helpers/storage.helper";

// Level & minggu aktif. Dipersist per level: vocab-week-<level> + vocab-level-v1.

const initLevel = () => {
  const id = loadStr(STORAGE_KEYS.level) || "pre";
  return LEVELS.some((l) => l[0] === id) ? id : "pre";
};
const initWeek = (level: string) =>
  +(loadStr(STORAGE_KEYS.week(level)) || "") ||
  +(loadStr(STORAGE_KEYS.weekLegacy) || "") ||
  1;

interface LevelState {
  level: string;
  week: number;
  /** Ganti level; minggu ikut tersimpan/terbaca per level. */
  setLevel: (id: string) => void;
  setWeek: (n: number) => void;
  /** Re-read level/week from the progress snapshot (after it's fetched). */
  hydrate: () => void;
}

export const useLevelStore = create<LevelState>((set, get) => ({
  level: initLevel(),
  week: initWeek(initLevel()),
  hydrate: () => set({ level: initLevel(), week: initWeek(initLevel()) }),

  setLevel: (id) => {
    if (!LEVELS.some((l) => l[0] === id)) return;
    saveStr(STORAGE_KEYS.level, id);
    set({ level: id, week: +(loadStr(STORAGE_KEYS.week(id)) || "") || 1 });
  },

  setWeek: (n) => {
    saveStr(STORAGE_KEYS.week(get().level), String(n));
    set({ week: n });
  },
}));
