import { describe, expect, it } from "vitest";

import type { MistakeData, MistakeInput } from "@/lib/types/mistake.types";

import {
  addTo,
  dueMistakesOf,
  EMPTY_MISTAKES,
  gradeIn,
  mergeMistakeData,
  MISTAKES_MAX,
  NEW_MISTAKES_PER_DAY,
  normalizeMistakes,
  normSentence,
  setStatusIn,
} from "../mistakes.helper";
import { nextSrs } from "../srs.helper";

const T = 20_000;
const NOW = "2026-11-17T10:00:00.000Z";
const input = (o: Partial<MistakeInput> = {}): MistakeInput => ({
  source: "Grammar",
  wrong: "She go to school.",
  correct: "She goes to school.",
  explanation_id: "He/she/it pakai -s.",
  category: "aturan-dasar",
  level: "pre",
  ...o,
});
const add = (d: MistakeData, o: Partial<MistakeInput> = {}, t = T) =>
  addTo(d, input(o), NOW, t).data;

describe("rule", () => {
  it("keeps a known Cheat sheet rule and drops an unknown one", () => {
    expect(
      add(EMPTY_MISTAKES, { rule: "tense/he-she-it-s" }).items[0].rule,
    ).toBe("tense/he-she-it-s");
    expect(
      add(EMPTY_MISTAKES, { rule: "made/up" }).items[0],
    ).not.toHaveProperty("rule");
  });

  it("a repeat without a rule keeps the one already known", () => {
    const first = add(EMPTY_MISTAKES, { rule: "tense/he-she-it-s" });
    expect(add(first).items[0].rule).toBe("tense/he-she-it-s");
  });

  it("survives a reload from storage", () => {
    const d = add(EMPTY_MISTAKES, { rule: "tense/he-she-it-s" });
    expect(
      normalizeMistakes(JSON.parse(JSON.stringify(d)), T).items[0].rule,
    ).toBe("tense/he-she-it-s");
  });
});

// The Indonesian sentence an Ujian question asked for (shown on the card).
describe("meaning", () => {
  it("is kept, survives a reload, and reaches an older card on a repeat", () => {
    const d = add(EMPTY_MISTAKES, { meaning: "Dia pergi ke sekolah." });
    expect(d.items[0].meaning).toBe("Dia pergi ke sekolah.");
    expect(
      normalizeMistakes(JSON.parse(JSON.stringify(d)), T).items[0].meaning,
    ).toBe("Dia pergi ke sekolah.");
    const old = add(EMPTY_MISTAKES);
    expect(old.items[0]).not.toHaveProperty("meaning");
    expect(
      add(old, { meaning: "Dia pergi ke sekolah." }).items[0].meaning,
    ).toBe("Dia pergi ke sekolah.");
  });
});

describe("addTo", () => {
  it("makes one active record, due tomorrow", () => {
    const { data, result } = addTo(EMPTY_MISTAKES, input(), NOW, T);
    expect(result).toBe("new");
    expect(data.items[0]).toMatchObject({
      source: "Grammar",
      count: 1,
      status: "active",
      category: "aturan-dasar",
      srs: { st: 0, due: T + 1, streak: 0, reps: 0 },
    });
  });

  it("counts the same pattern again instead of duplicating", () => {
    let d = add(EMPTY_MISTAKES);
    const r = addTo(
      d,
      input({ wrong: "she go to school!", source: "Tanya AI" }),
      "2026-11-18T00:00:00.000Z",
      T,
    );
    expect(r.result).toBe("repeat");
    d = r.data;
    expect(d.items).toHaveLength(1);
    expect(d.items[0]).toMatchObject({
      count: 2,
      lastAt: "2026-11-18T00:00:00.000Z",
      source: "Tanya AI",
    });
  });

  it("brings an archived or mastered mistake back when it happens again", () => {
    let d = add(EMPTY_MISTAKES);
    d = setStatusIn(d, d.items[0].id, "archived", T, NOW);
    d = add(d, {}, T + 30);
    expect(d.items[0]).toMatchObject({
      status: "active",
      srs: { st: 0, due: T + 31, reps: 0 },
    });
  });

  it("ignores empty input and corrections that change nothing", () => {
    expect(addTo(EMPTY_MISTAKES, input({ wrong: " " }), NOW, T).result).toBe(
      null,
    );
    expect(
      addTo(
        EMPTY_MISTAKES,
        input({ wrong: "she goes to school", correct: "She goes to school." }),
        NOW,
        T,
      ).result,
    ).toBe(null);
  });

  it("puts unknown categories under Lainnya", () => {
    expect(add(EMPTY_MISTAKES, { category: "grammar" }).items[0].category).toBe(
      "kesalahan",
    );
  });

  it(`keeps at most ${MISTAKES_MAX}, dropping archived ones first`, () => {
    let d: MistakeData = EMPTY_MISTAKES;
    for (let i = 0; i < MISTAKES_MAX; i++)
      d = add(d, { wrong: `w${i}`, correct: `c${i}` });
    const old = d.items.at(-1)!;
    d = setStatusIn(d, d.items[5].id, "archived", T, NOW);
    const archived = d.items[5].id;
    d = add(d, { wrong: "new", correct: "fresh" });
    expect(d.items).toHaveLength(MISTAKES_MAX);
    expect(d.items.some((m) => m.id === archived)).toBe(false);
    expect(d.items.some((m) => m.id === old.id)).toBe(true);
  });
});

