import { describe, expect, it } from "vitest";

import { VOCAB, VOCAB_L, VOCAB_X } from "@/lib/content";
import { MEANING_CONTEXT } from "@/lib/content/meaning-context";
import { sameMeaning } from "@/lib/helpers/level-data.helper";

// Every vocabulary card ([type, en, pron, meaning, example, …]) in all levels.
const cards: string[][] = [];
const walk = (x: unknown): void => {
  if (Array.isArray(x)) {
    if (
      /^[a-z]{1,4}$/.test(x[0]) &&
      typeof x[1] === "string" &&
      typeof x[3] === "string"
    )
      cards.push(x as string[]);
    else x.forEach(walk);
  } else if (x && typeof x === "object") Object.values(x).forEach(walk);
};
walk([VOCAB, VOCAB_X, VOCAB_L]);

const entries = Object.entries(MEANING_CONTEXT).map(([k, shown]) => {
  const at = k.indexOf("|");
  return { en: k.slice(0, at), old: k.slice(at + 1), shown };
});

describe("meaning context", () => {
  it("applies to cards that exist", () => {
    for (const e of entries)
      expect(
        cards.some((c) => c[1] === e.en && c[3] === e.shown),
        `${e.en}|${e.old}`,
      ).toBe(true);
  });

  // "memakai" for both put on and wear left the learner guessing.
  it("leaves no Indonesian prompt shared by two English words", () => {
    const byPrompt = new Map<string, Set<string>>();
    for (const c of cards) {
      const k = c[3].trim().toLowerCase();
      byPrompt.set(
        k,
        (byPrompt.get(k) ?? new Set()).add(c[1].trim().toLowerCase()),
      );
    }
    const shared = [...byPrompt].filter(([, en]) => en.size > 1);
    expect(shared).toEqual([]);
  });

  it("keeps the meaning and its fit for quizzes (under 48 characters)", () => {
    for (const e of entries) {
      expect(sameMeaning(e.old, e.shown), e.shown).toBe(true);
      if (e.old.length < 48) expect(e.shown.length, e.shown).toBeLessThan(48);
    }
  });
});
