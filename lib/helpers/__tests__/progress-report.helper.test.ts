import { describe, expect, it } from "vitest";

import { buildProgressReport, WEEKS } from "../progress-report.helper";
import { today } from "../storage.helper";
import { mondayOf } from "../streak.helper";

const T = today();
const full = { b1: true, b2: true, b3: true };

describe("buildProgressReport", () => {
  it("hides everything without data", () => {
    const r = buildProgressReport({}, { today: T });
    expect(r.summary).toEqual({
      streak: 0,
      minutes7d: null,
      known: 0,
      dueToday: 0,
    });
    expect(r.calendar).toBeNull();
    expect(r.learned).toBeNull();
    expect(r.retention).toBeNull();
    expect(r.skills).toBeNull();
    expect(r.grammar).toEqual([]);
    expect(r.focus).toEqual([]);
    expect(r.checkpoints).toEqual([]);
    expect(r.since).toBeNull();
  });

  it("counts a word known in two levels once, and due cards", () => {
    const r = buildProgressReport(
      {
        known: { "1:w:cat": 1, "beg|3:w:cat": 1, "1:w:dog": 1 },
        srs: { "1:w:dog": { due: T - 1, iv: 1, ef: 2.5, n: 1 } },
      },
      { today: T },
    );
    expect(r.summary.known).toBe(2);
    expect(r.summary.dueToday).toBe(1);
  });

  it("builds 12 weeks of calendar, words and retention", () => {
    const m = mondayOf(T);
    const r = buildProgressReport(
      {
        plan: { days: { [T]: full, [m - 7]: { b1: true } } },
        activity: {
          v: 1,
          since: m - 7,
          days: {
            [T]: { l: 4, r: 4, g: 3, m: { vocab: 300 } },
            [m - 7]: { l: 2 },
          },
          events: [],
        },
      },
      { today: T },
    );
    expect(r.calendar![0].day).toBe(m - (WEEKS - 1) * 7);
    expect(r.calendar!.at(-1)).toEqual({ day: T, blocks: 3 });
    expect(r.learned).toHaveLength(WEEKS);
    expect(r.learned!.at(-1)).toEqual({ week: m, value: 4 });
    expect(r.learned!.at(-2)).toEqual({ week: m - 7, value: 2 });
    expect(r.retention!.at(-1)).toEqual({ week: m, reviews: 4, pct: 75 });
    expect(r.retention!.at(-2)!.pct).toBeNull();
    expect(r.summary.minutes7d).toBe(5);
    expect(r.since).toBe(m - 7);
  });

  it("lists grammar topics from the lowest accuracy, with practice links", () => {
    const r = buildProgressReport(
      {
        askprac: {
          tense1: { seen: 6, right: 3 },
          tense2: { seen: 6, right: 3 },
          r1: { seen: 10, right: 9 },
          irr1: { seen: 2, right: 0 },
        },
      },
      { today: T },
    );
    expect(r.grammar.map((g) => [g.topic, g.pct, g.seen, g.href])).toEqual([
      ["tense", 50, 12, "/grammar/tense"],
      ["r", 90, 10, "/grammar/ask"],
    ]);
    expect(r.focus[0]).toMatchObject({
      href: "/grammar/tense",
      title: "Latih Memilih tense",
    });
    // No Grammar menu on the token: no grammar recommendation.
    expect(
      buildProgressReport(
        { askprac: { tense1: { seen: 12, right: 3 } } },
        { today: T, menus: ["vocab"] },
      ).focus,
    ).toEqual([]);
  });

  it("recommends the weakest sound and skills with no minutes this week", () => {
    const r = buildProgressReport(
      {
        listening: { pairs: { "θ|s:1": { right: 1, total: 4 } } },
        activity: {
          v: 1,
          since: T - 10,
          days: { [T]: { m: { vocab: 600, roleplay: 120 } } },
          events: [],
        },
      },
      { today: T },
    );
    expect(r.skills!.find((s) => s.id === "vocab")!.minutes).toBe(10);
    expect(r.skills!.find((s) => s.id === "speaking")!.minutes).toBe(2);
    expect(r.skillNotes).toEqual([
      "Minggu ini belum latihan grammar.",
      "Minggu ini belum latihan menyimak.",
      "Minggu ini belum latihan membaca.",
    ]);
    expect(r.focus.map((f) => f.href)).toEqual([
      "/listening/bunyi",
      "/grammar/tense",
      "/listening/dikte",
    ]);
  });

  it("doesn't nag about skills before a full week was recorded", () => {
    const r = buildProgressReport(
      { activity: { v: 1, since: T - 2, days: {}, events: [] } },
      { today: T },
    );
    expect(r.skillNotes).toEqual([]);
  });

  it("rebuilds weekly checkpoints from quick tests, recordings and Main peran", () => {
    const r = buildProgressReport(
      {
        plan: {
          quiz: [
            { d: T, scope: "week", level: "pre", week: 2, score: 14 },
            { d: T, scope: "week", level: "pre", week: 2, score: 17 },
            { d: T, scope: "week", level: "pre", week: 1, score: 12 },
          ],
          week: { "pre|2": { rec: true } },
        },
        roleplay: [{ level: "pre", week: 2, durationSec: 660 }],
      },
      { today: T },
    );
    expect(r.checkpoints).toEqual([
      {
        level: "pre",
        week: 2,
        quizBest: 17,
        quizTotal: 20,
        rec: true,
        roleplayMin: 11,
        passed: true,
      },
      {
        level: "pre",
        week: 1,
        quizBest: 12,
        quizTotal: 20,
        rec: false,
        roleplayMin: 0,
        passed: false,
      },
    ]);
  });
});

describe("buildProgressReport: empty log", () => {
  it("hides words and skills while everything is zero", () => {
    const r = buildProgressReport(
      { activity: { v: 1, since: T - 10, days: {}, events: [] } },
      { today: T },
    );
    expect(r.learned).toBeNull();
    expect(r.skills).toBeNull();
    expect(r.skillNotes).toEqual([]);
    expect(r.summary.minutes7d).toBe(0);
    expect(r.focus.length).toBe(3);
  });
});
