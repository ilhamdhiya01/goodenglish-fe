import { allLevelData, migrateProgress } from "@/lib/helpers/derived.helper";
import { mergeMistakeData } from "@/lib/helpers/mistakes.helper";
import { load, save, STORAGE_KEYS, today } from "@/lib/helpers/storage.helper";
import type { PlanData } from "@/lib/types/plan.types";
import type { ProgressSnapshot } from "@/lib/types/progress.types";
import type { CustomWord } from "@/lib/types/vocab.types";
import { useAskPracticeStore } from "@/stores/useAskPracticeStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { mergeListening, useListeningStore } from "@/stores/useListeningStore";
import { useMistakeStore } from "@/stores/useMistakeStore";
import { usePlanStore } from "@/stores/usePlanStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { mergeReading, useReadingStore } from "@/stores/useReadingStore";
import {
  mergeRoleplay,
  useRoleplayStore,
  validRecord,
} from "@/stores/useRoleplayStore";

// Ekspor/impor progres — format v7, kompatibel dengan file ekspor lama
// (v1–v6). Kunci yang tidak ada di file lama diberi nilai default kosong.

export const exportProgress = () => {
  try {
    const P = useProgressStore.getState();
    const { level } = useLevelStore.getState();
    const d: ProgressSnapshot = {
      v: 7,
      exportedAt: new Date().toISOString(),
      known: P.known,
      srs: P.srs,
      own: P.own,
      custom: P.custom,
      level,
      plan: usePlanStore.getState().plan,
      askprac: useAskPracticeStore.getState().stats,
      roleplay: useRoleplayStore.getState().history,
      mistakes: (({ v, items, reviewOn, intro }) => ({
        v,
        items,
        reviewOn,
        intro,
      }))(useMistakeStore.getState()),
      listening: (({ results, stages, seen, pairs }) => ({
        results,
        stages,
        seen,
        pairs,
      }))(useListeningStore.getState()),
      reading: (({ results, done, lookups }) => ({ results, done, lookups }))(
        useReadingStore.getState(),
      ),
    };
    const blob = new Blob([JSON.stringify(d, null, 1)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download =
      "vocab-progress-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch {
    /* ignore */
  }
};

/** Terapkan snapshot ke stores. Return ringkasan untuk ditampilkan ke pengguna. */
export const applyImport = (d: ProgressSnapshot): string => {
  if (!d || !d.known) throw new Error("invalid");
  const P = useProgressStore.getState();

  // Kataku digabung dulu supaya kunci progres miliknya ikut ter-resolve saat migrasi.
  if (Array.isArray(d.custom)) {
    P.setCustom((c) => {
      const have = new Set(c.map((x) => x.key));
      return [
        ...c,
        ...(d.custom as CustomWord[]).filter(
          (x) => x && x.key && !have.has(x.key),
        ),
      ];
    });
  }

  // File ekspor lama memakai kunci tanpa tipe ("minggu:kata"); tulis ulang ke
  // format bertipe sebelum digabung supaya cocok dengan lookup itemKey sekarang.
  const all = allLevelData(useProgressStore.getState().custom);
  P.setKnown((k) => ({ ...k, ...migrateProgress(d.known, all) }));
  P.setSrs((s) => ({ ...s, ...migrateProgress(d.srs || {}, all) }));
  P.setOwn((o) => ({ ...o, ...migrateProgress(d.own || {}, all) }));

  // Riwayat tes digabung per tanggal; checklist hari/minggu yang lama menang.
  if (d.plan && typeof d.plan === "object") {
    const dp = d.plan as PlanData;
    usePlanStore.getState().setPlan((cur) => {
      const qz = [...(cur.quiz || []), ...(dp.quiz || [])];
      const seenQ = new Set<number>();
      return {
        ...dp,
        ...cur,
        days: { ...(dp.days || {}), ...(cur.days || {}) },
        week: { ...(dp.week || {}), ...(cur.week || {}) },
        quiz: qz
          .filter((q) => q && !seenQ.has(q.d) && (seenQ.add(q.d), true))
          .sort((a, b) => a.d - b.d),
      };
    });
  }

  // Statistik latihan Bertanya: ambil yang lebih maju per rumus.
  if (d.askprac && typeof d.askprac === "object") {
    try {
      const cur = load<Record<string, { seen?: number }>>(
        STORAGE_KEYS.askprac,
        {},
      );
      const m: Record<string, unknown> = {
        ...(d.askprac as Record<string, unknown>),
      };
      Object.keys(cur).forEach((k) => {
        const inc = m[k] as { seen?: number } | undefined;
        if (!inc || (cur[k]?.seen || 0) >= (inc.seen || 0)) m[k] = cur[k];
      });
      save(STORAGE_KEYS.askprac, m);
      useAskPracticeStore.setState({
        stats: m as ReturnType<typeof useAskPracticeStore.getState>["stats"],
      });
    } catch {
      /* ignore */
    }
  }

  // v4: riwayat Main peran & kesalahan, digabung per id (file lama: kosong).
  const rp = Array.isArray(d.roleplay)
    ? d.roleplay.filter(validRecord).length
    : 0;
  if (rp) {
    useRoleplayStore
      .getState()
      .setHistory((cur) => mergeRoleplay(cur, d.roleplay));
  }
  // v4–v6: an array; v7: { v: 2, items, … }. Combined per pattern.
  if (d.mistakes && typeof d.mistakes === "object") {
    useMistakeStore
      .getState()
      .setAll((cur) => mergeMistakeData(cur, d.mistakes, today()));
  }

  // v5: Menyimak (file lama: tidak ada, tidak diubah).
  if (d.listening && typeof d.listening === "object") {
    useListeningStore
      .getState()
      .setAll((cur) => mergeListening(cur, d.listening));
  }

  // v6: Bacaan (file lama: tidak ada, tidak diubah).
  if (d.reading && typeof d.reading === "object") {
    useReadingStore.getState().setAll((cur) => mergeReading(cur, d.reading));
  }

  return (
    "Progres diimpor: " +
    Object.keys(d.known).length +
    " kata hafal" +
    (Array.isArray(d.custom) ? ", " + d.custom.length + " kata tambahan" : "") +
    (rp ? ", " + rp + " sesi main peran" : "") +
    "."
  );
};

export const importProgressFile = (
  file: File,
  onDone: (msg: string) => void,
) => {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(String(rd.result));
      onDone(applyImport(d));
    } catch {
      onDone("File tidak valid.");
    }
  };
  rd.readAsText(file);
};
