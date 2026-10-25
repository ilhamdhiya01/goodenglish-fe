import { allLevelData, migrateProgress } from "@/lib/helpers/derived.helper";
import { load, save, STORAGE_KEYS } from "@/lib/helpers/storage.helper";
import type { PlanData } from "@/lib/types/plan.types";
import type { ProgressSnapshot } from "@/lib/types/progress.types";
import type { CustomWord } from "@/lib/types/vocab.types";
import { useAskPracticeStore } from "@/stores/useAskPracticeStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { usePlanStore } from "@/stores/usePlanStore";
import { useProgressStore } from "@/stores/useProgressStore";

// Ekspor/impor progres — format v3, kompatibel dengan file ekspor lama (v1/v2).

export const exportProgress = () => {
  try {
    const P = useProgressStore.getState();
    const { level } = useLevelStore.getState();
    const d: ProgressSnapshot = {
      v: 3,
      exportedAt: new Date().toISOString(),
      known: P.known,
      srs: P.srs,
      own: P.own,
      custom: P.custom,
      level,
      plan: usePlanStore.getState().plan,
      askprac: useAskPracticeStore.getState().stats,
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

  return (
    "Progres diimpor: " +
    Object.keys(d.known).length +
    " kata hafal" +
    (Array.isArray(d.custom) ? ", " + d.custom.length + " kata tambahan" : "") +
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
