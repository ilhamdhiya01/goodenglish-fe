import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { LEVELS } from "@/const/levels.constant";
import { allLevelData } from "@/lib/helpers/derived.helper";
import { flatten } from "@/lib/helpers/level-data.helper";
import { itemKey } from "@/lib/helpers/storage.helper";
import type { Item } from "@/lib/types/vocab.types";
import { useAccessStore } from "@/stores/useAccessStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { useQuizStore } from "@/stores/useQuizStore";
import { extraWords } from "@/stores/useSharedWordsStore";
import { useVocabUiStore } from "@/stores/useVocabUiStore";

// Lompat ke satu kata: pindah level & minggu bila perlu, buka halaman Kosakata,
// dan sorot kartunya sesaat (penjelasan kata terbuka otomatis).
export const useJumpToWord = () => {
  const router = useRouter();

  const jumpTo = useCallback(
    (lv: string, w: number, it: Item) => {
      const lvl = useLevelStore.getState();
      if (lv !== lvl.level) lvl.setLevel(lv);
      lvl.setWeek(w);
      const ui = useVocabUiStore.getState();
      ui.resetBrowse();
      useQuizStore.getState().close();
      router.push("/vocab");
      ui.flashFocus(itemKey(lv, w, it[0], it[1]));
    },
    [router],
  );

  // "Lihat juga": cari kata di level aktif dulu, kalau tidak ada cari di level lain.
  const jumpToWord = useCallback(
    (en: string) => {
      const low = en.toLowerCase();
      const lvl = useLevelStore.getState().level;
      const allLevels = allLevelData(extraWords());
      const hit = flatten(allLevels[lvl].V).find(
        (x) => x.it[1].toLowerCase() === low,
      );
      if (hit) return jumpTo(lvl, hit.w, hit.it);
      // Only search levels this access token may open.
      const allowed = useAccessStore.getState().session?.levels ?? [];
      for (const [id] of LEVELS) {
        if (!allowed.includes(id as never)) continue;
        const h = flatten(allLevels[id].V).find(
          (x) => x.it[1].toLowerCase() === low,
        );
        if (h) return jumpTo(id, h.w, h.it);
      }
      // Tidak ketemu: buka Kosakata dengan kata itu sebagai kueri pencarian.
      const ui = useVocabUiStore.getState();
      ui.resetBrowse();
      ui.setQ(en);
      router.push("/vocab");
    },
    [jumpTo, router],
  );

  return { jumpTo, jumpToWord };
};
