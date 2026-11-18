import { describe, expect, it } from "vitest";

import {
  activityMenu,
  IDLE_MS,
  tickCounts,
  TimeBuffer,
} from "../active-time.helper";

describe("active time", () => {
  it("counts only a visible tab with an interaction in the last minute", () => {
    const now = 1_000_000;
    expect(
      tickCounts({ now, lastInteraction: now - 1000, visible: true }),
    ).toBe(true);
    expect(
      tickCounts({ now, lastInteraction: now - IDLE_MS, visible: true }),
    ).toBe(true);
    expect(
      tickCounts({ now, lastInteraction: now - IDLE_MS - 1, visible: true }),
    ).toBe(false);
    expect(tickCounts({ now, lastInteraction: now, visible: false })).toBe(
      false,
    );
  });

  it("puts the time under the right menu", () => {
    expect(activityMenu("/vocab", false)).toBe("vocab");
    expect(activityMenu("/grammar/tense", false)).toBe("grammar");
    expect(activityMenu("/scenario/roleplay/order", false)).toBe("roleplay");
    expect(activityMenu("/scenario", false)).toBe("scenario");
    expect(activityMenu("/vocab", true)).toBe("exam");
    expect(activityMenu("/", false)).toBe("plan");
  });

  it("buffers seconds per menu until taken", () => {
    const b = new TimeBuffer();
    b.add("vocab", 5);
    b.add("vocab", 5);
    b.add("grammar", 5);
    expect(b.take()).toEqual([
      ["vocab", 10],
      ["grammar", 5],
    ]);
    expect(b.take()).toEqual([]);
  });
});
