import { create } from "zustand";

import { load, save, STORAGE_KEYS } from "@/lib/helpers/storage.helper";
import type { RoleplayRecord } from "@/lib/types/roleplay.types";

// Riwayat "Main peran" (progress doc `roleplay`, ikut ekspor/impor). Terbaru
// di depan, maksimal ROLEPLAY_HISTORY_MAX sesi supaya dokumennya tetap kecil.

export const ROLEPLAY_HISTORY_MAX = 50;

// Data lama/rusak tidak boleh membuat halaman error: buang entri yang tidak
// punya bentuk minimal.
export const validRecord = (r: unknown): r is RoleplayRecord => {
  const x = r as Partial<RoleplayRecord> | null;
  return (
    !!x &&
    typeof x.id === "string" &&
    typeof x.scenarioId === "string" &&
    typeof x.startedAt === "string" &&
    typeof x.durationSec === "number" &&
    Array.isArray(x.transcript) &&
    !!x.summary &&
    typeof x.summary === "object"
  );
};

const read = (): RoleplayRecord[] => {
  const v = load<unknown>(STORAGE_KEYS.roleplay, []);
  return Array.isArray(v) ? v.filter(validRecord) : [];
};

/** Gabung berdasarkan id (yang sudah ada menang), urutkan terbaru dulu. */
export const mergeRoleplay = (
  cur: RoleplayRecord[],
  incoming: unknown,
): RoleplayRecord[] => {
  const have = new Set(cur.map((r) => r.id));
  const add = (Array.isArray(incoming) ? incoming : [])
    .filter(validRecord)
    .filter((r) => !have.has(r.id) && (have.add(r.id), true));
  return [...cur, ...add]
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, ROLEPLAY_HISTORY_MAX);
};

interface RoleplayState {
  history: RoleplayRecord[];
  /** Simpan (atau ganti, kalau id-nya sama) satu sesi. */
  add: (r: RoleplayRecord) => void;
  setHistory: (f: (cur: RoleplayRecord[]) => RoleplayRecord[]) => void;
  hydrate: () => void;
}

export const useRoleplayStore = create<RoleplayState>((set) => ({
  history: read(),
  hydrate: () => set({ history: read() }),
  add: (r) =>
    set((s) => {
      const history = mergeRoleplay(
        [r],
        s.history.filter((x) => x.id !== r.id),
      );
      save(STORAGE_KEYS.roleplay, history);
      return { history };
    }),
  setHistory: (f) =>
    set((s) => {
      const history = f(s.history);
      save(STORAGE_KEYS.roleplay, history);
      return { history };
    }),
}));

/** Total detik Main peran pada satu level + minggu kurikulum (checkpoint Rencana). */
export const roleplaySeconds = (
  history: RoleplayRecord[],
  level: string,
  week: number,
) =>
  history
    .filter((r) => r.level === level && r.week === week)
    .reduce((n, r) => n + Math.max(0, r.durationSec || 0), 0);
