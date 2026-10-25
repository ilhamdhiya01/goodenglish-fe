import { LEVELS } from "@/const/levels.constant";
import type { LevelData } from "@/lib/helpers/level-data.helper";
import { levelData } from "@/lib/helpers/level-data.helper";
import { itemKey, today } from "@/lib/helpers/storage.helper";
import type { SrsEntry } from "@/lib/types/progress.types";
import type { CustomWord, Item } from "@/lib/types/vocab.types";

// Perhitungan turunan dari state — pure function, dipanggil lewat useMemo di komponen.

export const allLevelData = (
  custom: CustomWord[],
): Record<string, LevelData> => {
  const o: Record<string, LevelData> = {};
  LEVELS.forEach(([id]) => {
    o[id] = levelData(id, custom);
  });
  return o;
};

/** Kunci-kata yang jatuh tempo hari ini (hanya yang ditandai hafal). */
export const dueKeysOf = (
  srs: Record<string, SrsEntry>,
  known: Record<string, 1>,
): string[] => {
  const T = today();
  return Object.keys(srs).filter((k) => srs[k].due <= T && known[k]);
};

/** Kunci → item kata. Format: "[level|]minggu:tipe:kataInggris" (level 'pre' tanpa prefix).
 * Kunci lama tanpa segmen tipe masih dikenali dan diarahkan ke item pertama yang cocok. */
export const resolveItemKey = (
  allLevels: Record<string, LevelData>,
  k: string,
): { lid: string; w: string; it: Item } | null => {
  const m = k.match(/^(?:([a-z]+)\|)?(\d+):(?:(w|pv|col|st|ex|cj):)?(.*)$/);
  if (!m) return null;
  const lid = m[1] || "pre";
  const w = m[2];
  const type = m[3];
  const en = m[4];
  const d = allLevels[lid];
  const it =
    d &&
    d.V[w] &&
    d.V[w].items.find((i) => i[1] === en && (!type || i[0] === type));
  return it ? { lid, w, it } : null;
};

/** Tulis ulang peta progres ke format kunci bertipe. Kunci lama tanpa tipe
 * diarahkan ke item pertama yang cocok; kunci yang tidak resolve dibiarkan apa adanya. */
export const migrateProgress = <T>(
  m: Record<string, T>,
  allLevels: Record<string, LevelData>,
): Record<string, T> => {
  const out: Record<string, T> = {};
  Object.entries(m).forEach(([k, v]) => {
    const r = resolveItemKey(allLevels, k);
    out[r ? itemKey(r.lid, r.w, r.it[0], r.it[1]) : k] = v;
  });
  return out;
};
