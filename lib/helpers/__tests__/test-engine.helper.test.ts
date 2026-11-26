import { describe, expect, it } from "vitest";

import {
  PRACTICE,
  type PracticeTopic,
  SET_LEVEL,
  setsForLevel,
} from "@/const/practice-sets.constant";
import bedo from "@/lib/content/practice/bedo.json";
import conj from "@/lib/content/practice/conj.json";
import irr from "@/lib/content/practice/irr.json";
import prep from "@/lib/content/practice/prep.json";
import tense from "@/lib/content/practice/tense.json";
import thit from "@/lib/content/practice/thit.json";
import whb from "@/lib/content/practice/whb.json";
import { bankGen, type BankItem } from "@/lib/helpers/bank-practice.helper";
import { levelData } from "@/lib/helpers/level-data.helper";
import type { TestAnswer, TestQuestion } from "@/lib/types/exam.types";
import type { ListeningItem } from "@/lib/types/listening.types";
import type { Item } from "@/lib/types/vocab.types";

import {
  examPassed,
  examQuestions,
  grammarQuestions,
  isRight,
  listeningQuestions,
  placementGoesUp,
  placementQuestions,
  recommendPlacement,
  scoreSections,
  sectionsBelow,
  typedAnswers,
  vocabQuestions,
} from "../test-engine.helper";

const BANKS: Record<PracticeTopic, unknown> = {
  whb,
  irr,
  prep,
  bedo,
  tense,
  conj,
  thit,
};
const gens = Object.fromEntries(
  (Object.keys(BANKS) as PracticeTopic[]).map((t) => [
    t,
    bankGen(BANKS[t] as BankItem[]),
  ]),
);
const pre = levelData("pre", []);

const item = (id: string, level: "pre" | "inter"): ListeningItem =>
  ({
    id,
    level,
    week: 1,
    status: "published",
    type: "dialog",
    title: "Station",
    lines: [{ speaker: "A", text: "The train leaves at ten." }],
    questions: [0, 1, 2].map((n) => ({
      question: `Q${n}?`,
      options: ["a", "b", "c", "d"],
      answerIndex: 1,
      explanationId: "",
    })),
    wordCount: 6,
  }) as ListeningItem;

/** The right answer of a question, as the runner would hand it in. */
const rightAnswer = (q: TestQuestion): TestAnswer => {
  switch (q.kind) {
    case "vocab-mc":
    case "vocab-rev":
      return q.answer;
    case "vocab-type":
      return q.answer.split(" / ")[0];
    case "grammar":
      if (q.stage === "type") {
        // The fill: the answer minus the text around the blank.
        const [pre, post] = q.q.prompt.split("___");
        const cut = post.replace(/\s*\([^)]*\)/, "");
        let fill = q.q.ans;
        if (pre && fill.startsWith(pre.trim()))
          fill = fill.slice(pre.trim().length);
        if (cut.trim() && fill.endsWith(cut.trim()))
          fill = fill.slice(0, -cut.trim().length);
        return fill.trim();
      }
      return q.q.ans;
    case "dictation":
      return q.sentence.text;
    case "listen":
      return q.question.answerIndex;
  }
};

describe("grammar levels", () => {
  it("tags every practice set with a level", () => {
    const all = Object.values(PRACTICE).flatMap((t) =>
      t.sets.map(([id]) => id),
    );
    expect(all.filter((id) => !SET_LEVEL[id])).toEqual([]);
    for (const lv of ["beginner", "pre", "inter", "upper"])
      expect(setsForLevel(lv).length).toBeGreaterThan(2);
  });

  it("takes questions only from the level's sets, one per stage", () => {
    const qs = grammarQuestions(
      gens,
      "beginner",
      ["mc", "order", "type", "mc"],
      5,
    );
    expect(qs.map((q) => q.kind === "grammar" && q.stage)).toEqual([
      "mc",
      "order",
      "type",
      "mc",
    ]);
    qs.forEach(
      (q) => q.kind === "grammar" && expect(SET_LEVEL[q.set]).toBe("beginner"),
    );
  });
});

describe("vocab questions", () => {
  it("are deterministic for a seed, from the level, with 4 options", () => {
    const kinds = ["vocab-mc", "vocab-rev", "vocab-type"] as const;
    const a = vocabQuestions(pre, "pre", [...kinds], 42);
    expect(vocabQuestions(pre, "pre", [...kinds], 42)).toEqual(a);
    expect(a.map((q) => q.kind)).toEqual([...kinds]);
    a.forEach((q) => {
      if (q.kind === "vocab-mc" || q.kind === "vocab-rev") {
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.answer);
      }
    });
  });

  // "mulai" with start and begin both offered had two right answers.
  it("never offers a word with the same meaning as a distractor", () => {
    const card = (en: string, id: string): Item => ["w", en, "", id, "", ""];
    const items = [
      card("start", "mulai (paling umum)"),
      card("begin", "mulai (agak formal)"),
      card("cat", "kucing"),
      card("dog", "anjing"),
      card("bird", "burung"),
      card("fish", "ikan"),
    ];
    const data = { ...pre, V: { "1": { ...pre.V["1"], items } } };
    for (let seed = 1; seed <= 30; seed++)
      for (const q of vocabQuestions(data, "pre", ["vocab-rev"], seed))
        if (q.kind === "vocab-rev" && /^mulai/.test(q.meaning))
          expect(q.options).not.toContain(
            q.answer === "start" ? "begin" : "start",
          );
  });

  it("accepts typed answers in any listed form", () => {
    expect(typedAnswers("look after (sb) / take care of")).toEqual([
      "look after",
      "take care of",
    ]);
  });
});

