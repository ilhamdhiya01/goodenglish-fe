import { describe, expect, it } from "vitest";

import {
  addEvent,
  addLearned,
  addReview,
  addSeconds,
  backfillActivity,
  DAYS_KEPT,
  emptyActivity,
  EVENTS_DAYS,
  mergeActivity,
  normalizeActivity,
  prune,
} from "../activity.helper";

const DAY = 86_400_000;
const T = 20411;

describe("activity log", () => {
  it("adds seconds, reviews and learned words per day", () => {
    let d = emptyActivity(T);
    d = addSeconds(d, T, "vocab", 5);
    d = addSeconds(d, T, "vocab", 5);
    d = addSeconds(d, T, "grammar", 0);
    d = addReview(d, T, true);
    d = addReview(d, T, false);
    d = addLearned(d, T, 1);
    d = addLearned(d, T, -1);
    d = addLearned(d, T, 1);
    expect(d.days[T]).toEqual({ m: { vocab: 10 }, r: 2, g: 1, l: 1 });
  });

  it("drops events older than 90 days and days older than 400", () => {
    let d = emptyActivity(T - 500);
    d = addSeconds(d, T - DAYS_KEPT, "vocab", 60);
    d = addSeconds(d, T - 100, "vocab", 60);
    d = addEvent(d, {
      id: "old",
      type: "reading",
      ts: (T - EVENTS_DAYS - 1) * DAY,
    });
    d = addEvent(d, { id: "new", type: "reading", ts: (T - 1) * DAY });
    const p = prune(d, T);
    expect(Object.keys(p.days)).toEqual([String(T - 100)]);
    expect(p.events.map((e) => e.id)).toEqual(["new"]);
  });

  it("ignores a missing or broken doc", () => {
    expect(normalizeActivity(undefined, T)).toBeNull();
    expect(normalizeActivity([], T)).toBeNull();
    const n = normalizeActivity(
      { since: T - 3, days: { [T]: { m: { vocab: "x", grammar: 30 }, r: 2 } } },
      T,
    );
    expect(n).toEqual({
      v: 1,
      since: T - 3,
      days: { [T]: { m: { grammar: 30 }, r: 2 } },
      events: [],
    });
  });

  it("merges an import: the larger value per day and menu, events by id", () => {
    const cur = {
      v: 1 as const,
      since: T - 2,
      days: { [T]: { m: { vocab: 100 }, r: 2, g: 2 } },
      events: [{ id: "a", type: "reading" as const, ts: T * DAY }],
    };
    const inc = {
      v: 1,
      since: T - 9,
      days: {
        [T]: { m: { vocab: 40, grammar: 70 }, r: 5, g: 1 },
        [T - 1]: { l: 3 },
      },
      events: [
        { id: "a", type: "reading", ts: T * DAY },
        { id: "b", type: "exam", ts: T * DAY },
      ],
    };
    const m = mergeActivity(cur, inc, T);
    expect(m.since).toBe(T - 9);
    expect(m.days[T]).toEqual({
      m: { vocab: 100, grammar: 70 },
      r: 5,
      g: 2,
    });
    expect(m.days[T - 1]).toEqual({ l: 3 });
    expect(m.events.map((e) => e.id)).toEqual(["a", "b"]);
    // Importing the same file twice changes nothing.
    expect(mergeActivity(m, inc, T)).toEqual(m);
  });

  it("backfills events (and Main peran minutes) from dated data", () => {
    const at = new Date((T - 2) * DAY + 3_600_000).toISOString();
    const d = backfillActivity(
      {
        plan: {
          quiz: [{ d: T - 1, score: 15, scope: "week", level: "pre", week: 1 }],
        },
        roleplay: [{ id: "r1", startedAt: at, durationSec: 300 }],
        listening: { results: [{ id: "l1", date: at, score: 4, total: 5 }] },
        reading: { results: [{ id: "x1", date: at, score: 2, total: 3 }] },
        exam: {
          attempts: [
            { id: "e1", date: at, level: "pre", pct: 80, passed: true },
          ],
        },
      },
      T,
    );
    expect(d.since).toBe(T);
    expect(d.events.map((e) => e.type).sort()).toEqual([
      "exam",
      "listening_set",
      "quick_test",
      "reading",
      "roleplay",
    ]);
    expect(d.days[T - 2]).toEqual({ m: { roleplay: 300 } });
    // Same ids on a second run: nothing doubles.
    expect(
      backfillActivity({ roleplay: [{ id: "r1", startedAt: at }] }, T).events,
    ).toHaveLength(1);
  });
});
