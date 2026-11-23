import { describe, expect, it } from "vitest";

import {
  checkDictation,
  explainMarks,
  markLetters,
  normalizeTokens,
  numberWords,
} from "../dictation.helper";

const kinds = (sentence: string, typed: string) =>
  checkDictation(sentence, typed).marks.map((m) =>
    m.kind === "wrong"
      ? `${m.word}>${m.expected}`
      : m.kind === "correct"
        ? m.word
        : `${m.kind}:${"word" in m ? m.word : m.expected}`,
  );

describe("normalizeTokens", () => {
  it("ignores case, punctuation and extra spaces", () => {
    expect(normalizeTokens("  Hello,   WORLD! ").map((t) => t.text)).toEqual([
      "hello",
      "world",
    ]);
  });

  it("expands contractions", () => {
    expect(
      normalizeTokens("I'm sure they don't know, we can't go").map(
        (t) => t.text,
      ),
    ).toEqual([
      "i",
      "am",
      "sure",
      "they",
      "do",
      "not",
      "know",
      "we",
      "can",
      "not",
      "go",
    ]);
    expect(normalizeTokens("I won't, you’re late").map((t) => t.text)).toEqual([
      "i",
      "will",
      "not",
      "you",
      "are",
      "late",
    ]);
  });

  it("writes numbers, times, percents and ordinals as words", () => {
    expect(numberWords(21)).toBe("twenty one");
    expect(numberWords(105)).toBe("one hundred five");
    expect(
      normalizeTokens("at 5:30")
        .map((t) => t.text)
        .join(" "),
    ).toBe("at five thirty");
    expect(
      normalizeTokens("at 9:05")
        .map((t) => t.text)
        .join(" "),
    ).toBe("at nine oh five");
    expect(
      normalizeTokens("6:00 AM")
        .map((t) => t.text)
        .join(" "),
    ).toBe("six am");
    expect(
      normalizeTokens("10% off")
        .map((t) => t.text)
        .join(" "),
    ).toBe("ten percent off");
    expect(
      normalizeTokens("the 2nd and 21st")
        .map((t) => t.text)
        .join(" "),
    ).toBe("the second and twenty first");
  });
});

describe("checkDictation", () => {
  it("accepts equivalent spellings as fully correct", () => {
    expect(checkDictation("I'm going home.", "i am going home").score).toBe(
      100,
    );
    expect(checkDictation("I don't like it.", "I do not like it").score).toBe(
      100,
    );
    expect(checkDictation("We can't stay.", "we cannot stay").score).toBe(100);
    expect(
      checkDictation("I wake up at 5:30.", "I wake up at five thirty").score,
    ).toBe(100);
    expect(
      checkDictation("I have two brothers.", "I have 2 brothers").score,
    ).toBe(100);
    expect(checkDictation("It's five o'clock.", "it is 5 o'clock").score).toBe(
      100,
    );
    expect(checkDictation("He's gone.", "he has gone").score).toBe(100);
  });

  it("marks wrong, missing and extra words", () => {
    expect(kinds("I go to the office.", "I go to office")).toEqual([
      "i",
      "go",
      "to",
      "missing:the",
      "office",
    ]);
    expect(kinds("She is in the ship.", "She is in the sheep")).toEqual([
      "she",
      "is",
      "in",
      "the",
      "sheep>ship",
    ]);
    expect(kinds("I like tea.", "I really like tea")).toEqual([
      "i",
      "extra:really",
      "like",
      "tea",
    ]);
  });

  it("scores the share of the sentence's words that were right", () => {
    const r = checkDictation("I go to the office.", "I go to office");
    expect(r).toMatchObject({ correct: 4, total: 5, score: 80 });
    expect(checkDictation("Hello there.", "").score).toBe(0);
  });

  it("explains the mistakes in Indonesian", () => {
    const { marks } = checkDictation(
      "She is in the ship now.",
      "She in the sheep now please",
    );
    expect(explainMarks(marks)).toBe(
      'Salah dengar: "sheep" → "ship". Terlewat: "is". Berlebih: "please".',
    );
  });
});

// A typed word card: which of the learner's letters differ from the answer.
describe("markLetters", () => {
  const bad = (expected: string, typed: string) =>
    markLetters(expected, typed)
      .filter((p) => p.bad)
      .map((p) => p.t)
      .join("|");

  it("marks the wrong letter, keeps the typed text whole", () => {
    const parts = markLetters("either ... or", "eather or");
    expect(parts.map((p) => p.t).join("")).toBe("eather or");
    expect(bad("either ... or", "eather or")).toBe("a");
  });

  it("shows a missing letter as _, but not missing dots or spaces", () => {
    expect(
      markLetters("lesson", "leson")
        .map((p) => p.t)
        .join(""),
    ).toMatch(/^les?_s?on$/);
    expect(bad("lesson", "leson")).toBe("_");
  });

  it("marks extra letters; case and a right answer mark nothing", () => {
    expect(bad("go", "goo")).toBe("o");
    expect(bad("Monday", "monday")).toBe("");
  });
});