describe("listening questions", () => {
  it("uses only the level's items; dictation makes up for missing ones", () => {
    const qs = listeningQuestions(pre, "pre", [item("x", "inter")], 1, 1, 3);
    expect(qs.map((q) => q.kind)).toEqual(["dictation", "dictation"]);
    const with2 = listeningQuestions(pre, "pre", [item("p", "pre")], 6, 4, 3);
    expect(with2.filter((q) => q.kind === "listen")).toHaveLength(3);
    expect(with2).toHaveLength(10);
  });
});

describe("grading", () => {
  it("marks right answers right for every kind", () => {
    const qs = [
      ...placementQuestions({
        data: pre,
        level: "pre",
        gens,
        items: [item("p", "pre")],
        seed: 9,
      }),
    ];
    expect(qs).toHaveLength(10);
    const answers = qs.map(rightAnswer);
    qs.forEach((q, i) => expect(isRight(q, answers[i], gens), q.id).toBe(true));
    expect(isRight(qs[0], null, gens)).toBe(false);
  });

  it("counts a dictation right at ≥ 80% of its words", () => {
    const q = listeningQuestions(pre, "pre", [], 1, 0, 2)[0];
    if (q.kind !== "dictation") throw new Error("expected dictation");
    const words = q.sentence.text.split(" ");
    expect(isRight(q, q.sentence.text.toUpperCase(), gens)).toBe(true);
    expect(isRight(q, words.slice(0, 1).join(" "), gens)).toBe(false);
  });
});

describe("placement", () => {
  const s = (right: number, total = 10) => ({ vocab: { right, total } });
  it("goes up at ≥ 70%", () => {
    expect(placementGoesUp(s(7))).toBe(true);
    expect(placementGoesUp(s(6))).toBe(false);
  });

  it("recommends the highest level passed, mid-level at ≥ 90%", () => {
    const weeks = (l: string) => (l === "pre" ? 12 : 8);
    const allowed = ["beginner", "pre", "inter", "upper"] as const;
    expect(
      recommendPlacement([...allowed], { beginner: s(8), pre: s(5) }, weeks),
    ).toEqual({ level: "beginner", week: 1 });
    expect(
      recommendPlacement([...allowed], { beginner: s(10), pre: s(9) }, weeks),
    ).toEqual({ level: "pre", week: 7 });
    expect(recommendPlacement([...allowed], { beginner: s(3) }, weeks)).toEqual(
      {
        level: "beginner",
        week: 1,
      },
    );
    // Only levels the token allows.
    expect(
      recommendPlacement(["pre", "inter"], { pre: s(10), inter: s(10) }, weeks),
    ).toEqual({ level: "inter", week: 5 });
  });
});

describe("exam", () => {
  it("has 40 questions: 15 vocab (5 typed), 15 grammar, 10 listening", () => {
    const qs = examQuestions({
      data: pre,
      level: "pre",
      gens,
      items: [item("p", "pre"), item("q", "pre")],
      seed: 1,
    });
    const by = (k: string) => qs.filter((q) => q.section === k);
    expect(qs).toHaveLength(40);
    expect(by("vocab")).toHaveLength(15);
    expect(by("vocab").filter((q) => q.kind === "vocab-type")).toHaveLength(5);
    expect(by("grammar")).toHaveLength(15);
    expect(by("listening")).toHaveLength(10);
    expect(by("listening").filter((q) => q.kind === "listen")).toHaveLength(4);
    const scores = scoreSections(qs, qs.map(rightAnswer), gens);
    expect(scores).toEqual({
      vocab: { right: 15, total: 15 },
      grammar: { right: 15, total: 15 },
      listening: { right: 10, total: 10 },
    });
  });

  it("passes at ≥ 75% in total and ≥ 60% in every section", () => {
    const ok = {
      vocab: { right: 13, total: 15 },
      grammar: { right: 12, total: 15 },
      listening: { right: 6, total: 10 },
    };
    expect(examPassed(ok)).toBe(true);
    const lowPart = { ...ok, listening: { right: 5, total: 10 } };
    expect(examPassed(lowPart)).toBe(false);
    expect(sectionsBelow(lowPart)).toEqual(["listening"]);
    expect(
      examPassed({
        vocab: { right: 11, total: 15 },
        grammar: { right: 11, total: 15 },
        listening: { right: 7, total: 10 },
      }),
    ).toBe(false);
  });
});
