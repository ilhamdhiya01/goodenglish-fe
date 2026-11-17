import { create } from "zustand";

import { GAPS } from "@/const/srs.constant";
import { allLevelData, migrateProgress } from "@/lib/helpers/derived.helper";
import { load, save, STORAGE_KEYS, today } from "@/lib/helpers/storage.helper";
import { twinIndex, withTwins } from "@/lib/helpers/word-twins.helper";
import type { SrsEntry } from "@/lib/types/progress.types";
import type { CustomWord } from "@/lib/types/vocab.types";
import { usePlanStore } from "@/stores/usePlanStore";
import { useSharedWordsStore } from "@/stores/useSharedWordsStore";

// Semua progres pengguna: kata hafal, jadwal SRS, "Kalimatku", kata tambahan (Kataku),
// dan hitungan ulangan hari ini. Persist manual ke localStorage (kunci & bentuk lama).

interface ProgressState {
  known: Record<string, 1>;
  srs: Record<string, SrsEntry>;
  own: Record<string, string>;
  custom: CustomWord[];
  doneToday: number;

  setKnown: (f: (k: Record<string, 1>) => Record<string, 1>) => void;
  setSrs: (
    f: (s: Record<string, SrsEntry>) => Record<string, SrsEntry>,
  ) => void;
  setOwn: (f: (o: Record<string, string>) => Record<string, string>) => void;
  setCustom: (f: (c: CustomWord[]) => CustomWord[]) => void;
  setDoneToday: (n: number | ((d: number) => number)) => void;

  /** Tandai/urungkan hafal — saat menghafal, kata langsung dijadwalkan besok (st 0). */
  toggleKnown: (key: string) => void;
  /** Tandai hafal tanpa membatalkan ("Simpan ke Ulang"): kata yang belum
   * hafal dijadwalkan besok. False kalau sudah hafal sebelumnya. */
  markKnown: (key: string) => boolean;
  /** Simpan/hapus "Kalimatku" untuk satu kata. */
  setOwnSentence: (key: string, v: string) => void;
  /** Naikkan/turunkan tahap SRS + hitung ulang jatuh tempo. */
  bumpSrs: (key: string, how: "good" | "hard" | "forgot") => void;
  /** Pindahkan progres (hafal/srs/kalimatku) saat kata Kataku diubah en/minggunya. */
  renameProgressKey: (oldKey: string, newKey: string) => void;
  /** Re-read everything from the progress snapshot (after it's fetched). */
  hydrate: () => void;
  /** Hapus satu kata Kataku beserta progresnya. */
  removeCustomWord: (key: string, itemKeyOf: (c: CustomWord) => string) => void;
}

const initCustom = (): CustomWord[] => {
  const c = load<unknown>(STORAGE_KEYS.custom, []);
  return Array.isArray(c) ? (c as CustomWord[]) : [];
};

// Kunci progres lama belum punya segmen tipe ("minggu:kata"). Versi baru
// "minggu:tipe:kata" membedakan kata kembar beda jenis; kunci lama diarahkan
// ke item pertama yang cocok supaya progres yang sudah ada tidak hilang.
// Recomputed by hydrate() once the server snapshot has arrived.
const initialState = () => {
  const customInit = initCustom();
  const initAll = allLevelData(customInit);
  return {
    known: migrateProgress(
      load<Record<string, 1>>(STORAGE_KEYS.known, {}),
      initAll,
    ),
    srs: migrateProgress(
      load<Record<string, SrsEntry>>(STORAGE_KEYS.srs, {}),
      initAll,
    ),
    own: migrateProgress(
      load<Record<string, string>>(STORAGE_KEYS.own, {}),
      initAll,
    ),
    custom: customInit,
    doneToday: (() => {
      const dt = load<{ day?: number; n?: number }>(STORAGE_KEYS.done, {});
      return dt.day === today() ? dt.n || 0 : 0;
    })(),
  };
};

// Same word in other levels (bundled + shared + Kataku), see word-twins.
const twinsNow = (custom: CustomWord[]) =>
  twinIndex(
    allLevelsCached([...useSharedWordsStore.getState().words, ...custom]),
  );

// allLevelData builds every level: reuse it while the word lists are the same.
let lastWords: CustomWord[] | null = null;
let lastAll: ReturnType<typeof allLevelData> | null = null;
const allLevelsCached = (words: CustomWord[]) => {
  const same =
    lastWords &&
    lastWords.length === words.length &&
    lastWords.every((w, i) => w === words[i]);
  if (!same || !lastAll) {
    lastWords = words;
    lastAll = allLevelData(words);
  }
  return lastAll;
};

