import { useCallback, useMemo } from "react";

import { LEVELS } from "@/const/levels.constant";
import { allLevelData, dueKeysOf } from "@/lib/helpers/derived.helper";
import { flatten, levelData } from "@/lib/helpers/level-data.helper";
import { dueMistakesOf } from "@/lib/helpers/mistakes.helper";
import { itemKey, today } from "@/lib/helpers/storage.helper";
import { useLevelStore } from "@/stores/useLevelStore";
import { useMistakeStore } from "@/stores/useMistakeStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { useExtraWords } from "@/stores/useSharedWordsStore";

// Data turunan yang dipakai banyak komponen shell & halaman: level aktif,
// data level, semua item, progres, dan kunci jatuh tempo.
export const useShellData = () => {
  const level = useLevelStore((s) => s.level);
  const week = useLevelStore((s) => s.week);
  const custom = useExtraWords();
  const known = useProgressStore((s) => s.known);
  const srs = useProgressStore((s) => s.srs);
  const own = useProgressStore((s) => s.own);
  const doneToday = useProgressStore((s) => s.doneToday);

  const data = useMemo(() => levelData(level, custom), [level, custom]);
  const allLevels = useMemo(() => allLevelData(custom), [custom]);
  const all = useMemo(() => flatten(data.V), [data]);
  const dueKeys = useMemo(() => dueKeysOf(srs, known), [srs, known]);
  // "Buku kesalahanku" cards due in Ulang (none when switched off there).
  const mistakeItems = useMistakeStore((s) => s.items);
  const mistakeReviewOn = useMistakeStore((s) => s.reviewOn);
  const mistakeIntro = useMistakeStore((s) => s.intro);
  const dueMistakes = useMemo(
    () =>
      dueMistakesOf(
        {
          v: 2,
          items: mistakeItems,
          reviewOn: mistakeReviewOn,
          intro: mistakeIntro,
        },
        today(),
      ),
    [mistakeItems, mistakeReviewOn, mistakeIntro],
  );
  const scheduled = useMemo(
    () => Object.keys(srs).filter((k) => known[k]).length,
    [srs, known],
  );
  const keyOf = useCallback(
    (w: number | string, type: string, en: string) =>
      itemKey(level, w, type, en),
    [level],
  );
  const LV = LEVELS.find((l) => l[0] === level) || LEVELS[1];
  const knownCount = useMemo(
    () => all.filter((x) => known[keyOf(x.w, x.it[0], x.it[1])]).length,
    [all, known, keyOf],
  );

  return {
    level,
    week,
    data,
    all,
    allLevels,
    known,
    srs,
    own,
    doneToday,
    dueKeys,
    dueMistakes,
    scheduled,
    keyOf,
    LV,
    knownCount,
  };
};
