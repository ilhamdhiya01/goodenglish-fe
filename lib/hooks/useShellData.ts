import { useCallback, useMemo } from "react";

import { LEVELS } from "@/const/levels.constant";
import { allLevelData, dueKeysOf } from "@/lib/helpers/derived.helper";
import { flatten, levelData } from "@/lib/helpers/level-data.helper";
import { dueMistakesOf } from "@/lib/helpers/mistakes.helper";
import { itemKey } from "@/lib/helpers/storage.helper";
import { useToday } from "@/lib/hooks/useToday";
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
  const doneTodayRaw = useProgressStore((s) => s.doneToday);
  const doneDay = useProgressStore((s) => s.doneDay);

  const data = useMemo(() => levelData(level, custom), [level, custom]);
  const allLevels = useMemo(() => allLevelData(custom), [custom]);
  const all = useMemo(() => flatten(data.V), [data]);
  // Re-read when the learning day changes while the app stays open.
  const T = useToday();
  // Counted for today only (the tab may have stayed open past midnight).
  const doneToday = doneDay === T ? doneTodayRaw : 0;
  const dueKeys = useMemo(
    () => dueKeysOf(srs, known, allLevels, T),
    [srs, known, allLevels, T],
  );
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
        T,
      ),
    [mistakeItems, mistakeReviewOn, mistakeIntro, T],
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
