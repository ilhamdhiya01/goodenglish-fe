import {
  flatten,
  type LevelData,
  sameWord,
} from "@/lib/helpers/level-data.helper";
import { itemKey } from "@/lib/helpers/storage.helper";
import type { Item } from "@/lib/types/vocab.types";

// "Kembaran" sebuah kartu: kata yang sama (ejaan, jenis, dan arti; lihat
// sameWord) di level lain. Pelajar yang sudah hafal "chicken = ayam" di Pemula
// tidak perlu menghafalnya lagi di Pre-intermediate.

interface Entry {
  key: string;
  it: Item;
}

const cache = new WeakMap<Record<string, LevelData>, Map<string, string[]>>();

/** Kunci progres → kunci kembarannya di level lain (tanpa dirinya sendiri). */
export const twinIndex = (
  all: Record<string, LevelData>,
): Map<string, string[]> => {
  const hit = cache.get(all);
  if (hit) return hit;
  const byWord = new Map<string, (Entry & { lv: string })[]>();
  for (const [lv, data] of Object.entries(all))
    for (const { w, it } of flatten(data.V)) {
      const word = it[0] + "|" + it[1].toLowerCase().trim();
      const list = byWord.get(word) ?? [];
      list.push({ key: itemKey(lv, w, it[0], it[1]), it, lv });
      byWord.set(word, list);
    }
  const twins = new Map<string, string[]>();
  for (const list of byWord.values()) {
    if (list.length < 2) continue;
    for (const a of list) {
      const keys = list
        .filter((b) => b.lv !== a.lv && sameWord(a.it, b.it))
        .map((b) => b.key);
      if (keys.length) twins.set(a.key, keys);
    }
  }
  cache.set(all, twins);
  return twins;
};

/**
 * Tambahkan kembaran setiap kata yang sudah hafal. Mengembalikan objek yang
 * sama kalau tidak ada yang ditambahkan.
 */
export const withTwins = (
  known: Record<string, 1>,
  twins: Map<string, string[]>,
): Record<string, 1> => {
  let out = known;
  for (const k of Object.keys(known))
    for (const t of twins.get(k) ?? [])
      if (!out[t]) {
        if (out === known) out = { ...known };
        out[t] = 1;
      }
  return out;
};
