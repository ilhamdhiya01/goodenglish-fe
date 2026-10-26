import { useMemo } from "react";
import { create } from "zustand";

import type { CustomWord } from "@/lib/types/vocab.types";
import type { SharedWord } from "@/lib/types/words.types";
import { useProgressStore } from "@/stores/useProgressStore";

// Kosakata bersama buatan admin, dalam bentuk CustomWord supaya levelData()
// bisa menggabungkannya persis seperti Kataku. Kuncinya diawali SHARED_PREFIX
// (item[6]) supaya kartu bisa membedakannya dari Kataku pribadi.
export const SHARED_PREFIX = "s:";

export const isSharedKey = (key?: string) => !!key?.startsWith(SHARED_PREFIX);

const toCustom = (w: SharedWord): CustomWord => ({
  key: SHARED_PREFIX + w.id,
  level: w.level,
  week: w.week,
  type: w.type,
  en: w.en,
  id: w.meaning,
  pron: w.pron,
  ex: w.example,
});

interface SharedWordsState {
  words: CustomWord[];
  setWords: (list: SharedWord[]) => void;
}

export const useSharedWordsStore = create<SharedWordsState>((set) => ({
  words: [],
  setWords: (list) => set({ words: list.map(toCustom) }),
}));

/** Kata bersama + Kataku pribadi — yang dioper ke levelData()/allLevelData(). */
export const useExtraWords = (): CustomWord[] => {
  const shared = useSharedWordsStore((s) => s.words);
  const custom = useProgressStore((s) => s.custom);
  return useMemo(() => [...shared, ...custom], [shared, custom]);
};

/** Versi non-hook dari useExtraWords, untuk callback. */
export const extraWords = (): CustomWord[] => [
  ...useSharedWordsStore.getState().words,
  ...useProgressStore.getState().custom,
];
