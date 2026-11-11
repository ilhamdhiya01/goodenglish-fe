import { usePathname } from "next/navigation";
import { useMemo } from "react";

import {
  buildSuggestions,
  type SuggestionWord,
} from "@/lib/helpers/ai-suggestions.helper";
import { resolveItemKey } from "@/lib/helpers/derived.helper";
import { useShellData } from "@/lib/hooks/useShellData";

const WORDS = 2;

// Saran pertanyaan untuk panel Tanya AI yang masih kosong, dari halaman yang
// dibuka dan riwayat ulangan pelajar (lihat ai-suggestions.helper).
export const useAiSuggestions = (): string[] => {
  const pathname = usePathname();
  const { week, data, srs, known, dueKeys, allLevels } = useShellData();

  return useMemo(() => {
    const toWord = (key: string): SuggestionWord | null => {
      const hit = resolveItemKey(allLevels, key);
      return hit ? { en: hit.it[1], meaning: hit.it[3] } : null;
    };
    const words = (keys: string[]) =>
      keys
        .map(toWord)
        .filter((w): w is SuggestionWord => !!w)
        .slice(0, WORDS);

    const forgottenKeys = Object.keys(srs)
      .filter((k) => known[k] && (srs[k].lapses ?? 0) > 0)
      .sort((a, b) => (srs[b].lapses ?? 0) - (srs[a].lapses ?? 0));
    const forgotten = words(forgottenKeys);
    const due = forgotten.length
      ? []
      : words(dueKeys.filter((k) => !forgottenKeys.includes(k)));

    return buildSuggestions({
      page: pathname.split("/")[1] ?? "",
      week,
      plan: data.plan.find((p) => p[0] === week),
      forgotten,
      due,
    });
  }, [pathname, week, data, srs, known, dueKeys, allLevels]);
};
