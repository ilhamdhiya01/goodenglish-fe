import { create } from "zustand";

import {
  addTo,
  EMPTY_MISTAKES,
  gradeIn,
  normalizeMistakes,
  setStatusIn,
} from "@/lib/helpers/mistakes.helper";
import type { SrsAnswer } from "@/lib/helpers/srs.helper";
import { load, save, STORAGE_KEYS, today } from "@/lib/helpers/storage.helper";
import { laporAktivitas } from "@/lib/rencana/lapor";
import type {
  MistakeData,
  MistakeInput,
  MistakeStatus,
} from "@/lib/types/mistake.types";
import { useActivityStore } from "@/stores/useActivityStore";
import { usePlanStore } from "@/stores/usePlanStore";
import { useProgressStore } from "@/stores/useProgressStore";

// "Buku kesalahanku" (progress doc `mistakes`, included in Export/Import):
// the learner's own mistakes from every feature, one record per pattern,
// each with its own review schedule for Ulang.

const pick = (s: MistakeData): MistakeData => ({
  v: 2,
  items: s.items,
  reviewOn: s.reviewOn,
  intro: s.intro,
});

const read = (): { data: MistakeData; legacy: boolean } => {
  const raw = load<unknown>(STORAGE_KEYS.mistakes, EMPTY_MISTAKES);
  return { data: normalizeMistakes(raw, today()), legacy: Array.isArray(raw) };
};

interface MistakeState extends MistakeData {
  /** Save a mistake; "repeat" when the same pattern was there already. */
  add: (m: MistakeInput) => "new" | "repeat" | null;
  addMany: (list: MistakeInput[]) => void;
  /** Answer its card in Ulang (also counts in "selesai hari ini"). */
  grade: (id: string, how: SrsAnswer, typed?: string) => void;
  setStatus: (id: string, status: MistakeStatus) => void;
  /** Delete for good: the same mistake made again is saved as a new one. */
  remove: (id: string) => void;
  setReviewOn: (on: boolean) => void;
  setAll: (f: (cur: MistakeData) => MistakeData) => void;
  hydrate: () => void;
}

export const useMistakeStore = create<MistakeState>((set, get) => {
  const commit = (next: MistakeData) => {
    save(STORAGE_KEYS.mistakes, next);
    set(next);
  };
  const init = () => {
    const { data, legacy } = read();
    // The old list has no schedule yet: write it once in the new shape, so
    // "due tomorrow" is fixed from today instead of moving every day.
    if (legacy && data.items.length) save(STORAGE_KEYS.mistakes, data);
    return data;
  };
  return {
    ...init(),
    hydrate: () => set(init()),
    add: (m) => {
      const { data, result } = addTo(
        pick(get()),
        m,
        new Date().toISOString(),
        today(),
      );
      if (result) commit(data);
      return result;
    },
    addMany: (list) => list.forEach((m) => get().add(m)),
    grade: (id, how, typed) => {
      commit(
        gradeIn(pick(get()), id, how, today(), new Date().toISOString(), typed),
      );
      laporAktivitas("kartu_diulang", {
        data: { kartu: "kesalahan", benar: how === "good" },
      });
      useProgressStore.getState().setDoneToday((n) => n + 1);
      useActivityStore.getState().countReview(how === "good");
      usePlanStore.getState().bumpTally("rev");
    },
    setStatus: (id, status) =>
      commit(
        setStatusIn(pick(get()), id, status, today(), new Date().toISOString()),
      ),
    remove: (id) => {
      const d = pick(get());
      commit({ ...d, items: d.items.filter((m) => m.id !== id) });
    },
    setReviewOn: (reviewOn) => commit({ ...pick(get()), reviewOn }),
    setAll: (f) => commit(f(pick(get()))),
  };
});

/** Record a mistake from any feature ("Buku kesalahanku"). */
export const addMistake = (m: MistakeInput) =>
  useMistakeStore.getState().add(m);
