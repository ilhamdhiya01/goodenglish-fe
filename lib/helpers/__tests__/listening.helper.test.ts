import { describe, expect, it } from "vitest";

import { VOCAB_SCEN } from "@/lib/content";
import { levelData } from "@/lib/helpers/level-data.helper";
import type { ListeningItem } from "@/lib/types/listening.types";
import type { Scenario } from "@/lib/types/scenario.types";

import {
  cleanSentence,
  dictationMeaning,
  dictationPool,
  dictationSpeed,
  pickDictation,
  pickListeningQuestions,
  pickListenItem,
  stageOf,
} from "../listening.helper";

const SC = VOCAB_SCEN as Scenario[];

describe("cleanSentence", () => {
  it("drops sentences that can't be dictated and strips glosses", () => {
    expect(cleanSentence("The train departs at 9. / I'm leaving.")).toBeNull();
    expect(cleanSentence("Well…")).toBeNull();
    expect(cleanSentence("Yes — of course.")).toBeNull();
    expect(cleanSentence("Thank you.")).toBeNull();
    expect(cleanSentence("A quarter past nine. (9:15)")).toBe(
      "A quarter past nine.",
    );
  });
});

// Mistake cards look the meaning up later (old cards too): every dictation
// sentence that had a meaning still finds one.
describe("dictationMeaning", () => {
  it("finds a meaning for every pool sentence that has one", () => {
    for (const level of ["beginner", "pre", "inter", "upper"]) {
      const data = levelData(level, []);
      for (const s of dictationPool(data, SC, level, 99))
        if (s.meaning)
          expect(dictationMeaning(s.text, SC), s.text).not.toBe("");
    }
  });
});

describe("dictation pool and stages", () => {
  it("has sentences for every stage on every level (fills up when short)", () => {
    for (const level of ["beginner", "pre", "inter", "upper"]) {
      const data = levelData(level, []);
      const pool = dictationPool(data, SC, level, 99);
      expect(pool.length).toBeGreaterThan(100);
      for (const st of [1, 2, 3] as const) {
        expect(pickDictation(pool, st, {}, 7)).toHaveLength(10);
      }
    }
  });

  it("only takes weeks up to the active week (plus scenario lines)", () => {
    const data = levelData("pre", []);
    const pool = dictationPool(data, SC, "pre", 2);
    expect(pool.every((s) => s.source === "skenario" || s.week <= 2)).toBe(
      true,
    );
    expect(pool.some((s) => s.source === "skenario")).toBe(true);
  });

  it("groups by length and fast speech, with the stage speeds", () => {
    expect(stageOf({ words: 7, fast: false })).toBe(1);
    expect(stageOf({ words: 8, fast: false })).toBe(2);
    expect(stageOf({ words: 13, fast: false })).toBe(3);
    expect(stageOf({ words: 5, fast: true })).toBe(3);
    expect(dictationSpeed(1, { fast: false, words: 5 })).toBe(0.78);
    expect(dictationSpeed(2, { fast: false, words: 9 })).toBe(0.95);
    expect(dictationSpeed(3, { fast: true, words: 6 })).toBe(1.2);
    // Long sentences at Normal; the shorter ones filling stage 3 at Cepat.
    expect(dictationSpeed(3, { fast: false, words: 14 })).toBe(0.95);
    expect(dictationSpeed(3, { fast: false, words: 11 })).toBe(1.2);
  });

  it("puts unseen sentences first and is stable for a seed", () => {
    const data = levelData("beginner", []);
    const pool = dictationPool(data, SC, "beginner", 99);
    const stage1 = pool.filter((s) => stageOf(s) === 1);
    const seen = Object.fromEntries(
      stage1.slice(0, stage1.length - 3).map((s) => [s.id, 1]),
    );
    const set = pickDictation(pool, 1, seen, 3);
    expect(set.slice(0, 3).every((s) => !seen[s.id])).toBe(true);
    expect(pickDictation(pool, 1, {}, 3)).toEqual(
      pickDictation(pool, 1, {}, 3),
    );
  });
});

const item = (id: string, week: number): ListeningItem => ({
  id,
  level: "pre",
  week,
  status: "published",
  type: "dialog",
  title: id,
  lines: [],
  questions: [],
  wordCount: 60,
  createdBy: null,
  publishedAt: null,
  createdAt: "",
  updatedAt: "",
});

describe("listen items and the shared picker", () => {
  it("picks a published item of the active week or earlier, unseen first", () => {
    const items = [item("a", 1), item("b", 2), item("c", 5)];
    expect(pickListenItem(items, 2, { a: 1 }, 1)?.id).toBe("b");
    expect(pickListenItem(items, 1, { a: 1 }, 1)?.id).toBe("a");
    expect(pickListenItem([], 3, {}, 1)).toBeNull();
  });

  it("pickListeningQuestions mixes stages and returns the asked numbers", () => {
    const r = pickListeningQuestions({
      data: levelData("pre", []),
      scenarios: SC,
      level: "pre",
      items: [item("a", 1), item("b", 3), item("c", 12)],
      upToWeek: 6,
      dictation: 6,
      listen: 5,
      seed: 9,
    });
    expect(r.dictation).toHaveLength(6);
    expect(new Set(r.dictation.map((s) => stageOf(s))).size).toBe(3);
    expect(r.items.map((i) => i.id).sort()).toEqual(["a", "b"]);
  });
});

describe("Dikte of the active week first (pilot urutan 7)", () => {
  it("puts this week's sentences ahead of older ones", () => {
    const s = (id: string, week: number) => ({
      id,
      text: "a b c",
      meaning: "",
      source: "kosakata" as const,
      week,
      words: 3,
      fast: false,
    });
    const pool = [s("o1", 1), s("o2", 2), s("n1", 3), s("n2", 3)];
    const picked = pickDictation(pool, 1, {}, 7, 3, 3);
    expect(
      picked
        .slice(0, 2)
        .map((x) => x.id)
        .sort(),
    ).toEqual(["n1", "n2"]);
  });
});