describe("normalizeMistakes (old data)", () => {
  it("reads the old Main peran / Dikte array, merging repeats", () => {
    const d = normalizeMistakes(
      [
        {
          id: "a",
          source: "Menyimak",
          wrong: "I lives here",
          correct: "I live here.",
          explanation_id: "",
          category: "Menyimak",
          level: "pre",
          createdAt: "2026-11-10T00:00:00Z",
        },
        {
          id: "b",
          source: "Main peran",
          wrong: "two coffee",
          correct: "two coffees",
          explanation_id: "Jamak.",
          category: "kata-tertukar",
          level: "beginner",
          createdAt: "2026-11-11T00:00:00Z",
        },
        {
          id: "c",
          source: "Main peran",
          wrong: "Two coffee.",
          correct: "two coffees",
          explanation_id: "Jamak.",
          category: "kata-tertukar",
          level: "beginner",
          createdAt: "2026-11-12T00:00:00Z",
        },
        { broken: true },
      ],
      T,
    );
    expect(d.reviewOn).toBe(true);
    expect(d.items).toHaveLength(2);
    const dikte = d.items.find((m) => m.id === "a")!;
    expect(dikte).toMatchObject({
      source: "Dikte",
      category: "menyimak",
      status: "active",
      srs: { due: T + 1 },
    });
    const coffee = d.items.find((m) => m.correct === "two coffees")!;
    expect(coffee.id).toBe("b");
    expect(coffee.createdAt).toBe("2026-11-11T00:00:00Z");
  });

  it("keeps v2 data as is", () => {
    const d = add(EMPTY_MISTAKES);
    expect(normalizeMistakes({ ...d, reviewOn: false }, T + 5)).toEqual({
      ...d,
      reviewOn: false,
    });
  });
});

describe("mergeMistakeData (import)", () => {
  it("combines by pattern; the copy changed last wins, counts take the max", () => {
    let mine = add(EMPTY_MISTAKES);
    mine = gradeIn(
      mine,
      mine.items[0].id,
      "good",
      T + 1,
      "2026-11-20T00:00:00Z",
    );
    const theirs = {
      ...EMPTY_MISTAKES,
      items: [
        {
          ...mine.items[0],
          count: 4,
          lastAt: "2026-11-25T00:00:00Z",
          status: "archived" as const,
        },
      ],
    };
    const d = mergeMistakeData({ ...mine, reviewOn: false }, theirs, T);
    expect(d.items).toHaveLength(1);
    expect(d.items[0]).toMatchObject({ count: 4, status: "archived" });
    expect(d.reviewOn).toBe(false);
  });
});

describe("Ulang", () => {
  const many = (n: number) => {
    let d: MistakeData = EMPTY_MISTAKES;
    for (let i = 0; i < n; i++)
      d = add(d, { wrong: `w${i}`, correct: `c${i}` });
    return d;
  };

  it("shows new mistakes from tomorrow, at most 10 new a day", () => {
    const d = many(14);
    expect(dueMistakesOf(d, T)).toHaveLength(0);
    let due = dueMistakesOf(d, T + 1);
    expect(due).toHaveLength(NEW_MISTAKES_PER_DAY);
    let cur = d;
    for (let i = 0; i < 3; i++)
      cur = gradeIn(cur, due[i].id, "good", T + 1, NOW);
    due = dueMistakesOf(cur, T + 1);
    expect(due).toHaveLength(NEW_MISTAKES_PER_DAY - 3);
    // Next day: the rest of the new ones (up to 10) plus reviews due.
    expect(dueMistakesOf(cur, T + 2)).toHaveLength(NEW_MISTAKES_PER_DAY);
  });

  it("shows nothing when switched off", () => {
    expect(dueMistakesOf({ ...many(2), reviewOn: false }, T + 1)).toEqual([]);
  });

  it("is mastered after 3 Ingat in a row with the last gap ≥ 21 days", () => {
    let d = many(1);
    const id = d.items[0].id;
    let t = T + 1;
    const step = (how: "good" | "hard" | "forgot") => {
      d = gradeIn(d, id, how, t, NOW);
      t = d.items[0].srs.due;
    };
    step("good"); // 3 days
    step("good"); // 7
    step("forgot"); // streak back to 0
    expect(d.items[0].srs.streak).toBe(0);
    step("good");
    step("good");
    step("good");
    expect(d.items[0].status).toBe("active"); // last gap 14 < 21
    step("good"); // 30 days
    expect(d.items[0]).toMatchObject({
      status: "mastered",
      srs: { streak: 4, lastGap: 30 },
    });
    expect(dueMistakesOf(d, t + 100)).toEqual([]);
  });
});

describe("nextSrs", () => {
  it("follows the word-card steps", () => {
    expect(nextSrs({ st: 0, due: 0 }, "good", 10)).toEqual({
      st: 1,
      due: 13,
      gap: 3,
    });
    expect(nextSrs({ st: 3, due: 0 }, "hard", 10)).toEqual({
      st: 3,
      due: 17,
      gap: 7,
    });
    expect(nextSrs({ st: 4, due: 0, lapses: 1 }, "forgot", 10)).toEqual({
      st: 0,
      due: 11,
      gap: 1,
      lapses: 2,
    });
  });
});

describe("normSentence", () => {
  it("ignores case, punctuation and curly quotes", () => {
    expect(normSentence("  It’s  OK, isn't it? ")).toBe("it's ok isn't it");
  });
});
