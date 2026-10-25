// Kunci localStorage — sama persis dengan versi HTML supaya progres lama
// dan file ekspor tetap terbaca. JANGAN diubah nilainya.

export const STORAGE_KEYS = {
  known: "vocab-known-v1",
  srs: "vocab-srs-v1",
  own: "vocab-own-v1",
  done: "vocab-done-v1",
  custom: "vocab-custom-v1",
  level: "vocab-level-v1",
  week: (level: string) => "vocab-week-" + level,
  weekLegacy: "vocab-week-v1",
  voice: "vocab-voice-v1",
  askprac: "vocab-askprac-v1",
  flip: "vocab-flip-v1",
  searchScope: "vocab-search-scope-v1",
  plan: "vocab-plan-v1",
  practiceSession: "vocab-practice-session-v1",
} as const;
