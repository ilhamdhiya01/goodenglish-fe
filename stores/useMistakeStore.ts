import { create } from "zustand";

import { load, save, STORAGE_KEYS } from "@/lib/helpers/storage.helper";
import type { MistakeRecord } from "@/lib/types/roleplay.types";

// Kesalahan yang terkumpul (progress doc `mistakes`, ikut ekspor/impor).
// "Buku kesalahanku" belum ada; datanya disimpan dalam format spesifikasi
// supaya nanti tinggal dibaca. Terbaru di depan, maksimal MISTAKES_MAX.

export const MISTAKES_MAX = 500;

const validMistake = (m: unknown): m is MistakeRecord => {
  const x = m as Partial<MistakeRecord> | null;
  return (
    !!x &&
    typeof x.id === "string" &&
    typeof x.wrong === "string" &&
    typeof x.correct === "string" &&
    typeof x.createdAt === "string"
  );
};

const read = (): MistakeRecord[] => {
  const v = load<unknown>(STORAGE_KEYS.mistakes, []);
  return Array.isArray(v) ? v.filter(validMistake) : [];
};

/** Gabung berdasarkan id (yang sudah ada menang), urutkan terbaru dulu. */
export const mergeMistakes = (
  cur: MistakeRecord[],
  incoming: unknown,
): MistakeRecord[] => {
  const have = new Set(cur.map((m) => m.id));
  const add = (Array.isArray(incoming) ? incoming : [])
    .filter(validMistake)
    .filter((m) => !have.has(m.id) && (have.add(m.id), true));
  return [...cur, ...add]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MISTAKES_MAX);
};

interface MistakeState {
  mistakes: MistakeRecord[];
  addMany: (list: MistakeRecord[]) => void;
  setMistakes: (f: (cur: MistakeRecord[]) => MistakeRecord[]) => void;
  hydrate: () => void;
}

export const useMistakeStore = create<MistakeState>((set) => ({
  mistakes: read(),
  hydrate: () => set({ mistakes: read() }),
  addMany: (list) =>
    set((s) => {
      const mistakes = mergeMistakes(list, s.mistakes);
      save(STORAGE_KEYS.mistakes, mistakes);
      return { mistakes };
    }),
  setMistakes: (f) =>
    set((s) => {
      const mistakes = f(s.mistakes);
      save(STORAGE_KEYS.mistakes, mistakes);
      return { mistakes };
    }),
}));
