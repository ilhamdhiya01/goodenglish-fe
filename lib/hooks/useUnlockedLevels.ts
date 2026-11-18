import { useMemo } from "react";

import { LEVELS } from "@/const/levels.constant";
import { unlockedLevels } from "@/lib/helpers/exam.helper";
import type { LevelId } from "@/lib/types/session.types";
import { useAccessStore } from "@/stores/useAccessStore";
import { useExamStore } from "@/stores/useExamStore";
import { useLevelStore } from "@/stores/useLevelStore";

/** Levels the learner may pick now ("Wajib lulus ujian" may hold some
 * back even though the token allows them). */
export const useUnlockedLevels = (): LevelId[] => {
  const allowed = useAccessStore((s) => s.session?.levels);
  const requireExam = useAccessStore((s) => !!s.session?.requireExam);
  const attempts = useExamStore((s) => s.attempts);
  const base = useExamStore((s) => s.base);
  const placement = useExamStore((s) => s.placement);
  const current = useLevelStore((s) => s.level) as LevelId;
  return useMemo(
    () =>
      unlockedLevels({
        allowed: LEVELS.map((l) => l[0] as LevelId).filter((l) =>
          allowed?.includes(l),
        ),
        requireExam,
        exam: { attempts, base, placement },
        current,
      }),
    [allowed, requireExam, attempts, base, placement, current],
  );
};
