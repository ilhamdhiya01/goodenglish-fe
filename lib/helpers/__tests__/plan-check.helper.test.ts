import { describe, expect, it } from "vitest";

import { AUTO_CHECK } from "@/const/plan.constant";

import { dayBlocks } from "../plan-check.helper";
import { streakOf } from "../streak.helper";

// 20411 = Wednesday 19 Nov 2025 (odd), 20410 = Tuesday (even), 20414 = Saturday.
const WED = 20411;
const TUE = 20410;
const SAT = 20414;

describe("Rencana tick rules", () => {
  it("opening the app ticks nothing on any day", () => {
    for (const T of [WED, TUE, SAT, SAT + 1]) {
      const d = dayBlocks({ T, due: 0, tally: undefined });
      expect(Object.values(d).some(Boolean)).toBe(false);
      expect(streakOf({ [T]: d }, T)).toBe(0);
    }
  });

  it("Ulang: reviewed until nothing is due, or the quiz on an empty day", () => {
    expect(dayBlocks({ T: WED, due: 0, tally: { day: WED, rev: 3 } }).b1).toBe(
      true,
    );
    expect(dayBlocks({ T: WED, due: 2, tally: { day: WED, rev: 3 } }).b1).toBe(
      false,
    );
    expect(
      dayBlocks({ T: WED, due: 0, tally: { day: WED, q1: true } }).b1,
    ).toBe(true);
    // Yesterday's counts don't carry over.
    expect(
      dayBlocks({ T: WED, due: 0, tally: { day: TUE, rev: 9, q1: true } }).b1,
    ).toBe(false);
  });

  it("Masuk and Bentuk keep their rules", () => {
    const d = dayBlocks({
      T: WED,
      due: 0,
      tally: { day: WED, known: AUTO_CHECK.known, ask: AUTO_CHECK.ask },
    });
    expect(d.b2).toBe(true);
    expect(d.b3).toBe(true);
    expect(dayBlocks({ T: TUE, due: 0, tally: { day: TUE, pron: 1 } }).b3).toBe(
      true,
    );
  });

  it("weekends: only Ulang, from the learning day (not the device clock)", () => {
    expect(dayBlocks({ T: SAT, due: 0, tally: { day: SAT, rev: 1 } })).toEqual({
      b1: true,
      b2: false,
      b3: false,
    });
    // A Friday finished in full stays a weekday record: its blocks are never
    // rewritten as a weekend (the Saturday 00:00–07:00 WIB bug).
    const FRI = SAT - 1;
    const fri = dayBlocks({
      T: FRI,
      due: 0,
      tally: { day: FRI, rev: 1, known: 10, ask: 20 },
    });
    expect(fri).toEqual({ b1: true, b2: true, b3: true });
  });
});
