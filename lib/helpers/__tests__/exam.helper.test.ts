import { describe, expect, it } from "vitest";

import type { ExamAttempt, ExamData } from "@/lib/types/exam.types";

import {
  EMPTY_EXAM,
  EXAM_RETRY_MS,
  examOpen,
  mergeExam,
  normalizeExam,
  retryIn,
  unlockedLevels,
} from "../exam.helper";

const attempt = (o: Partial<ExamAttempt>): ExamAttempt => ({
  id: "a",
  level: "pre",
  date: "2026-11-18T00:00:00.000Z",
  sections: {},
  pct: 60,
  passed: false,
  ...o,
});
const ALL = ["beginner", "pre", "inter", "upper"] as const;

describe("examOpen", () => {
  it("opens at 80% memorised or in the last week", () => {
    expect(examOpen({ known: 79, total: 100, week: 3, lastWeek: 12 })).toBe(
      false,
    );
    expect(examOpen({ known: 80, total: 100, week: 3, lastWeek: 12 })).toBe(
      true,
    );
    expect(examOpen({ known: 0, total: 100, week: 12, lastWeek: 12 })).toBe(
      true,
    );
  });
});

describe("retryIn", () => {
  it("waits 24 hours after a failed attempt, not after a pass", () => {
    const t = new Date("2026-11-18T00:00:00.000Z").getTime();
    const d: ExamData = { ...EMPTY_EXAM, attempts: [attempt({})] };
    expect(retryIn(d, "pre", t + 1000)).toBe(EXAM_RETRY_MS - 1000);
    expect(retryIn(d, "pre", t + EXAM_RETRY_MS)).toBe(0);
    expect(retryIn(d, "inter", t)).toBe(0);
    const passed = {
      ...d,
      attempts: [attempt({ id: "b", passed: true }), ...d.attempts],
    };
    expect(retryIn(passed, "pre", t)).toBe(0);
  });
});

describe("unlockedLevels", () => {
  it("is everything the token allows when the exam isn't required", () => {
    expect(
      unlockedLevels({
        allowed: [...ALL],
        requireExam: false,
        exam: EMPTY_EXAM,
        current: "beginner",
      }),
    ).toEqual([...ALL]);
  });

  it("opens one level past the start level per exam passed", () => {
    const base = { ...EMPTY_EXAM, base: "pre" as const };
    expect(
      unlockedLevels({
        allowed: [...ALL],
        requireExam: true,
        exam: base,
        current: "pre",
      }),
    ).toEqual(["beginner", "pre"]);
    const passedPre = { ...base, attempts: [attempt({ passed: true })] };
    expect(
      unlockedLevels({
        allowed: [...ALL],
        requireExam: true,
        exam: passedPre,
        current: "pre",
      }),
    ).toEqual(["beginner", "pre", "inter"]);
    // Still only what the token allows.
    expect(
      unlockedLevels({
        allowed: ["pre"],
        requireExam: true,
        exam: passedPre,
        current: "pre",
      }),
    ).toEqual(["pre"]);
  });
});

describe("normalize / merge", () => {
  it("drops broken data and merges attempts by id", () => {
    expect(normalizeExam({ attempts: [{ x: 1 }], base: "nope" })).toEqual(
      EMPTY_EXAM,
    );
    const cur: ExamData = {
      placement: null,
      attempts: [attempt({ id: "a" })],
      base: "pre",
    };
    const m = mergeExam(cur, {
      placement: {
        status: "done",
        date: "2026-11-01T00:00:00.000Z",
        recommended: { level: "inter", week: 1 },
      },
      attempts: [
        attempt({ id: "a" }),
        attempt({ id: "b", date: "2026-11-19T00:00:00.000Z", passed: true }),
      ],
      base: "beginner",
    });
    expect(m.attempts.map((a) => a.id)).toEqual(["b", "a"]);
    expect(m.placement?.status).toBe("done");
    expect(m.base).toBe("pre");
  });
});
