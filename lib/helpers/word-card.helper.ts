import { guessType, type LevelData } from "@/lib/helpers/level-data.helper";
import { findVocab, vocabIndex } from "@/lib/helpers/reading.helper";
import { itemKey } from "@/lib/helpers/storage.helper";
import type { CustomWord } from "@/lib/types/vocab.types";
import { useProgressStore } from "@/stores/useProgressStore";

// "Simpan ke Ulang" from anywhere (Bacaan today; Tanya AI or Main peran
// later). A word that is in Kosakata is marked memorised, like "Tandai
// hafal"; any other word becomes a personal card (Kataku, private to this
// learner) in the given level and week. Either way it is due in Ulang
// tomorrow. Saving twice never un-marks it.

export interface SaveWordInput {
  en: string;
  meaningId: string;
  pron?: string;
  /** Usually the sentence it was found in. */
  example: string;
  /** e.g. "Bacaan: A busy Monday" */
  source: string;
  level: string;
  week: number;
  /** Known Kosakata card (when the meaning came from it). */
  key?: string;
}

export interface SaveWordResult {
  /** "already": was memorised (and scheduled) before. */
  status: "scheduled" | "already";
  key: string;
  /** A new personal card was made. */
  created: boolean;
}

export const saveToReview = (
  input: SaveWordInput,
  allLevels: Record<string, LevelData>,
): SaveWordResult => {
  const P = useProgressStore.getState();
  const en = input.en.trim();
  const hitKey =
    input.key ??
    findVocab(
      vocabIndex(allLevels),
      en,
      input.level,
      input.week,
      input.meaningId,
    )?.key;
  if (hitKey) {
    const added = P.markKnown(hitKey);
    return {
      status: added ? "scheduled" : "already",
      key: hitKey,
      created: false,
    };
  }
  const type = guessType(en);
  const card: CustomWord = {
    key: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    level: input.level,
    week: input.week,
    type,
    en,
    id: input.meaningId.trim(),
    pron: (input.pron ?? "").trim(),
    ex: input.example.trim(),
    personal: true,
    source: input.source,
  };
  P.setCustom((cs) => [...cs, card]);
  const key = itemKey(input.level, input.week, type, en);
  P.markKnown(key);
  return { status: "scheduled", key, created: true };
};
