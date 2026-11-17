import { levelData } from "@/lib/helpers/level-data.helper";

// The week's own vocabulary and tense, sent to Gemini when an admin
// generates Menyimak items or Bacaan texts (the backend has no course data).

// Most useful types first.
const WORD_TYPES = ["w", "pv", "col", "ex", "cj", "st"];

export const wordsOfWeek = (level: string, week: number, max = 60) => {
  const items = levelData(level, []).V[week]?.items ?? [];
  const seen = new Set<string>();
  return [...items]
    .sort((a, b) => WORD_TYPES.indexOf(a[0]) - WORD_TYPES.indexOf(b[0]))
    .map((it) => it[1].replace(/\s*\([^)]*\)/g, "").trim())
    .filter(
      (w) =>
        w && !seen.has(w.toLowerCase()) && (seen.add(w.toLowerCase()), true),
    )
    .slice(0, max);
};

export const tenseOfWeek = (level: string, week: number) => {
  const d = levelData(level, []);
  const t = d.V[week]?.tense;
  if (t?.name) return { name: t.name, use: t.use };
  const row = d.plan.find((p) => p[0] === week);
  return row?.[2] ? { name: row[2] } : undefined;
};
