import { create } from "zustand";

import {
  allLevelData,
  migrateProgress,
  resolveItemKey,
} from "@/lib/helpers/derived.helper";
import { nextSrs } from "@/lib/helpers/srs.helper";
import {
  itemKey,
  load,
  save,
  STORAGE_KEYS,
  today,
} from "@/lib/helpers/storage.helper";
import { twinIndex, withTwins } from "@/lib/helpers/word-twins.helper";
import { laporAktivitas } from "@/lib/rencana/lapor";
import type { SrsEntry } from "@/lib/types/progress.types";
import type { CustomWord } from "@/lib/types/vocab.types";
import { useActivityStore } from "@/stores/useActivityStore";
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
  /** Day `doneToday` belongs to. */
  doneDay: number;

  setKnown: (f: (k: Record<string, 1>) => Record<string, 1>) => void;
  setSrs: (
    f: (s: Record<string, SrsEntry>) => Record<string, SrsEntry>,
  ) => void;
  setOwn: (f: (o: Record<string, string>) => Record<string, string>) => void;
  setCustom: (f: (c: CustomWord[]) => CustomWord[]) => void;
  setDoneToday: (n: number | ((d: number) => number)) => void;

  /** Tandai/urungkan hafal — saat menghafal, kata langsung dijadwalkan besok
   * (st 0). Riwayat ulang (srs) tidak dihapus saat diurungkan. */
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
    ...(() => {
      const dt = load<{ day?: number; n?: number }>(STORAGE_KEYS.done, {});
      const T = today();
      return { doneToday: dt.day === T ? dt.n || 0 : 0, doneDay: T };
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

/**
 * Rencana: a word marked or unmarked, with its level and week (from the
 * key) and how many words of that week are still unmarked.
 */
const laporKata = (jenis: "kata_ditandai" | "kata_batal", key: string) => {
  const { known, custom } = useProgressStore.getState();
  const all = allLevelsCached([
    ...useSharedWordsStore.getState().words,
    ...custom,
  ]);
  const hit = resolveItemKey(all, key);
  const week = hit ? Number(hit.w) : null;
  const sisa = hit
    ? all[hit.lid].V[hit.w].items.filter(
        (it) => !known[itemKey(hit.lid, hit.w, it[0], it[1])],
      ).length
    : null;
  laporAktivitas(jenis, {
    level: hit?.lid ?? null,
    week,
    data: { kunci: key, sisa },
  });
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
  // A new day starts from 0 even when the tab stayed open past midnight.
  setDoneToday: (n) =>
    set((s) => {
      const T = today();
      const base = s.doneDay === T ? s.doneToday : 0;
      const doneToday = typeof n === "function" ? n(base) : n;
      save(STORAGE_KEYS.done, { day: T, n: doneToday });
      return { doneToday, doneDay: T };
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
      // The review history (srs) stays: taking a word out of Ulang must not
      // lose it. Without `known` it is simply not due.
      usePlanStore.getState().bumpTally("known", -1);
      useActivityStore.getState().countLearned(-1);
      laporKata("kata_batal", key);
    } else {
      setKnown((k) => {
        const c = { ...k };
        keys.forEach((x) => (c[x] = 1));
        return c;
      });
      setSrs((s) =>
        s[key] ? s : { ...s, [key]: { st: 0, due: today() + 1 } },
      );
      usePlanStore.getState().bumpTally("known");
      useActivityStore.getState().countLearned(1);
      laporKata("kata_ditandai", key);
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
    // A word back in Ulang keeps its earlier review history.
    setSrs((s) => (s[key] ? s : { ...s, [key]: { st: 0, due: today() + 1 } }));
    usePlanStore.getState().bumpTally("known");
    useActivityStore.getState().countLearned(1);
    laporKata("kata_ditandai", key);
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { gap, ...next } = nextSrs(s[key] || { st: 0, due: T }, how, T);
      return { ...s, [key]: next };
    });
    get().setDoneToday((n) => n + 1);
    useActivityStore.getState().countReview(how === "good");
    usePlanStore.getState().bumpTally("rev");
    laporAktivitas("kartu_diulang", {
      data: { kartu: "kata", benar: how === "good" },
    });
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
