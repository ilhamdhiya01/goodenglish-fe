import { describe, expect, it } from "vitest";

import { dayDone, isWeekend, mondayOf, streakOf } from "../streak.helper";

// 20411 = Wednesday 19 Nov 2025 (UTC).
const WED = 20411;
const full = { b1: true, b2: true, b3: true };

describe("streakOf", () => {
  it("knows weekends and Mondays", () => {
    expect(isWeekend(WED)).toBe(false);
    expect(isWeekend(WED - 3)).toBe(true); // Sunday
    expect(isWeekend(WED - 4)).toBe(true); // Saturday
    expect(mondayOf(WED)).toBe(WED - 2);
    expect(mondayOf(WED - 2)).toBe(WED - 2);
  });

  it("weekdays need 3 blocks, weekends 1", () => {
    expect(dayDone({ [WED]: { b1: true, b2: true } }, WED)).toBe(false);
    expect(dayDone({ [WED - 3]: { b1: true } }, WED - 3)).toBe(true);
  });

  it("counts back while days are done; today only once done", () => {
    const days = {
      [WED]: full,
      [WED - 1]: full,
      [WED - 2]: full,
      [WED - 3]: { b2: true },
      [WED - 5]: full,
    };
    expect(streakOf(days, WED)).toBe(4);
    expect(streakOf({ ...days, [WED]: { b1: true } }, WED)).toBe(3);
    expect(streakOf({}, WED)).toBe(0);
  });
});
