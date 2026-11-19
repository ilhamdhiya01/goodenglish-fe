import { describe, expect, it } from "vitest";

import {
  addCount,
  merge3List,
  merge3Map,
  mergeProgressDoc,
} from "../progress-merge.helper";

const T = 20_000;

describe("merge3Map", () => {
  it("keeps what each side added and changed", () => {
    const base = { a: 1, b: 1 };
    const mine = { a: 1, b: 1, m: 1 };
    const theirs = { a: 1, b: 2, t: 1 };
    expect(merge3Map(base, mine, theirs)).toEqual({ a: 1, b: 2, m: 1, t: 1 });
  });

  it("a deletion on one side wins over an untouched entry", () => {
    expect(merge3Map({ a: 1, b: 1 }, { b: 1 }, { a: 1, b: 1, c: 1 })).toEqual({
      b: 1,
      c: 1,
    });
  });

  it("an edit wins over a deletion on the other side", () => {
    expect(merge3Map({ a: 1 }, {}, { a: 2 })).toEqual({ a: 2 });
  });

  it("both edited: the resolver decides (mine by default)", () => {
    expect(merge3Map({ a: 1 }, { a: 2 }, { a: 3 })).toEqual({ a: 2 });
    expect(
      merge3Map({ a: 1 }, { a: 2 }, { a: 3 }, (m, t) => Math.max(m, t)),
    ).toEqual({ a: 3 });
  });

  it("without a base it is a union preferring mine", () => {
    expect(merge3Map(undefined, { a: 1, b: 1 }, { b: 2, c: 1 })).toEqual({
      a: 1,
      b: 1,
      c: 1,
    });
  });
});

describe("merge3List", () => {
  it("merges by key, mine's order first", () => {
    const k = (x: { id: string }) => x.id;
    expect(
      merge3List(
        [{ id: "a" }],
        [{ id: "a" }, { id: "m" }],
        [{ id: "t" }, { id: "a" }],
        k,
      ).map(k),
    ).toEqual(["a", "m", "t"]);
  });
});

describe("addCount", () => {
  it("adds what each side did on top of the base", () => {
    expect(addCount(3, 5, 4, true)).toBe(6);
    expect(addCount(undefined, 5, 4, false)).toBe(5);
  });
});

describe("mergeProgressDoc", () => {
  it("known: words memorised on two devices are all kept", () => {
    expect(
      mergeProgressDoc("known", { x: 1 }, { x: 1, a: 1 }, { x: 1, b: 1 }, T),
    ).toEqual({ x: 1, a: 1, b: 1 });
  });

  it("srs: a card answered on both keeps the later schedule", () => {
    expect(
      mergeProgressDoc(
        "srs",
        { k: { st: 1, due: 10 } },
        { k: { st: 2, due: 12 } },
        { k: { st: 3, due: 15 } },
        T,
      ),
    ).toEqual({ k: { st: 3, due: 15 } });
  });

  it("plan: ticks of both devices, today's counts added up", () => {
    const base = { tally: { day: T, known: 2 }, days: { [T]: { b1: true } } };
    const mine = {
      tally: { day: T, known: 5 },
      days: { [T]: { b1: true, b2: true } },
    };
    const theirs = {
      tally: { day: T, known: 4, ask: 3 },
      days: { [T]: { b1: true, b3: true } },
      quiz: [{ d: T, score: 18, scope: "week", level: "pre", week: 1 }],
    };
    const out = mergeProgressDoc("plan", base, mine, theirs, T) as {
      tally: Record<string, number>;
      days: Record<string, Record<string, boolean>>;
      quiz: unknown[];
    };
    expect(out.tally).toEqual({ day: T, known: 7, ask: 3 });
    expect(out.days[T]).toEqual({ b1: true, b2: true, b3: true });
    expect(out.quiz).toHaveLength(1);
  });

  it("plan: a tally from an older day gives way to today's", () => {
    const out = mergeProgressDoc(
      "plan",
      {},
      { tally: { day: T - 1, known: 9 } },
      { tally: { day: T, known: 1 } },
      T,
    ) as { tally: unknown };
    expect(out.tally).toEqual({ day: T, known: 1 });
  });

  it("done: same day adds up, without a base the larger count", () => {
    expect(
      mergeProgressDoc(
        "done",
        { day: T, n: 2 },
        { day: T, n: 4 },
        { day: T, n: 3 },
        T,
      ),
    ).toEqual({ day: T, n: 5 });
    expect(
      mergeProgressDoc(
        "done",
        undefined,
        { day: T, n: 4 },
        { day: T, n: 3 },
        T,
      ),
    ).toEqual({ day: T, n: 4 });
  });

  it("custom: words added on both devices, a deleted one stays deleted", () => {
    const w = (key: string) => ({ key, en: key, id: key });
    const out = mergeProgressDoc(
      "custom",
      [w("a"), w("b")],
      [w("a"), w("m")],
      [w("a"), w("b"), w("t")],
      T,
    ) as { key: string }[];
    expect(out.map((x) => x.key)).toEqual(["a", "m", "t"]);
  });

  it("exam: attempts of both devices are kept", () => {
    const a = (id: string, date: string) => ({
      id,
      date,
      level: "pre",
      sections: {},
      pct: 50,
      passed: false,
    });
    const out = mergeProgressDoc(
      "exam",
      { attempts: [] },
      { attempts: [a("m", "2026-11-19T01:00:00Z")] },
      { attempts: [a("t", "2026-11-19T02:00:00Z")] },
      T,
    ) as { attempts: { id: string }[] };
    expect(out.attempts.map((x) => x.id).sort()).toEqual(["m", "t"]);
  });

  it("activity: minutes of both devices on the same day add up", () => {
    const day = (sec: number, r: number) => ({
      v: 1,
      since: T - 5,
      days: { [T]: { m: { vocab: sec }, r } },
      events: [],
    });
    const out = mergeProgressDoc(
      "activity",
      day(60, 2),
      day(120, 5),
      day(90, 3),
      T,
    ) as { days: Record<string, { m: Record<string, number>; r: number }> };
    expect(out.days[T].m.vocab).toBe(150);
    expect(out.days[T].r).toBe(6);
  });

  it("a single choice (level): mine unless I didn't change it", () => {
    expect(mergeProgressDoc("level", "pre", "pre", "inter", T)).toBe("inter");
    expect(mergeProgressDoc("level", "pre", "upper", "inter", T)).toBe("upper");
  });

  it("nothing on the server yet: mine", () => {
    expect(mergeProgressDoc("known", undefined, { a: 1 }, null, T)).toEqual({
      a: 1,
    });
  });
});
