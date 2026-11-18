import { GAPS } from "@/const/srs.constant";
import type { SrsEntry } from "@/lib/types/progress.types";

export type SrsAnswer = "good" | "hard" | "forgot";

/**
 * The next review of a card (word or mistake), the same rule for both:
 * Ingat moves one step up the GAPS ladder, Ragu stays and waits half the
 * gap, Lupa goes back to the start and comes again tomorrow.
 */
export const nextSrs = (
  cur: SrsEntry,
  how: SrsAnswer,
  T: number,
): SrsEntry & { gap: number } => {
  let st = cur.st;
  if (how === "good") st = Math.min(st + 1, GAPS.length - 1);
  else if (how === "forgot") st = 0;
  const gap =
    how === "forgot"
      ? 1
      : how === "hard"
        ? Math.max(1, Math.round(GAPS[st] / 2))
        : GAPS[st];
  // Counted so Tanya AI can suggest the most-forgotten words.
  const lapses = (cur.lapses ?? 0) + (how === "forgot" ? 1 : 0);
  return { st, due: T + gap, gap, ...(lapses ? { lapses } : {}) };
};
