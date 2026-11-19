import { describe, expect, it } from "vitest";

import type { MistakeRecord } from "@/lib/types/mistake.types";

import { buildReviewQuiz } from "../review-quiz.helper";

const rec = (id: string, status: MistakeRecord["status"]) =>
  ({
    id,
    wrong: `I am agree ${id}`,
    correct: `I agree ${id}`,
    explanation_id: "agree = kata kerja",
    status,
  }) as MistakeRecord;

const groups = [
  {
    cat: "Be",
    lv: "pre",
    items: [
      ["She is go", "She goes", "x"],
      ["I am wait", "I am waiting / I wait", "y"],
      ["He don't", "He doesn't", "z"],
      ["Same", "Same", "skip"],
    ] as [string, string, string][],
  },
  {
    cat: "Other",
    lv: "upper",
    items: [["a", "b", ""]] as [string, string, string][],
  },
];

describe("Ulang stand-in quiz", () => {
  it("uses the learner's own mistakes first, active ones first, never archived", () => {
    const q = buildReviewQuiz(
      [rec("1", "mastered"), rec("2", "active"), rec("3", "archived")],
      groups,
      "pre",
      2,
    );
    expect(q.map((x) => x.right)).toEqual(["I agree 2", "I agree 1"]);
    expect(q[0].opts.sort()).toEqual(["I agree 2", "I am agree 2"].sort());
  });

  it("tops up from Kesalahan umum of the level when the book is short", () => {
    const q = buildReviewQuiz([], groups, "pre", 5);
    // 3 usable catalogue items at this level (identical pairs are skipped).
    expect(q).toHaveLength(3);
    expect(q.every((x) => x.cat === "Be")).toBe(true);
    expect(q.map((x) => x.right)).toContain("I am waiting");
  });
});
