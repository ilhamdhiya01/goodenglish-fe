import { describe, expect, it } from "vitest";

import { allLevelData, dueKeysOf } from "../derived.helper";

describe("due cards", () => {
  it("cards of words that no longer exist are not counted (Ulang skips them)", () => {
    const all = allLevelData([]);
    const T = 30_000;
    const srs = {
      "1:w:be": { st: 1, due: T - 1 },
      "s:deleted-shared-word": { st: 1, due: T - 1 },
      "1:w:have": { st: 1, due: T + 3 },
    };
    const known = {
      "1:w:be": 1 as const,
      "s:deleted-shared-word": 1 as const,
      "1:w:have": 1 as const,
    };
    expect(dueKeysOf(srs, known, all, T)).toEqual(["1:w:be"]);
    // Without level data (older callers) every due key still counts.
    expect(dueKeysOf(srs, known, undefined, T)).toHaveLength(2);
  });
});
