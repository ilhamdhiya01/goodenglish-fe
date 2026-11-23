import { describe, expect, it } from "vitest";

import bedo from "@/lib/content/practice/bedo.json";
import { bankGen, type BankItem } from "@/lib/helpers/bank-practice.helper";
import { levelData } from "@/lib/helpers/level-data.helper";
import {
  grammarQuestions,
  listeningQuestions,
  vocabQuestions,
} from "@/lib/helpers/test-engine.helper";

import { examMistakes } from "../ExamFlow";

const gens = { bedo: bankGen(bedo as BankItem[]) };
const pre = levelData("pre", []);

describe("examMistakes", () => {
  it("sends wrong vocab, grammar and dictation answers as source Ujian", () => {
    const qs = [
      ...vocabQuestions(pre, "pre", ["vocab-mc", "vocab-type"], 3),
      ...grammarQuestions(gens, "beginner", ["mc"], 3),
      ...listeningQuestions(pre, "pre", [], 1, 0, 3),
    ];
    const wrong = examMistakes(qs, ["zzz", "zzz", "zzz", "zzz"], gens);
    expect(wrong.map((m) => [m.source, m.category])).toEqual([
      ["Ujian", "kesalahan"],
      ["Ujian", "kesalahan"],
      ["Ujian", "am-is-are"],
      ["Ujian", "menyimak"],
    ]);
    const g = qs[2];
    expect(wrong[2].correct).toBe(g.kind === "grammar" ? g.q.ans : "");
    // The Indonesian sentence the question asked for goes along.
    expect(wrong[2].meaning).toBe(g.kind === "grammar" ? g.q.promptId : "");
    expect(wrong[2].meaning).toBeTruthy();
    // Right answers and unanswered ones send nothing.
    const right = qs.map((q) =>
      q.kind === "vocab-mc"
        ? q.answer
        : q.kind === "vocab-type"
          ? q.answer
          : q.kind === "grammar"
            ? q.q.ans
            : q.kind === "dictation"
              ? q.sentence.text
              : null,
    );
    expect(examMistakes(qs, right, gens)).toEqual([]);
    expect(examMistakes(qs, [null, null, null, null], gens)).toEqual([]);
  });
});
