import { describe, expect, it } from "vitest";

import { allLevelData } from "@/lib/helpers/derived.helper";
import type { ReadingText } from "@/lib/types/reading.types";
import type { Item } from "@/lib/types/vocab.types";

import {
  dailyLabel,
  findGlossary,
  findVocab,
  findWordCorrect,
  groupByWeek,
  isCorrect,
  pieces,
  readingMinutes,
  splitSentences,
  vocabIndex,
  warningText,
} from "../reading.helper";

const item = (type: string, en: string, id = "arti"): Item => [
  type,
  en,
  "",
  id,
  "",
  "",
];

describe("splitSentences", () => {
  it("splits on . ! ? and keeps closing quotes", () => {
    expect(
      splitSentences('Rina woke up late. "Oh no!" she said. Was it Monday?'),
    ).toEqual([
      "Rina woke up late.",
      '"Oh no!"',
      "she said.",
      "Was it Monday?",
    ]);
    expect(splitSentences("No full stop")).toEqual(["No full stop"]);
  });
});

describe("pieces", () => {
  const week = [
    item("pv", "wake up"),
    item("w", "commute"),
    item("pv", "run out of"),
    item("w", "make"),
  ];

  it("marks the week's words and phrases in any form", () => {
    const p = pieces("She woke up and ran out of milk.", week);
    expect(p.filter((x) => x.kind === "target").map((x) => x.text)).toEqual([
      "woke up",
      "ran out of",
    ]);
    const q = pieces(
      "He wakes up early; his commutes are long, making tea.",
      week,
    );
    expect(q.filter((x) => x.kind === "target").map((x) => x.text)).toEqual([
      "wakes up",
      "commutes",
      "making",
    ]);
  });

  it("keeps every character and makes each other word tappable", () => {
    const s = "Rina’s bus, again!";
    const p = pieces(s, week);
    expect(p.map((x) => x.text).join("")).toBe(s);
    expect(p.filter((x) => x.kind === "word").map((x) => x.text)).toEqual([
      "Rina’s",
      "bus",
      "again",
    ]);
  });

  it("skips cards with placeholders", () => {
    const p = pieces("Ask sth nicely.", [item("st", "ask sth")]);
    expect(p.some((x) => x.kind === "target")).toBe(false);
  });
});

describe("findVocab", () => {
  const index = vocabIndex(allLevelData([]));

  it("finds the card from an inflected form, the given level first", () => {
    const mine = vocabIndex(
      allLevelData([
        {
          key: "c1",
          level: "inter",
          week: 2,
          type: "w",
          en: "haggle",
          id: "menawar",
          pron: "",
          ex: "",
        },
      ]),
    );
    const hit = findVocab(mine, "haggled", "pre");
    expect(hit).toMatchObject({ lid: "inter", w: 2, key: "inter|2:w:haggle" });
    const chicken = findVocab(index, "chickens", "beginner");
    expect(chicken?.lid).toBe("beginner");
    expect(chicken?.key).toMatch(/^beginner\|\d+:w:chicken$/);
  });

  it("with a meaning, ignores a card that means something else", () => {
    expect(
      findVocab(index, "chicken", "pre", undefined, "ayam"),
    ).not.toBeNull();
    expect(
      findVocab(index, "chicken", "pre", undefined, "pengecut"),
    ).toBeNull();
  });

  it("returns null for unknown words", () => {
    expect(findVocab(index, "zzzqx", "pre")).toBeNull();
  });
});

describe("findGlossary", () => {
  const g = [{ word: "commuters", meaningId: "penglaju" }];
  it("matches other forms both ways", () => {
    expect(findGlossary(g, "commuter")?.meaningId).toBe("penglaju");
    expect(findGlossary(g, "Commuters")?.meaningId).toBe("penglaju");
    expect(findGlossary(g, "bus")).toBeNull();
  });
});

describe("questions", () => {
  it("checks each type", () => {
    const mcq = {
      type: "mcq" as const,
      question: "?",
      options: ["a", "b", "c", "d"],
      answerIndex: 2,
      explanationId: "",
    };
    expect(isCorrect(mcq, 2)).toBe(true);
    expect(isCorrect(mcq, 1)).toBe(false);
    expect(isCorrect(mcq, null)).toBe(false);
    const tf = {
      type: "true_false" as const,
      statement: "x",
      answer: false,
      explanationId: "",
    };
    expect(isCorrect(tf, false)).toBe(true);
    expect(isCorrect(tf, true)).toBe(false);
    const fw = {
      type: "find_word" as const,
      promptId: "x",
      answer: "colleagues",
    };
    expect(isCorrect(fw, " Colleague ")).toBe(true);
    expect(findWordCorrect("went", "go")).toBe(true);
    expect(isCorrect(fw, "friends")).toBe(false);
  });
});

describe("list helpers", () => {
  const t = (id: string, week: number, slot: "A" | "B") =>
    ({ id, week, slot }) as ReadingText;

  it("groups by week: active first, then earlier (newest first), then later", () => {
    const g = groupByWeek(
      [
        t("1", 1, "A"),
        t("5", 5, "A"),
        t("3b", 3, "B"),
        t("3a", 3, "A"),
        t("2", 2, "A"),
      ],
      3,
    );
    expect(g.map((x) => x.week)).toEqual([3, 2, 1, 5]);
    expect(g[0].texts.map((x) => x.id)).toEqual(["3a", "3b"]);
  });

  it("estimates minutes at 130 wpm, at least 1", () => {
    expect(readingMinutes(40)).toBe(1);
    expect(readingMinutes(260)).toBe(2);
  });

  it("explains warnings in Indonesian", () => {
    expect(
      warningText({ code: "word_count", count: 120, min: 150, max: 200 }),
    ).toBe("Panjang teks 120 kata (seharusnya 150–200).");
    expect(
      warningText({ code: "few_target_words", found: 5, min: 8 }),
    ).toContain("Hanya 5");
  });
});

describe("dailyLabel", () => {
  // 23:30 UTC on the 22nd is already the 23rd in WIB.
  const now = new Date("2026-11-22T23:30:00Z");
  it("names today and yesterday by the WIB day, older ones by date", () => {
    expect(dailyLabel("2026-11-23", now)).toBe("Hari ini");
    expect(dailyLabel("2026-11-22", now)).toBe("Kemarin");
    expect(dailyLabel("2026-11-20", now)).toMatch(/^Jumat, 20 Nov/);
  });
});
