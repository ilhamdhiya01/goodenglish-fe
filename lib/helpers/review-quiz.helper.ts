import type { MistakeRecord } from "@/lib/types/mistake.types";
import type { ErrorGroup } from "@/lib/types/scenario.types";

// Blok Ulang on a day with nothing due: a short "mana yang benar" quiz,
// from the learner's own Buku kesalahanku first, topped up from the
// Kesalahan umum catalogue (pilot urutan 1). Answers are graded by the app.

export interface QuizQ {
  wrong: string;
  right: string;
  why: string;
  /** The two options, in display order. */
  opts: [string, string];
  /** Catalogue group (only for Kesalahan umum items). */
  cat?: string;
}

const shuffle = <T>(a: T[], rand: () => number) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

const usable = (wrong: string, right: string) =>
  !!wrong.trim() &&
  !!right.trim() &&
  wrong.trim().toLowerCase() !== right.trim().toLowerCase();

export const buildReviewQuiz = (
  mistakes: MistakeRecord[],
  groups: ErrorGroup[],
  level: string,
  n: number,
  rand: () => number = Math.random,
): QuizQ[] => {
  const pair = (wrong: string, right: string): [string, string] =>
    rand() < 0.5 ? [wrong, right] : [right, wrong];
  // Own mistakes: active ones first, archived ones never.
  const own = shuffle(
    mistakes.filter(
      (m) => m.status !== "archived" && usable(m.wrong, m.correct),
    ),
    rand,
  ).sort(
    (a, b) => Number(b.status === "active") - Number(a.status === "active"),
  );
  const out: QuizQ[] = own.slice(0, n).map((m) => ({
    wrong: m.wrong,
    right: m.correct,
    why: m.explanation_id,
    opts: pair(m.wrong, m.correct),
  }));
  if (out.length >= n) return out;
  const atLevel = groups.filter((g) => (g.lv || "pre") === level);
  const catalogue = shuffle(
    (atLevel.length ? atLevel : groups).flatMap((g) =>
      g.items
        .map(([wrong, right, why]) => ({
          wrong,
          right: right.split(" / ")[0],
          why: why || "",
          cat: g.cat,
        }))
        .filter((q) => usable(q.wrong, q.right)),
    ),
    rand,
  );
  for (const q of catalogue) {
    if (out.length >= n) break;
    if (out.some((x) => x.right === q.right)) continue;
    out.push({ ...q, opts: pair(q.wrong, q.right) });
  }
  return out;
};