export const useProgressStore = create<ProgressState>((set, get) => ({
  ...initialState(),
  hydrate: () => {
    set(initialState());
    // Words memorised in one level before twins were shared (or in another
    // level since) count as memorised in every level that has them. Only
    // "known" is filled in: the review schedule stays on the card that was
    // memorised, so the same word is never due twice.
    const { known, custom, setKnown } = get();
    const filled = withTwins(known, twinsNow(custom));
    if (filled !== known) setKnown(() => filled);
  },

  setKnown: (f) =>
    set((s) => {
      const known = f(s.known);
      save(STORAGE_KEYS.known, known);
      return { known };
    }),
  setSrs: (f) =>
    set((s) => {
      const srs = f(s.srs);
      save(STORAGE_KEYS.srs, srs);
      return { srs };
    }),
  setOwn: (f) =>
    set((s) => {
      const own = f(s.own);
      save(STORAGE_KEYS.own, own);
      return { own };
    }),
  setCustom: (f) =>
    set((s) => {
      const custom = f(s.custom);
      save(STORAGE_KEYS.custom, custom);
      return { custom };
    }),
  setDoneToday: (n) =>
    set((s) => {
      const doneToday = typeof n === "function" ? n(s.doneToday) : n;
      save(STORAGE_KEYS.done, { day: today(), n: doneToday });
      return { doneToday };
    }),

  // The same word in other levels follows along (hafal there too, or not
  // any more). Only this card gets a review schedule.
  toggleKnown: (key) => {
    const { setKnown, setSrs, custom } = get();
    const on = get().known[key];
    const keys = [key, ...(twinsNow(custom).get(key) ?? [])];
    if (on) {
      setKnown((k) => {
        const c = { ...k };
        keys.forEach((x) => delete c[x]);
        return c;
      });
      setSrs((s) => {
        const c = { ...s };
        keys.forEach((x) => delete c[x]);
        return c;
      });
      usePlanStore.getState().bumpTally("known", -1);
    } else {
      setKnown((k) => {
        const c = { ...k };
        keys.forEach((x) => (c[x] = 1));
        return c;
      });
      setSrs((s) => ({ ...s, [key]: { st: 0, due: today() + 1 } }));
      usePlanStore.getState().bumpTally("known");
    }
  },

  markKnown: (key) => {
    const { known, setKnown, setSrs, custom } = get();
    if (known[key]) return false;
    const keys = [key, ...(twinsNow(custom).get(key) ?? [])];
    setKnown((k) => {
      const c = { ...k };
      keys.forEach((x) => (c[x] = 1));
      return c;
    });
    setSrs((s) => ({ ...s, [key]: { st: 0, due: today() + 1 } }));
    usePlanStore.getState().bumpTally("known");
    return true;
  },

  setOwnSentence: (key, v) => {
    get().setOwn((o) => {
      const n = { ...o };
      if (v.trim()) n[key] = v;
      else delete n[key];
      return n;
    });
  },

  bumpSrs: (key, how) => {
    const T = today();
    get().setSrs((s) => {
      const cur = s[key] || { st: 0, due: T };
      let st = cur.st;
      if (how === "good") st = Math.min(st + 1, GAPS.length - 1);
      else if (how === "forgot") st = 0;
      const gap =
        how === "forgot"
          ? 1
          : how === "hard"
            ? Math.max(1, Math.round(GAPS[st] / 2))
            : GAPS[st];
      // Dihitung supaya Tanya AI bisa menyarankan kata yang paling sering lupa.
      const lapses = (cur.lapses ?? 0) + (how === "forgot" ? 1 : 0);
      return {
        ...s,
        [key]: { st, due: T + gap, ...(lapses ? { lapses } : {}) },
      };
    });
    get().setDoneToday((n) => n + 1);
  },

  renameProgressKey: (oldKey, newKey) => {
    if (oldKey === newKey) return;
    const { setKnown, setSrs, setOwn } = get();
    setKnown((k) => {
      const n = { ...k };
      if (n[oldKey]) {
        n[newKey] = n[oldKey];
        delete n[oldKey];
      }
      return n;
    });
    setSrs((s) => {
      const n = { ...s };
      if (n[oldKey]) {
        n[newKey] = n[oldKey];
        delete n[oldKey];
      }
      return n;
    });
    setOwn((o) => {
      const n = { ...o };
      if (n[oldKey]) {
        n[newKey] = n[oldKey];
        delete n[oldKey];
      }
      return n;
    });
  },

  removeCustomWord: (key, itemKeyOf) => {
    const { custom, setCustom, setKnown, setSrs, setOwn } = get();
    const c = custom.find((x) => x.key === key);
    if (!c) return;
    const ik = itemKeyOf(c);
    setCustom((cs) => cs.filter((x) => x.key !== key));
    setKnown((kn) => {
      const n = { ...kn };
      delete n[ik];
      return n;
    });
    setSrs((s) => {
      const n = { ...s };
      delete n[ik];
      return n;
    });
    setOwn((o) => {
      const n = { ...o };
      delete n[ik];
      return n;
    });
  },
}));
